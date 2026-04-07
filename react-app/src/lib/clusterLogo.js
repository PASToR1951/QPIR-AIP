const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getClusterLogoPath(clusterNumber) {
  if (!clusterNumber) return null;
  return `/Cluster Logo/Cluster ${clusterNumber}.webp`;
}

export function getUploadedLogoUrl(src) {
  if (!src) return null;
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  if (src.startsWith('/school-logos/') || src.startsWith('/cluster-logos/')) {
    return `${API_BASE}${src}`;
  }
  return src;
}
