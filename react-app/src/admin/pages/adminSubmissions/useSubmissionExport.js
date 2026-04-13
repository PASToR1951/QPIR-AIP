import { useRef } from 'react';
import { API } from '../../../lib/api.js';

export function useSubmissionExport({ tab, filters }) {
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
    if (filters.year)   params.set('year',   filters.year);
    if (filters.status) params.set('status', filters.status);
    return params;
  };

  const handleExportCSV = async () => {
    const params = buildExportParams('csv');
    const blob   = await fetch(`${API}/api/admin/submissions/export?${params}`, { credentials: 'include' }).then(r => r.blob());
    triggerDownload(blob, 'submissions.csv');
  };

  const handleExportXLSX = async () => {
    const params = buildExportParams('xlsx');
    const blob   = await fetch(`${API}/api/admin/submissions/export?${params}`, { credentials: 'include' }).then(r => r.blob());
    triggerDownload(blob, 'submissions.xlsx');
  };

  return { downloadRef, handleExportCSV, handleExportXLSX };
}
