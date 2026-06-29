import { API_BASE_URL } from './apiBase.js';

const API_BASE = API_BASE_URL;

export function getClusterLogoPath(clusterNumber) {
  if (!clusterNumber) return null;
  return `/Cluster Logo/Cluster ${clusterNumber}.webp`;
}

/**
 * Human-friendly cluster label that avoids duplication like "Cluster 1 - Cluster 1"
 * when the cluster's name simply echoes its number.
 */
export function formatClusterLabel(cluster) {
  if (!cluster) return '';
  const base = `Cluster ${cluster.cluster_number}`;
  const name = String(cluster.name ?? '').trim();
  if (!name || name === base || name === String(cluster.cluster_number)) return base;
  return `${base} - ${name}`;
}

export function getUploadedLogoUrl(src) {
  if (!src) return null;
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  if (src.startsWith('/school-logos/') || src.startsWith('/cluster-logos/') || src.startsWith('/app-logo/')) {
    return `${API_BASE}${src}`;
  }
  return src;
}
