import { getMissingRequiredFields } from '../shared/mapping.js';
import { getSettings } from '../shared/settings.js';

const extractButton = document.getElementById('extractButton');
const importButton = document.getElementById('importButton');
const statusMessage = document.getElementById('statusMessage');

const previewTitle = document.getElementById('previewTitle');
const previewPrice = document.getElementById('previewPrice');
const previewMonthlyTotal = document.getElementById('previewMonthlyTotal');
const previewSource = document.getElementById('previewSource');
const previewAddress = document.getElementById('previewAddress');
const previewImages = document.getElementById('previewImages');
const geoDebugBox = document.getElementById('geoDebugBox');

const confirmModal = document.getElementById('confirmModal');
const closeModalButton = document.getElementById('closeModalButton');
const cancelModalButton = document.getElementById('cancelModalButton');
const confirmImportButton = document.getElementById('confirmImportButton');

const fieldTitle = document.getElementById('fieldTitle');
const fieldPrice = document.getElementById('fieldPrice');
const fieldCategory = document.getElementById('fieldCategory');
const fieldCondoFee = document.getElementById('fieldCondoFee');
const fieldIptu = document.getElementById('fieldIptu');
const fieldInsurance = document.getElementById('fieldInsurance');
const fieldServiceFee = document.getElementById('fieldServiceFee');
const fieldTotalMonthlyCost = document.getElementById('fieldTotalMonthlyCost');
const fieldAddressLine = document.getElementById('fieldAddressLine');
const fieldNeighborhood = document.getElementById('fieldNeighborhood');
const fieldCity = document.getElementById('fieldCity');
const fieldState = document.getElementById('fieldState');
const fieldPostalCode = document.getElementById('fieldPostalCode');
const fieldDescription = document.getElementById('fieldDescription');
const fieldImportImages = document.getElementById('fieldImportImages');
const fieldImportImagesLabel = document.getElementById('fieldImportImagesLabel');

let currentDraft = null;
let currentSettings = null;

bootstrapSettings();

extractButton.addEventListener('click', async () => {
  currentSettings = await getSettings().catch(() => currentSettings);
  setStatus('Lendo os dados da pagina...', 'muted');
  importButton.disabled = true;
  currentDraft = null;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('Nao foi possivel localizar a aba ativa.', 'error');
    sendLog('Error', 'Popup', 'ActiveTabMissing', 'Nao foi possivel localizar a aba ativa para extracao.');
    return;
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: 'extract-listing' }).catch(() => ({
    ok: false,
    error: 'Nao foi possivel ler esta pagina. Verifique se o site e suportado.'
  }));

  if (!response?.ok) {
    setStatus(response?.error || 'Falha ao extrair os dados da pagina.', 'error');
    sendLog('Error', 'Popup', 'ExtractionFailedInPopup', response?.error || 'Falha ao extrair os dados da pagina.');
    fillPreview(null);
    return;
  }

  setStatus('Complementando endereco e validando os dados...', 'muted');

  const enrichedResponse = await chrome.runtime.sendMessage({
    type: 'enrich-listing',
    payload: response.draft
  }).catch(() => ({
    ok: false,
    error: 'Nao foi possivel complementar os dados do anuncio.'
  }));

  currentDraft = normalizeDraft(enrichedResponse?.ok ? enrichedResponse.draft : response.draft);
  currentDraft = applyImageLimit(currentDraft);
  fillPreview(currentDraft);

  const missingRequiredFields = getMissingRequiredFields(currentDraft);

  if (missingRequiredFields.length > 0) {
    importButton.disabled = true;
    sendLog('Warning', 'Popup', 'ExtractionMissingRequiredFields', 'A extensao extraiu a pagina, mas faltaram campos obrigatorios.', {
      missingRequiredFields,
      title: currentDraft?.title || '',
      pageUrl: currentDraft?.pageUrl || ''
    });
    setStatus(
      `Faltam campos obrigatorios para importar: ${missingRequiredFields.join(', ')}.`,
      'error'
    );
    return;
  }

  importButton.disabled = false;
  sendLog('Info', 'Popup', 'ExtractionReadyForReview', 'Dados do anuncio prontos para revisao no popup.', {
    title: currentDraft?.title || '',
    imageCount: currentDraft?.images?.length || 0
  });
  setStatus('Dados lidos com sucesso. Revise e confirme a importacao.', 'success');
});

importButton.addEventListener('click', () => {
  if (!currentDraft) {
    setStatus('Leia a pagina antes de importar.', 'error');
    return;
  }

  openConfirmModal();
});

confirmImportButton.addEventListener('click', async () => {
  if (!currentDraft) {
    closeConfirmModal();
    return;
  }

  currentSettings = await getSettings().catch(() => currentSettings);

  currentDraft = buildDraftFromForm(currentDraft);
  currentDraft = applyImageLimit(currentDraft);
  fillPreview(currentDraft);

  const missingRequiredFields = getMissingRequiredFields(currentDraft);
  if (missingRequiredFields.length > 0) {
    sendLog('Warning', 'Popup', 'ImportBlockedByValidation', 'A importacao foi bloqueada no popup por campos obrigatorios ausentes.', {
      missingRequiredFields,
      title: currentDraft?.title || ''
    });
    setStatus(
      `Revise os campos obrigatorios antes de importar: ${missingRequiredFields.join(', ')}.`,
      'error'
    );
    return;
  }

  confirmImportButton.disabled = true;
  importButton.disabled = true;
  setStatus('Enviando anuncio para a API local...', 'muted');

  const response = await chrome.runtime.sendMessage({
    type: 'import-listing',
    payload: currentDraft
  }).catch(() => ({
    ok: false,
    error: 'Nao foi possivel falar com o processo em segundo plano da extensao.'
  }));

  confirmImportButton.disabled = false;

  if (!response?.ok) {
    importButton.disabled = false;
    sendLog('Error', 'Popup', 'ImportFailedInPopup', response?.error || 'Falha ao importar anuncio.', {
      title: currentDraft?.title || '',
      pageUrl: currentDraft?.pageUrl || ''
    });
    setStatus(response?.error || 'Falha ao importar anuncio.', 'error');
    return;
  }

  closeConfirmModal();
  importButton.disabled = false;

  if (response.result?.imageImportError) {
    sendLog('Warning', 'Popup', 'ImportSucceededWithImageWarning', 'O anuncio foi importado, mas houve alerta no envio das imagens.', {
      title: currentDraft?.title || '',
      imageImportError: response.result.imageImportError
    });
    setStatus(
      `Anuncio importado com sucesso. As imagens nao foram enviadas: ${response.result.imageImportError}`,
      'error'
    );
    return;
  }

  const uploadedImages = Number(response.result?.uploadedImages || 0);
  const failedImages = Number(response.result?.imageImportSummary?.failedCount || 0);
  const imageMessage = uploadedImages > 0
    ? ` ${uploadedImages} imagem(ns) enviada(s).`
    : '';
  const partialWarning = failedImages > 0
    ? ` ${failedImages} imagem(ns) nao puderam ser importadas.`
    : '';

  sendLog('Info', 'Popup', 'ImportSucceededInPopup', 'O popup concluiu a importacao do anuncio com sucesso.', {
    title: currentDraft?.title || '',
    uploadedImages,
    failedImages
  });
  setStatus(`Anuncio importado com sucesso no sistema Casa.${imageMessage}${partialWarning}`, failedImages > 0 ? 'error' : 'success');
});

closeModalButton.addEventListener('click', closeConfirmModal);
cancelModalButton.addEventListener('click', closeConfirmModal);

function setStatus(message, variant) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-message--${variant}`;
}

function fillPreview(draft) {
  previewTitle.textContent = draft?.title || '-';
  previewPrice.textContent = draft?.price || '-';
  previewMonthlyTotal.textContent = draft?.totalMonthlyCost || '-';
  previewSource.textContent = draft?.source || '-';
  previewAddress.textContent = [
    draft?.location?.addressLine,
    draft?.location?.neighborhood,
    draft?.location?.city,
    draft?.location?.state,
    draft?.location?.postalCode
  ].filter(Boolean).join(' | ') || '-';
  previewImages.textContent = draft?.images?.length ? `${draft.images.length} encontrada(s)` : '-';

  if (draft?.geoDebug?.length) {
    geoDebugBox.hidden = false;
    geoDebugBox.textContent = `Log de coordenadas: ${draft.geoDebug.join(' | ')}`;
  } else {
    geoDebugBox.hidden = true;
    geoDebugBox.textContent = '';
  }
}

function openConfirmModal() {
  if (!currentDraft) {
    return;
  }

  fieldTitle.value = currentDraft.title || '';
  fieldPrice.value = currentDraft.price || '';
  fieldCategory.value = currentDraft.category || '';
  fieldCondoFee.value = currentDraft.condoFee || '';
  fieldIptu.value = currentDraft.iptu || '';
  fieldInsurance.value = currentDraft.insurance || '';
  fieldServiceFee.value = currentDraft.serviceFee || '';
  fieldTotalMonthlyCost.value = currentDraft.totalMonthlyCost || '';
  fieldAddressLine.value = currentDraft.location?.addressLine || '';
  fieldNeighborhood.value = currentDraft.location?.neighborhood || '';
  fieldCity.value = currentDraft.location?.city || '';
  fieldState.value = currentDraft.location?.state || '';
  fieldPostalCode.value = currentDraft.location?.postalCode || '';
  fieldDescription.value = currentDraft.description || '';
  fieldImportImages.checked = currentDraft.importImages !== false;
  fieldImportImagesLabel.textContent = currentDraft.images?.length
    ? `Importar ${currentDraft.images.length} imagem(ns) encontrada(s)`
    : 'Nenhuma imagem encontrada para importar';
  fieldImportImages.disabled = !currentDraft.images?.length;

  document.body.classList.add('modal-open');
  confirmModal.hidden = false;
}

function closeConfirmModal() {
  document.body.classList.remove('modal-open');
  confirmModal.hidden = true;
}

function buildDraftFromForm(baseDraft) {
  return normalizeDraft({
    ...baseDraft,
    title: fieldTitle.value,
    price: fieldPrice.value,
    category: fieldCategory.value,
    condoFee: fieldCondoFee.value,
    iptu: fieldIptu.value,
    insurance: fieldInsurance.value,
    serviceFee: fieldServiceFee.value,
    totalMonthlyCost: fieldTotalMonthlyCost.value,
    description: fieldDescription.value,
    importImages: fieldImportImages.checked && !fieldImportImages.disabled,
    latitude: baseDraft.latitude,
    longitude: baseDraft.longitude,
    hasExactLocation: baseDraft.hasExactLocation,
    location: {
      ...baseDraft.location,
      addressLine: fieldAddressLine.value,
      neighborhood: fieldNeighborhood.value,
      city: fieldCity.value,
      state: fieldState.value.toUpperCase(),
      postalCode: fieldPostalCode.value
    }
  });
}

function normalizeDraft(draft) {
  const latitude = normalizeCoordinateValue(draft?.latitude);
  const longitude = normalizeCoordinateValue(draft?.longitude);

  return {
    ...draft,
    title: String(draft?.title || '').trim(),
    category: String(draft?.category || '').trim(),
    price: String(draft?.price || '').trim(),
    condoFee: String(draft?.condoFee || '').trim(),
    iptu: String(draft?.iptu || '').trim(),
    insurance: String(draft?.insurance || '').trim(),
    serviceFee: String(draft?.serviceFee || '').trim(),
    totalMonthlyCost: String(draft?.totalMonthlyCost || '').trim(),
    description: String(draft?.description || '').trim(),
    importImages: draft?.importImages !== false,
    images: Array.isArray(draft?.images)
      ? draft.images.map(image => String(image || '').trim()).filter(Boolean)
      : [],
    geoDebug: Array.isArray(draft?.geoDebug)
      ? draft.geoDebug.map(entry => String(entry || '').trim()).filter(Boolean)
      : [],
    latitude,
    longitude,
    hasExactLocation: Boolean(
      latitude !== null &&
      longitude !== null &&
      draft?.hasExactLocation !== false
    ),
    location: {
      addressLine: String(draft?.location?.addressLine || '').trim(),
      neighborhood: String(draft?.location?.neighborhood || '').trim(),
      city: String(draft?.location?.city || '').trim(),
      state: String(draft?.location?.state || '').trim().toUpperCase(),
      postalCode: String(draft?.location?.postalCode || '').trim()
    }
  };
}

async function bootstrapSettings() {
  try {
    currentSettings = await getSettings();
  } catch {
    currentSettings = null;
  }
}

function applyImageLimit(draft) {
  const maxImages = Number(currentSettings?.maxImagesToImport || 10);
  const images = Array.isArray(draft?.images) ? draft.images.slice(0, maxImages) : [];

  return {
    ...draft,
    images
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

function sendLog(level, category, eventName, message, details = null) {
  void chrome.runtime.sendMessage({
    type: 'write-log',
    payload: {
      level,
      category,
      eventName,
      message,
      details,
      path: currentDraft?.pageUrl || ''
    }
  }).catch(() => {});
}
