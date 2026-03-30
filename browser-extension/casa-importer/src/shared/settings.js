export const DEFAULT_SETTINGS = {
  apiBaseUrl: 'http://localhost:5074',
  requestTimeoutMs: 15000
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...stored
  };
}

export async function saveSettings(settings) {
  const normalized = {
    apiBaseUrl: (settings.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl).trim().replace(/\/+$/, ''),
    requestTimeoutMs: Number(settings.requestTimeoutMs || DEFAULT_SETTINGS.requestTimeoutMs)
  };

  await chrome.storage.sync.set(normalized);
  return normalized;
}
