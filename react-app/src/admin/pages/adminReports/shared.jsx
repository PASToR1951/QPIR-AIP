import React, { useEffect, useState } from 'react';
import { Spinner as SpinnerBase } from '../../components/Spinner.jsx';
import { DownloadSimple, CalendarBlank, CaretDown } from '@phosphor-icons/react';
import { downloadCSV, exportReport } from '../../../lib/reportExport.js';
import { EXPORT_STYLES } from './constants.js';

export function ExportButtons({ type, year }) {
  return (
    <div className="flex items-center gap-2">
      {['csv', 'xlsx', 'pdf'].map(fmt => (
        <button key={fmt} onClick={() => exportReport(type, fmt, year)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors uppercase ${EXPORT_STYLES[fmt]}`}>
          <DownloadSimple size={15} /> {fmt}
        </button>
      ))}
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

export function YearDropdown({ year, setYear, availableYears }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 transition-colors"
      >
        <CalendarBlank size={16} weight="bold" />
        <span>FY {year}</span>
        <CaretDown size={13} weight="bold" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[120px] bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-xl overflow-hidden">
          {availableYears.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">No records found</div>
          ) : (
            availableYears.map(y => (
              <button
                key={y}
                onClick={() => { setYear(y); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${y === year
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400'
                }`}
              >
                FY {y}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
