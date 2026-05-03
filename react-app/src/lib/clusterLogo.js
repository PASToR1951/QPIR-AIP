import { API_BASE_URL } from './apiBase.js';

const API_BASE = API_BASE_URL;

export function getClusterLogoPath(clusterNumber) {
  if (!clusterNumber) return null;
  return `/Cluster Logo/Cluster ${clusterNumber}.webp`;
}

export function getUploadedLogoUrl(src) {
  if (!src) return null;
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  if (src.startsWith('/school-logos/') || src.startsWith('/cluster-logos/') || src.startsWith('/app-logo/')) {
    return `${API_BASE}${src}`;
  }
  return src;
}
