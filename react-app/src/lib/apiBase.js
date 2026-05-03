function trimTrailingSlash(value) {
  return String(value || '').replace(/\/$/, '');
}

function isLoopbackHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

function isPrivateIpv4Host(hostname) {
  const parts = String(hostname || '').split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL || '';
  if (typeof window === 'undefined' || !configured) {
    return trimTrailingSlash(configured);
  }

  try {
    const apiUrl = new URL(configured);
    if (isLoopbackHost(window.location.hostname) && isPrivateIpv4Host(apiUrl.hostname)) {
      apiUrl.hostname = window.location.hostname;
      return trimTrailingSlash(apiUrl.toString());
    }
  } catch {
    return trimTrailingSlash(configured);
  }

  return trimTrailingSlash(configured);
}

export const API_BASE_URL = resolveApiBaseUrl();

export function apiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
