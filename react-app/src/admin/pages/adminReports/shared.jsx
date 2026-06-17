import React, { useEffect, useState } from 'react';
import { Spinner as SpinnerBase } from '../../components/Spinner.jsx';
import { DownloadSimple } from '@phosphor-icons/react';
import { downloadCSV, exportReport } from '../../../lib/reportExport.js';
import { EXPORT_STYLES } from './constants.js';

export function ExportButtons({ type, year, quarter }) {
  const [loadingFormat, setLoadingFormat] = useState(null);
  const [error, setError] = useState('');

  const handleExport = async (format) => {
    setLoadingFormat(format);
    setError('');
    try {
      await exportReport(type, format, year, quarter);
    } catch (requestError) {
      setError(requestError.message || 'Failed to export report.');
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {['csv', 'xlsx', 'pdf'].map(fmt => (
        <button key={fmt} onClick={() => handleExport(fmt)} disabled={!!loadingFormat}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors uppercase disabled:cursor-not-allowed disabled:opacity-60 ${EXPORT_STYLES[fmt]}`}>
          {loadingFormat === fmt ? <SpinnerBase size="sm" /> : <DownloadSimple size={15} />}
          {fmt}
        </button>
      ))}
      {error && (
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</span>
      )}
    </div>
  );
}

export function CsvButton({ rows, filename }) {
  return (
    <div className="flex justify-end">
      <button onClick={() => downloadCSV(rows, filename)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors uppercase hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400">
        <DownloadSimple size={15} /> CSV
      </button>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <SpinnerBase />
    </div>
  );
}
