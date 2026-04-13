import React from 'react';

export function DeletedProgramsPopup({ toast, deletedPopup, onToastClick, onClose }) {
  return (
    <>
      {toast && (
        <button
          onClick={onToastClick}
          className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/70"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toast.message}
          <span className="ml-1 rounded border border-current px-1.5 py-0.5 text-[10px] font-semibold opacity-60">details</span>
        </button>
      )}

      {deletedPopup && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-dark-border dark:bg-dark-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Deleted Programs</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{deletedPopup.length} AIP{deletedPopup.length > 1 ? 's' : ''} removed</p>
              </div>
            </div>
            <ul className="mb-5 max-h-60 space-y-2 overflow-y-auto">
              {deletedPopup.map((program) => (
                <li key={program} className="flex items-center gap-2.5 border-b border-slate-100 py-1.5 text-sm text-slate-700 last:border-0 dark:border-dark-border dark:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-500">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {program}
                </li>
              ))}
            </ul>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-dark-border dark:text-slate-300 dark:hover:bg-dark-border/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
