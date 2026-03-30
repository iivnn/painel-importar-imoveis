import { getMissingRequiredFields } from '../shared/mapping.js';

const extractButton = document.getElementById('extractButton');
const importButton = document.getElementById('importButton');
const statusMessage = document.getElementById('statusMessage');

const previewTitle = document.getElementById('previewTitle');
const previewPrice = document.getElementById('previewPrice');
const previewSource = document.getElementById('previewSource');
const previewAddress = document.getElementById('previewAddress');
const previewImages = document.getElementById('previewImages');

const confirmModal = document.getElementById('confirmModal');
const closeModalButton = document.getElementById('closeModalButton');
const cancelModalButton = document.getElementById('cancelModalButton');
const confirmImportButton = document.getElementById('confirmImportButton');

const fieldTitle = document.getElementById('fieldTitle');
const fieldPrice = document.getElementById('fieldPrice');
const fieldCategory = document.getElementById('fieldCategory');
const fieldAddressLine = document.getElementById('fieldAddressLine');
const fieldNeighborhood = document.getElementById('fieldNeighborhood');
const fieldCity = document.getElementById('fieldCity');
const fieldState = document.getElementById('fieldState');
const fieldPostalCode = document.getElementById('fieldPostalCode');
const fieldDescription = document.getElementById('fieldDescription');
const fieldImportImages = document.getElementById('fieldImportImages');
const fieldImportImagesLabel = document.getElementById('fieldImportImagesLabel');

let currentDraft = null;

extractButton.addEventListener('click', async () => {
  setStatus('Lendo os dados da pagina...', 'muted');
  importButton.disabled = true;
  currentDraft = null;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('Nao foi possivel localizar a aba ativa.', 'error');
    return;
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: 'extract-listing' }).catch(() => ({
    ok: false,
    error: 'Nao foi possivel ler esta pagina. Verifique se o site e suportado.'
  }));

  if (!response?.ok) {
    setStatus(response?.error || 'Falha ao extrair os dados da pagina.', 'error');
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
  fillPreview(currentDraft);

  const missingRequiredFields = getMissingRequiredFields(currentDraft);

  if (missingRequiredFields.length > 0) {
    importButton.disabled = true;
    setStatus(
      `Faltam campos obrigatorios para importar: ${missingRequiredFields.join(', ')}.`,
      'error'
    );
    return;
  }

  importButton.disabled = false;
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

  currentDraft = buildDraftFromForm(currentDraft);
  fillPreview(currentDraft);

  const missingRequiredFields = getMissingRequiredFields(currentDraft);
  if (missingRequiredFields.length > 0) {
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
    setStatus(response?.error || 'Falha ao importar anuncio.', 'error');
    return;
  }

  closeConfirmModal();
  importButton.disabled = false;

  if (response.result?.imageImportError) {
    setStatus(
      `Anuncio importado com sucesso. As imagens nao foram enviadas: ${response.result.imageImportError}`,
      'error'
    );
    return;
  }

  const uploadedImages = Number(response.result?.uploadedImages || 0);
  const imageMessage = uploadedImages > 0
    ? ` ${uploadedImages} imagem(ns) enviada(s).`
    : '';

  setStatus(`Anuncio importado com sucesso no sistema Casa.${imageMessage}`, 'success');
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
  previewSource.textContent = draft?.source || '-';
  previewAddress.textContent = [
    draft?.location?.addressLine,
    draft?.location?.neighborhood,
    draft?.location?.city,
    draft?.location?.state,
    draft?.location?.postalCode
  ].filter(Boolean).join(' | ') || '-';
  previewImages.textContent = draft?.images?.length ? `${draft.images.length} encontrada(s)` : '-';
}

function openConfirmModal() {
  if (!currentDraft) {
    return;
  }

  fieldTitle.value = currentDraft.title || '';
  fieldPrice.value = currentDraft.price || '';
  fieldCategory.value = currentDraft.category || '';
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
    description: fieldDescription.value,
    importImages: fieldImportImages.checked && !fieldImportImages.disabled,
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
  return {
    ...draft,
    title: String(draft?.title || '').trim(),
    category: String(draft?.category || '').trim(),
    price: String(draft?.price || '').trim(),
    description: String(draft?.description || '').trim(),
    importImages: draft?.importImages !== false,
    location: {
      addressLine: String(draft?.location?.addressLine || '').trim(),
      neighborhood: String(draft?.location?.neighborhood || '').trim(),
      city: String(draft?.location?.city || '').trim(),
      state: String(draft?.location?.state || '').trim().toUpperCase(),
      postalCode: String(draft?.location?.postalCode || '').trim()
    }
  };
}
