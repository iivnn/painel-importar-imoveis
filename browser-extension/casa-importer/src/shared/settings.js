export const DEFAULT_SETTINGS = {
  apiBaseUrl: 'http://localhost:5074',
  requestTimeoutMs: 15000,
  maxImagesToImport: 10
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
    requestTimeoutMs: Number(settings.requestTimeoutMs || DEFAULT_SETTINGS.requestTimeoutMs),
    maxImagesToImport: normalizeMaxImagesToImport(settings.maxImagesToImport)
  };

  await chrome.storage.sync.set(normalized);
  return normalized;
}

function normalizeMaxImagesToImport(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_SETTINGS.maxImagesToImport;
  }

  return Math.min(Math.round(parsed), 30);
}
