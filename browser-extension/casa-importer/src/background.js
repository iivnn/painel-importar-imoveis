import { mapDraftToCreateRequest } from './shared/mapping.js';
import { getSettings } from './shared/settings.js';

chrome.runtime.onInstalled.addListener(async () => {
  await getSettings();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'write-log') {
    handleWriteLog(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));

    return true;
  }

  if (message?.type === 'import-listing') {
    handleImportListing(message.payload)
      .then(result => sendResponse({ ok: true, result }))
      .catch(error => sendResponse({ ok: false, error: error.message || 'Falha ao importar anuncio.' }));

    return true;
  }

  if (message?.type === 'enrich-listing') {
    handleEnrichListing(message.payload)
      .then(draft => sendResponse({ ok: true, draft }))
      .catch(error => sendResponse({ ok: false, error: error.message || 'Falha ao enriquecer anuncio.' }));

    return true;
  }

  if (message?.type === 'get-settings') {
    getSettings()
      .then(settings => sendResponse({ ok: true, settings }))
      .catch(error => sendResponse({ ok: false, error: error.message || 'Falha ao carregar configuracoes.' }));

    return true;
  }

  return false;
});

async function handleImportListing(draft) {
  const settings = await getSettings();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs);
  const targetUrl = `${settings.apiBaseUrl}/api/properties`;
  const normalizedImageLimit = Math.max(1, Number(settings.maxImagesToImport || 10));
  const limitedDraft = {
    ...draft,
    images: Array.isArray(draft?.images)
      ? draft.images
        .map(image => String(image || '').trim())
        .filter(Boolean)
        .slice(0, normalizedImageLimit)
      : []
  };

  try {
    await handleWriteLog({
      level: 'Info',
      category: 'Importacao',
      eventName: 'ImportListingStarted',
      message: 'Importacao de anuncio iniciada pela extensao.',
      details: {
        title: limitedDraft?.title || '',
        pageUrl: limitedDraft?.pageUrl || '',
        source: limitedDraft?.source || '',
        imageCount: Array.isArray(limitedDraft?.images) ? limitedDraft.images.length : 0,
        maxImagesToImport: normalizedImageLimit
      },
      path: limitedDraft?.pageUrl || ''
    });

    const enrichedDraft = await enrichDraftWithPostalCode(limitedDraft, controller.signal);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mapDraftToCreateRequest(enrichedDraft)),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `API retornou status ${response.status}.`);
    }

    const importResult = await parseSuccessfulImportResponse(response);
    const propertyId = resolvePropertyId(importResult, response);

    if (propertyId && limitedDraft?.importImages !== false && Array.isArray(limitedDraft?.images) && limitedDraft.images.length > 0) {
      try {
        const imageImportSummary = await uploadPropertyImages(
          settings.apiBaseUrl,
          propertyId,
          limitedDraft.images,
          limitedDraft,
          controller.signal
        );

        await handleWriteLog({
          level: imageImportSummary.failedCount > 0 ? 'Warning' : 'Info',
          category: 'Importacao',
          eventName: imageImportSummary.failedCount > 0 ? 'ImportImagesPartiallySucceeded' : 'ImportImagesSucceeded',
          message: imageImportSummary.failedCount > 0
            ? 'As imagens do anuncio foram importadas parcialmente.'
            : 'As imagens do anuncio foram importadas com sucesso.',
          details: {
            propertyId,
            detectedCount: imageImportSummary.detectedCount,
            requestedCount: imageImportSummary.requestedCount,
            uploadedByUrlImport: imageImportSummary.uploadedByUrlImport,
            uploadedByFileFallback: imageImportSummary.uploadedByFileFallback,
            uploadedCount: imageImportSummary.uploadedCount,
            failedCount: imageImportSummary.failedCount,
            failedItems: imageImportSummary.failedItems
          },
          relatedEntityType: 'Property',
          relatedEntityId: String(propertyId),
          path: limitedDraft?.pageUrl || ''
        });

        return {
          ...importResult,
          propertyId,
          uploadedImages: imageImportSummary.uploadedCount,
          imageImportSummary
        };
      } catch (error) {
        await handleWriteLog({
          level: 'Warning',
          category: 'Importacao',
          eventName: 'ImportImagesFailed',
          message: 'O anuncio foi criado, mas o envio das imagens falhou.',
          details: {
            propertyId,
            imageCount: limitedDraft.images.length,
            error: error instanceof Error ? error.message : 'Falha desconhecida.'
          },
          relatedEntityType: 'Property',
          relatedEntityId: String(propertyId),
          path: limitedDraft?.pageUrl || ''
        });

        await handleWriteLog({
          level: 'Info',
          category: 'Importacao',
          eventName: 'ImportListingSucceededWithoutImages',
          message: 'Anuncio importado com sucesso, sem imagens anexadas.',
          details: {
            propertyId,
            title: limitedDraft?.title || ''
          },
          relatedEntityType: 'Property',
          relatedEntityId: String(propertyId),
          path: limitedDraft?.pageUrl || ''
        });

        return {
          ...importResult,
          propertyId,
          uploadedImages: 0,
          imageImportError: error instanceof Error ? error.message : 'Falha ao enviar imagens.'
        };
      }
    }

        await handleWriteLog({
          level: 'Info',
          category: 'Importacao',
          eventName: 'ImportListingSucceeded',
          message: 'Anuncio importado com sucesso pela extensao.',
          details: {
            propertyId,
            title: limitedDraft?.title || '',
            importedImages: 0
          },
      relatedEntityType: 'Property',
      relatedEntityId: propertyId ? String(propertyId) : '',
          path: limitedDraft?.pageUrl || ''
        });

    return {
      ...importResult,
      propertyId,
      uploadedImages: 0
    };
  } catch (error) {
    await handleWriteLog({
      level: 'Error',
      category: 'Importacao',
      eventName: 'ImportListingFailed',
      message: error instanceof Error ? error.message : 'Falha ao importar anuncio.',
      details: {
        title: draft?.title || '',
        pageUrl: limitedDraft?.pageUrl || '',
        source: limitedDraft?.source || '',
        maxImagesToImport: normalizedImageLimit
      },
      path: limitedDraft?.pageUrl || ''
    });

    throw createImportError(error, settings.apiBaseUrl, targetUrl);
  } finally {
    clearTimeout(timeout);
  }
}

async function handleEnrichListing(draft) {
  const settings = await getSettings();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs);

  try {
    const enrichedDraft = await enrichDraftWithPostalCode(draft, controller.signal);

    await handleWriteLog({
      level: enrichedDraft?.latitude && enrichedDraft?.longitude ? 'Info' : 'Warning',
      category: 'Geocodificacao',
      eventName: enrichedDraft?.latitude && enrichedDraft?.longitude ? 'CoordinatesResolved' : 'CoordinatesMissing',
      message: enrichedDraft?.latitude && enrichedDraft?.longitude
        ? 'Coordenadas resolvidas para o anuncio.'
        : 'A extensao nao conseguiu resolver coordenadas para o anuncio.',
      details: {
        pageUrl: draft?.pageUrl || '',
        title: draft?.title || '',
        latitude: enrichedDraft?.latitude ?? null,
        longitude: enrichedDraft?.longitude ?? null,
        geoDebug: enrichedDraft?.geoDebug || []
      },
      path: draft?.pageUrl || ''
    });

    return enrichedDraft;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleWriteLog(payload) {
  const settings = await getSettings();

  try {
    await fetch(`${settings.apiBaseUrl}/api/logs/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'Extension',
        level: payload?.level || 'Info',
        category: payload?.category || 'Extensao',
        eventName: payload?.eventName || 'UnknownEvent',
        message: payload?.message || 'Evento da extensao sem mensagem.',
        details: payload?.details ?? null,
        traceId: payload?.traceId || '',
        path: payload?.path || '',
        method: payload?.method || '',
        userAgent: navigator.userAgent,
        relatedEntityType: payload?.relatedEntityType || '',
        relatedEntityId: payload?.relatedEntityId || '',
        createdAtUtc: new Date().toISOString()
      })
    });
  } catch {
    // Silencioso por definicao. O sistema nao pode quebrar por falha de log.
  }
}

async function enrichDraftWithPostalCode(draft, signal) {
  let debugDraft = addGeoDebug(draft, 'Inicio do enriquecimento de coordenadas.');
  debugDraft = await enrichDraftFromCoordinates(debugDraft, signal);
  debugDraft = await enrichDraftLocationFromPostalCode(debugDraft, signal);
  debugDraft = await enrichDraftCoordinatesFromPostalCode(debugDraft, signal);
  debugDraft = await enrichDraftCoordinatesFromAddress(debugDraft, signal);
  debugDraft = await enrichDraftFromCoordinates(debugDraft, signal);
  const fromAddressCoordinates = debugDraft;
  const location = fromAddressCoordinates?.location || {};
  const postalCode = String(location.postalCode || '').trim();
  const addressLine = String(location.addressLine || '').trim();
  const city = String(location.city || '').trim();
  const state = String(location.state || '').trim();

  if (postalCode || !addressLine || !city || !state) {
    return addGeoDebug(fromAddressCoordinates, 'Fluxo finalizado sem consulta complementar por rua.');
  }

  const street = addressLine.split(',')[0]?.trim();
  if (!street) {
    return fromAddressCoordinates;
  }

  const url = `https://viacep.com.br/ws/${encodeURIComponent(state)}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    return addGeoDebug(fromAddressCoordinates, `ViaCEP por rua falhou com status ${response.status}.`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return addGeoDebug(fromAddressCoordinates, 'ViaCEP por rua nao encontrou resultados.');
  }

  const neighborhood = String(location.neighborhood || '').trim().toLowerCase();
  const matched =
    results.find(item => neighborhood && String(item?.bairro || '').trim().toLowerCase() === neighborhood) ||
    results[0];

  return addGeoDebug({
    ...fromAddressCoordinates,
    location: {
      ...location,
      addressLine: location.addressLine || matched?.logradouro || '',
      neighborhood: location.neighborhood || matched?.bairro || '',
      city: location.city || matched?.localidade || '',
      state: location.state || matched?.uf || '',
      postalCode: matched?.cep || ''
    }
  }, 'ViaCEP por rua complementou o endereco.');
}

async function enrichDraftLocationFromPostalCode(draft, signal) {
  const location = draft?.location || {};
  const postalCode = String(location.postalCode || '').replace(/[^\d]/g, '').trim();

  if (postalCode.length !== 8) {
    return addGeoDebug(draft, 'CEP ausente ou invalido para consulta no ViaCEP.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, { signal });
  if (!response.ok) {
    return addGeoDebug(draft, `ViaCEP por CEP falhou com status ${response.status}.`);
  }

  const result = await response.json();
  if (!result || result.erro) {
    return addGeoDebug(draft, 'ViaCEP por CEP nao encontrou endereco.');
  }

  return addGeoDebug({
    ...draft,
    location: {
      ...location,
      addressLine: String(location.addressLine || result.logradouro || '').trim(),
      neighborhood: String(location.neighborhood || result.bairro || '').trim(),
      city: String(location.city || result.localidade || '').trim(),
      state: String(location.state || result.uf || '').trim(),
      postalCode: result.cep || location.postalCode || ''
    }
  }, 'ViaCEP por CEP retornou endereco para geocodificacao.');
}

async function enrichDraftCoordinatesFromPostalCode(draft, signal) {
  const latitude = normalizeCoordinateValue(draft?.latitude);
  const longitude = normalizeCoordinateValue(draft?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return addGeoDebug(draft, 'Coordenadas ja vieram preenchidas antes da busca por CEP.');
  }

  const location = draft?.location || {};
  const postalCode = String(location.postalCode || '').replace(/[^\d-]/g, '').trim();

  if (!postalCode) {
    return addGeoDebug(draft, 'Nao foi possivel buscar coordenadas por CEP porque o CEP esta vazio.');
  }

  const searchTerms = [
    location.addressLine,
    location.neighborhood,
    location.city,
    location.state,
    postalCode,
    'Brasil'
  ].filter(Boolean);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(searchTerms.join(', '))}`;
  const response = await fetch(url, {
    signal,
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return addGeoDebug(draft, `Nominatim por CEP/endereco falhou com status ${response.status}.`);
  }

  const results = await response.json();
  const first = Array.isArray(results) ? results[0] : null;

  if (!first?.lat || !first?.lon) {
    return addGeoDebug(draft, 'Nominatim por CEP/endereco nao retornou coordenadas.');
  }

  return addGeoDebug({
    ...draft,
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    hasExactLocation: false
  }, `Coordenadas aproximadas encontradas via CEP/endereco: ${first.lat}, ${first.lon}.`);
}

async function enrichDraftFromCoordinates(draft, signal) {
  const location = draft?.location || {};
  const latitude = normalizeCoordinateValue(draft?.latitude);
  const longitude = normalizeCoordinateValue(draft?.longitude);

  if (
    (!Number.isFinite(latitude) || !Number.isFinite(longitude)) ||
    (String(location.state || '').trim() && String(location.postalCode || '').trim())
  ) {
    return addGeoDebug(draft, 'Busca reversa ignorada: sem coordenadas validas de origem ou localizacao textual ja preenchida.');
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
  const response = await fetch(url, {
    signal,
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return addGeoDebug(draft, `Busca reversa falhou com status ${response.status}.`);
  }

  const result = await response.json();
  const address = result?.address || {};

  const road = [address.road, address.house_number].filter(Boolean).join(', ');
  const stateCode = String(address.state_code || '').replace(/^BR-/, '').trim();

  return addGeoDebug({
    ...draft,
    location: {
      ...location,
      addressLine: String(location.addressLine || road || result?.name || '').trim(),
      neighborhood: String(location.neighborhood || address.suburb || address.neighbourhood || '').trim(),
      city: String(location.city || address.city || address.town || address.village || '').trim(),
      state: String(location.state || stateCode || address.state || '').trim(),
      postalCode: String(location.postalCode || address.postcode || '').trim()
    }
  }, 'Busca reversa preencheu localizacao textual a partir de coordenadas existentes.');
}

async function enrichDraftCoordinatesFromAddress(draft, signal) {
  const latitude = normalizeCoordinateValue(draft?.latitude);
  const longitude = normalizeCoordinateValue(draft?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return addGeoDebug(draft, 'Busca por endereco ignorada: coordenadas ja presentes.');
  }

  const location = draft?.location || {};
  const searchStrategies = buildGeocodeStrategies(location);

  if (searchStrategies.length === 0) {
    return addGeoDebug(draft, 'Busca por endereco ignorada: dados textuais insuficientes para geocodificar.');
  }

  for (const strategy of searchStrategies) {
    const result = await searchCoordinatesByQuery(strategy.query, signal);

    if (result.status === 'http_error') {
      return addGeoDebug(draft, `Nominatim falhou com status ${result.statusCode} na estrategia ${strategy.label}.`);
    }

    if (result.status === 'success') {
      return addGeoDebug({
        ...draft,
        latitude: result.latitude,
        longitude: result.longitude,
        hasExactLocation: false
      }, `Coordenadas aproximadas encontradas via ${strategy.label}: ${result.latitude}, ${result.longitude}.`);
    }

    draft = addGeoDebug(draft, `Sem resultado via ${strategy.label}.`);
  }

  return addGeoDebug(draft, 'Nominatim por endereco nao encontrou coordenadas em nenhuma estrategia.');
}

function buildGeocodeStrategies(location) {
  const addressLine = String(location?.addressLine || '').trim();
  const neighborhood = String(location?.neighborhood || '').trim();
  const city = String(location?.city || '').trim();
  const state = String(location?.state || '').trim();

  const strategies = [];
  const seen = new Set();

  function pushStrategy(label, parts) {
    const query = parts.map(part => String(part || '').trim()).filter(Boolean).join(', ');
    if (!query || seen.has(query.toLowerCase())) {
      return;
    }

    seen.add(query.toLowerCase());
    strategies.push({ label, query });
  }

  pushStrategy('endereco completo', [addressLine, neighborhood, city, state, 'Brasil']);
  pushStrategy('bairro + cidade', [neighborhood, city, state, 'Brasil']);
  pushStrategy('cidade + estado', [city, state, 'Brasil']);

  return strategies;
}

async function searchCoordinatesByQuery(query, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    signal,
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return {
      status: 'http_error',
      statusCode: response.status
    };
  }

  const results = await response.json();
  const first = Array.isArray(results) ? results[0] : null;

  if (!first?.lat || !first?.lon) {
    return { status: 'not_found' };
  }

  return {
    status: 'success',
    latitude: Number(first.lat),
    longitude: Number(first.lon)
  };
}

function addGeoDebug(draft, message) {
  const geoDebug = Array.isArray(draft?.geoDebug) ? draft.geoDebug : [];
  return {
    ...draft,
    geoDebug: [...geoDebug, message]
  };
}

function normalizeCoordinateValue(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return null;
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed === 0) {
    return null;
  }

  return parsed;
}

function createImportError(error, apiBaseUrl, targetUrl) {
  if (error?.name === 'AbortError') {
    return new Error(`Tempo esgotado ao tentar acessar ${targetUrl}. Verifique se a API local respondeu a tempo.`);
  }

  if (error instanceof TypeError) {
    return new Error(
      [
        `Falha de rede ao tentar acessar ${targetUrl}.`,
        `Confira se a API local esta rodando em ${apiBaseUrl}.`,
        'Se estiver usando HTTPS no localhost, confirme que o certificado de desenvolvimento esta confiavel no navegador.',
        'Depois de alterar permissoes da extensao, recarregue a extensao em chrome://extensions.',
        `Detalhe tecnico: ${error.message || 'TypeError sem mensagem.'}`
      ].join(' ')
    );
  }

  return error instanceof Error
    ? error
    : new Error('Falha ao importar anuncio.');
}

async function parseSuccessfulImportResponse(response) {
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();

  if (!contentType.includes('application/json')) {
    return {
      status: response.status,
      ok: true
    };
  }

  try {
    return await response.json();
  } catch {
    return {
      status: response.status,
      ok: true
    };
  }
}

function resolvePropertyId(importResult, response) {
  const candidate =
    importResult?.propertyId ??
    importResult?.id;

  if (Number.isInteger(candidate) && candidate > 0) {
    return candidate;
  }

  const locationHeader = response.headers.get('location') || '';
  const match = locationHeader.match(/\/api\/properties\/(\d+)$/i);
  return match ? Number(match[1]) : null;
}

async function uploadPropertyImages(apiBaseUrl, propertyId, imageUrls, draft, signal) {
  const settings = await getSettings();
  const normalizedImageLimit = Math.max(1, Number(settings.maxImagesToImport || 10));
  const filteredImageUrls = Array.from(new Set(
    (imageUrls || [])
      .map(url => String(url || '').trim())
      .filter(Boolean)
  )).slice(0, normalizedImageLimit);

  if (filteredImageUrls.length === 0) {
    throw new Error('Nenhuma imagem disponivel para upload.');
  }

  const summary = {
    detectedCount: Array.isArray(imageUrls) ? imageUrls.length : 0,
    requestedCount: filteredImageUrls.length,
    uploadedByUrlImport: 0,
    uploadedByFileFallback: 0,
    failedCount: 0,
    uploadedCount: 0,
    failedItems: []
  };

  const shouldPreferDirectFileUpload = prefersDirectFileUpload(draft, filteredImageUrls);

  if (!shouldPreferDirectFileUpload) {
    try {
      const urlImportResult = await uploadPropertyImagesByUrlImport(
        apiBaseUrl,
        propertyId,
        filteredImageUrls,
        normalizedImageLimit,
        signal
      );

      summary.uploadedByUrlImport = urlImportResult.importedCount;
      summary.failedItems.push(...urlImportResult.failedItems);

      if (urlImportResult.remainingUrls.length === 0) {
        summary.failedCount = summary.failedItems.length;
        summary.uploadedCount = summary.uploadedByUrlImport;
        return summary;
      }
    
      const fileUploadResult = await uploadPropertyImagesAsFiles(
        apiBaseUrl,
        propertyId,
        urlImportResult.remainingUrls,
        normalizedImageLimit,
        signal
      );

      summary.uploadedByFileFallback = fileUploadResult.uploadedCount;
      summary.failedItems.push(...fileUploadResult.failedItems);
      summary.failedCount = summary.failedItems.length;
      summary.uploadedCount = summary.uploadedByUrlImport + summary.uploadedByFileFallback;
      return summary;
    } catch (error) {
      await handleWriteLog({
        level: 'Warning',
        category: 'Importacao',
        eventName: 'ImageUrlImportFallbackTriggered',
        message: 'A importacao por URL falhou ou ficou incompleta. A extensao tentou reenviar as imagens como arquivo.',
        details: {
          propertyId,
          requestedCount: filteredImageUrls.length,
          error: error instanceof Error ? error.message : 'Falha desconhecida.'
        },
        relatedEntityType: 'Property',
        relatedEntityId: String(propertyId)
      });
    }
  } else {
    await handleWriteLog({
      level: 'Info',
      category: 'Importacao',
      eventName: 'ImageDirectFileUploadPreferred',
      message: 'A extensao priorizou envio direto de imagens como arquivo para melhorar compatibilidade do portal.',
      details: {
        propertyId,
        requestedCount: filteredImageUrls.length,
        source: draft?.source || '',
        pageUrl: draft?.pageUrl || ''
      },
      relatedEntityType: 'Property',
      relatedEntityId: String(propertyId)
    });
  }

  const fileUploadResult = await uploadPropertyImagesAsFiles(
    apiBaseUrl,
    propertyId,
    filteredImageUrls,
    normalizedImageLimit,
    signal
  );
  summary.uploadedByFileFallback = fileUploadResult.uploadedCount;
  summary.failedItems.push(...fileUploadResult.failedItems);
  summary.failedCount = summary.failedItems.length;
  summary.uploadedCount = fileUploadResult.uploadedCount;
  return summary;
}

function prefersDirectFileUpload(draft, imageUrls) {
  const pageUrl = String(draft?.pageUrl || '').toLowerCase();
  const source = String(draft?.source || '').toLowerCase();
  const hasNetimoveisImage = (imageUrls || []).some(url => String(url || '').toLowerCase().includes('netimoveis'));

  return (
    source.includes('olx') ||
    pageUrl.includes('olx.com.br')
  ) && !hasNetimoveisImage;
}

async function uploadPropertyImagesByUrlImport(apiBaseUrl, propertyId, imageUrls, maxImages, signal) {
  const attachmentsUrl = `${apiBaseUrl}/api/properties/${propertyId}/attachments/import-urls?maxImages=${encodeURIComponent(maxImages)}`;
  const response = await fetch(attachmentsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      kind: 'Foto',
      imageUrls
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API retornou status ${response.status} ao importar imagens por URL.`);
  }

  const result = await response.json().catch(() => null);
  const importedUrls = Array.isArray(result?.importedUrls)
    ? result.importedUrls.map(url => String(url || '').trim()).filter(Boolean)
    : [];
  const failedItems = Array.isArray(result?.failedItems)
    ? result.failedItems
    : [];
  const importedCount = importedUrls.length || (Array.isArray(result?.attachments) ? result.attachments.length : 0);
  const remainingUrls = importedUrls.length > 0
    ? imageUrls.filter(url => !importedUrls.includes(url))
    : importedCount > 0
      ? []
      : imageUrls;

  return {
    importedCount: Number(result?.importedCount ?? importedCount ?? 0),
    importedUrls,
    remainingUrls,
    failedItems
  };
}

async function uploadPropertyImagesAsFiles(apiBaseUrl, propertyId, imageUrls, maxImages, signal) {
  const attachmentsUrl = `${apiBaseUrl}/api/properties/${propertyId}/attachments?maxImages=${encodeURIComponent(maxImages)}`;
  const formData = new FormData();
  formData.append('kind', 'Foto');
  const normalizedMaxImages = Math.max(1, Number(maxImages || 10));
  const limitedImageUrls = Array.from(new Set(
    (imageUrls || [])
      .map(url => String(url || '').trim())
      .filter(Boolean)
  )).slice(0, normalizedMaxImages);

  let appendedFiles = 0;
  const failedItems = [];

  await handleWriteLog({
    level: 'Info',
    category: 'Importacao',
    eventName: 'ImageFileUploadBatchPrepared',
    message: 'A extensao preparou o lote final de imagens para envio por arquivo.',
    details: {
      propertyId,
      receivedImageCount: Array.isArray(imageUrls) ? imageUrls.length : 0,
      normalizedMaxImages,
      limitedImageCount: limitedImageUrls.length
    },
    relatedEntityType: 'Property',
    relatedEntityId: String(propertyId)
  });

  for (let index = 0; index < limitedImageUrls.length; index += 1) {
    const imageUrl = limitedImageUrls[index];
    const normalizedBlob = await fetchAndNormalizeImageBlob(imageUrl, signal);

    if (!normalizedBlob) {
      failedItems.push({
        imageUrl,
        reason: 'BlobNormalizationFailed'
      });
      continue;
    }

    const extension = inferImageExtension(normalizedBlob.type, imageUrl);
    const file = new File([normalizedBlob], `importada-${index + 1}.${extension}`, {
      type: normalizedBlob.type || 'image/jpeg'
    });

    formData.append('files', file, file.name);
    appendedFiles += 1;
  }

  if (appendedFiles === 0) {
    const failedReasons = failedItems.map(item => item?.reason).filter(Boolean);
    const reasonSuffix = failedReasons.length > 0
      ? ` Motivos: ${Array.from(new Set(failedReasons)).join(', ')}.`
      : '';
    throw new Error(`Nenhuma imagem valida ficou disponivel para upload.${reasonSuffix}`);
  }

  const response = await fetch(attachmentsUrl, {
    method: 'POST',
    body: formData,
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API retornou status ${response.status} ao enviar imagens.`);
  }

  const result = await response.json().catch(() => null);
  return {
    uploadedCount: Number(result?.uploadedCount ?? appendedFiles),
    failedItems: [
      ...failedItems,
      ...(Array.isArray(result?.skippedFiles) ? result.skippedFiles : [])
    ]
  };
}

async function fetchAndNormalizeImageBlob(imageUrl, signal) {
  try {
    const response = await fetch(imageUrl, {
      signal,
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    if (!blob || blob.size < 1024) {
      return null;
    }

    if (String(blob.type || '').toLowerCase().startsWith('text/')) {
      return null;
    }

    return await normalizeImageBlobForUpload(blob, imageUrl);
  } catch {
    return null;
  }
}

async function normalizeImageBlobForUpload(blob, imageUrl) {
  const inferredType = inferImageMimeType(blob?.type, imageUrl);

  if (isSupportedImageType(inferredType, imageUrl)) {
    return blob.type === inferredType
      ? blob
      : new Blob([blob], { type: inferredType });
  }

  if (inferredType === 'image/avif' || inferredType === 'image/svg+xml') {
    return await convertImageBlobToJpeg(blob);
  }

  if (!blob?.type && isLikelyImageUrl(imageUrl)) {
    return await convertImageBlobToJpeg(blob);
  }

  return null;
}

async function convertImageBlobToJpeg(blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');

    if (!context) {
      bitmap.close();
      return null;
    }

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    return await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.92
    });
  } catch {
    return null;
  }
}

function isLikelyImageUrl(imageUrl) {
  const normalized = String(imageUrl || '').toLowerCase();
  return ['image', 'foto', 'photo', 'mediacdn', 'grupozap', 'resized', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']
    .some(token => normalized.includes(token));
}

function inferImageExtension(contentType, imageUrl) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/jpg') return 'jpg';
  if (contentType === 'image/pjpeg') return 'jpg';
  if (contentType === 'image/x-png') return 'png';

  const match = String(imageUrl || '').match(/\.([a-z0-9]+)(?:[?#]|$)/i);
  return match?.[1]?.toLowerCase() || 'jpg';
}

function inferImageMimeType(contentType, imageUrl) {
  if (contentType && contentType.startsWith('image/')) {
    return contentType.toLowerCase();
  }

  const extension = inferImageExtension(contentType, imageUrl);

  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'avif') return 'image/avif';
  if (extension === 'svg') return 'image/svg+xml';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';

  return contentType || '';
}

function isSupportedImageType(contentType, imageUrl) {
  const normalizedType = inferImageMimeType(contentType, imageUrl);

  if (['image/png', 'image/webp', 'image/gif', 'image/jpeg'].includes(normalizedType)) {
    return true;
  }

  const extension = inferImageExtension(normalizedType, imageUrl);
  return ['png', 'webp', 'gif', 'jpg', 'jpeg'].includes(extension);
}
