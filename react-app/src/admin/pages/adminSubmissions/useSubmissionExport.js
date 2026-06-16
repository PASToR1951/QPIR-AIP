import { useRef } from 'react';
import { API } from '../../../lib/api.js';

async function readExportError(response, fallback) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data?.error || fallback;
    }
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export function useSubmissionExport({ tab, filters, onError }) {
  const downloadRef = useRef(null);

  const triggerDownload = (blob, filename) => {
    const blobUrl = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href     = blobUrl;
      downloadRef.current.download = filename;
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  };

  const buildExportParams = (format) => {
    const params = new URLSearchParams({ format, ...(tab !== 'all' ? { type: tab } : {}) });
    ['cluster', 'school', 'program', 'quarter', 'year', 'status'].forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') params.set(key, String(value));
    });
    return params;
  };

  const downloadExport = async (format, filename) => {
    try {
      const params = buildExportParams(format);
      const response = await fetch(`${API}/api/admin/submissions/export?${params}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(await readExportError(response, `Failed to export submissions as ${format.toUpperCase()}.`));
      }
      const blob = await response.blob();
      triggerDownload(blob, filename);
    } catch (error) {
      onError?.(error.message || 'Failed to export submissions.');
    }
  };

  const handleExportCSV = () => downloadExport('csv', 'submissions.csv');

  const handleExportXLSX = () => downloadExport('xlsx', 'submissions.xlsx');

  return { downloadRef, handleExportCSV, handleExportXLSX };
}
