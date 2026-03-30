import { getSettings, saveSettings } from '../shared/settings.js';

const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const requestTimeoutMsInput = document.getElementById('requestTimeoutMs');
const saveButton = document.getElementById('saveButton');
const saveStatus = document.getElementById('saveStatus');

bootstrap();

saveButton.addEventListener('click', async () => {
  saveStatus.textContent = 'Salvando configuracoes...';

  try {
    await saveSettings({
      apiBaseUrl: apiBaseUrlInput.value,
      requestTimeoutMs: requestTimeoutMsInput.value
    });

    saveStatus.textContent = 'Configuracoes salvas com sucesso.';
  } catch (error) {
    saveStatus.textContent = error?.message || 'Falha ao salvar configuracoes.';
  }
});

async function bootstrap() {
  try {
    const settings = await getSettings();
    apiBaseUrlInput.value = settings.apiBaseUrl;
    requestTimeoutMsInput.value = String(settings.requestTimeoutMs);
    saveStatus.textContent = 'Pronto para configurar.';
  } catch (error) {
    saveStatus.textContent = error?.message || 'Falha ao carregar configuracoes.';
  }
}
