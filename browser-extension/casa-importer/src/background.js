import { mapDraftToCreateRequest } from './shared/mapping.js';
import { getSettings } from './shared/settings.js';

chrome.runtime.onInstalled.addListener(async () => {
  await getSettings();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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

  try {
    const enrichedDraft = await enrichDraftWithPostalCode(draft, controller.signal);

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

    if (propertyId && draft?.importImages !== false && Array.isArray(draft?.images) && draft.images.length > 0) {
      try {
        const uploadedImages = await uploadPropertyImages(
          settings.apiBaseUrl,
          propertyId,
          draft.images,
          controller.signal
        );

        return {
          ...importResult,
          propertyId,
          uploadedImages
        };
      } catch (error) {
        return {
          ...importResult,
          propertyId,
          uploadedImages: 0,
          imageImportError: error instanceof Error ? error.message : 'Falha ao enviar imagens.'
        };
      }
    }

    return {
      ...importResult,
      propertyId,
      uploadedImages: 0
    };
  } catch (error) {
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
    return await enrichDraftWithPostalCode(draft, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

async function enrichDraftWithPostalCode(draft, signal) {
  const fromCoordinates = await enrichDraftFromCoordinates(draft, signal);
  const location = fromCoordinates?.location || {};
  const postalCode = String(location.postalCode || '').trim();
  const addressLine = String(location.addressLine || '').trim();
  const city = String(location.city || '').trim();
  const state = String(location.state || '').trim();

  if (postalCode || !addressLine || !city || !state) {
    return fromCoordinates;
  }

  const street = addressLine.split(',')[0]?.trim();
  if (!street) {
    return fromCoordinates;
  }

  const url = `https://viacep.com.br/ws/${encodeURIComponent(state)}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    return fromCoordinates;
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return fromCoordinates;
  }

  const neighborhood = String(location.neighborhood || '').trim().toLowerCase();
  const matched =
    results.find(item => neighborhood && String(item?.bairro || '').trim().toLowerCase() === neighborhood) ||
    results[0];

  return {
    ...fromCoordinates,
    location: {
      ...location,
      addressLine: location.addressLine || matched?.logradouro || '',
      neighborhood: location.neighborhood || matched?.bairro || '',
      city: location.city || matched?.localidade || '',
      state: location.state || matched?.uf || '',
      postalCode: matched?.cep || ''
    }
  };
}

async function enrichDraftFromCoordinates(draft, signal) {
  const location = draft?.location || {};
  const latitude = Number(draft?.latitude);
  const longitude = Number(draft?.longitude);

  if (
    (!Number.isFinite(latitude) || !Number.isFinite(longitude)) ||
    (String(location.state || '').trim() && String(location.postalCode || '').trim())
  ) {
    return draft;
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
  const response = await fetch(url, {
    signal,
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return draft;
  }

  const result = await response.json();
  const address = result?.address || {};

  const road = [address.road, address.house_number].filter(Boolean).join(', ');
  const stateCode = String(address.state_code || '').replace(/^BR-/, '').trim();

  return {
    ...draft,
    location: {
      ...location,
      addressLine: String(location.addressLine || road || result?.name || '').trim(),
      neighborhood: String(location.neighborhood || address.suburb || address.neighbourhood || '').trim(),
      city: String(location.city || address.city || address.town || address.village || '').trim(),
      state: String(location.state || stateCode || address.state || '').trim(),
      postalCode: String(location.postalCode || address.postcode || '').trim()
    }
  };
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

async function uploadPropertyImages(apiBaseUrl, propertyId, imageUrls, signal) {
  const attachmentsUrl = `${apiBaseUrl}/api/properties/${propertyId}/attachments`;
  const formData = new FormData();
  formData.append('kind', 'Foto');

  let appendedFiles = 0;

  for (let index = 0; index < imageUrls.length; index += 1) {
    const imageUrl = imageUrls[index];
    const response = await fetch(imageUrl, { signal });

    if (!response.ok) {
      continue;
    }

    const blob = await response.blob();
    const extension = inferImageExtension(blob.type, imageUrl);
    const file = new File([blob], `importada-${index + 1}.${extension}`, {
      type: blob.type || 'image/jpeg'
    });

    formData.append('files', file, file.name);
    appendedFiles += 1;
  }

  if (appendedFiles === 0) {
    throw new Error('Nenhuma imagem disponivel para upload.');
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

  return appendedFiles;
}

function inferImageExtension(contentType, imageUrl) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  if (contentType === 'image/jpeg') return 'jpg';

  const match = String(imageUrl || '').match(/\.([a-z0-9]+)(?:[?#]|$)/i);
  return match?.[1]?.toLowerCase() || 'jpg';
}
