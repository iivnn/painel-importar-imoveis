declare global {
  interface Window {
    __CASA_CONFIG__?: {
      apiOrigin?: string;
    };
  }
}

const defaultApiOrigin = 'http://localhost:5184';

export function getApiOrigin(): string {
  return window.__CASA_CONFIG__?.apiOrigin?.trim() || defaultApiOrigin;
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${normalizedPath}`;
}

export function getHubUrl(path: string): string {
  return getApiUrl(path);
}

export function getFileUrl(path: string): string {
  if (!path) {
    return getApiOrigin();
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${getApiOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}
