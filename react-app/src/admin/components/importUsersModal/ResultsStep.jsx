import React from 'react';
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react';

export function ResultsStep({ results }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <CheckCircle size={26} weight="fill" className="text-emerald-500" />
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{results.imported}</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">Imported</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
          <Warning size={26} weight="fill" className="text-amber-500" />
          <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{results.skipped}</span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-500">Skipped</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
          <XCircle size={26} weight="fill" className="text-rose-500" />
          <span className="text-2xl font-black text-rose-700 dark:text-rose-400">{results.errors.length}</span>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-500">Errors</span>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Skipped accounts already existed and were left unchanged.
      </p>

      {results.errors.length > 0 && (
        <div>
          <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-2">
            Errors ({results.errors.length})
          </p>
          <div className="border border-rose-200 dark:border-rose-900/40 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-rose-50 dark:bg-rose-950/20 sticky top-0">
                <tr className="text-left text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-wide">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 dark:divide-rose-900/20">
                {results.errors.map((error, index) => (
                  <tr key={index}>
                    <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{error.email}</td>
                    <td className="px-3 py-1.5 text-rose-600 dark:text-rose-400">{error.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
