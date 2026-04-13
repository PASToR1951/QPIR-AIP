import React from 'react';
import { CheckCircle, Warning } from '@phosphor-icons/react';

export function PreviewStep({ parsed }) {
  const validCount = parsed.filter((row) => row._valid).length;
  const invalidCount = parsed.length - validCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-black">
          <CheckCircle size={13} weight="fill" /> {validCount} valid
        </span>
        {invalidCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-black">
            <Warning size={13} weight="fill" /> {invalidCount} invalid — will be skipped
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-dark-border rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-dark-base">
            <tr className="text-left text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[11px] font-black">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Email</th>
              <th className="px-3 py-2.5">Role</th>
              <th className="px-3 py-2.5">Name / Names</th>
              <th className="px-3 py-2.5">School ID</th>
              <th className="px-3 py-2.5">Programs</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {parsed.map((row) => (
              <tr key={row._row} className={row._valid ? '' : 'bg-rose-50/40 dark:bg-rose-950/10'}>
                <td className="px-3 py-2 text-slate-400">{row._row}</td>
                <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[220px] truncate" title={row.email}>
                  {row.email || <span className="text-slate-400 italic">(empty)</span>}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.role || '—'}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  {row.name || [row.first_name, row.middle_initial, row.last_name].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="px-3 py-2 text-slate-500">{row.school_id || '—'}</td>
                <td className="px-3 py-2 text-slate-500">
                  {row.program_ids?.length > 0 ? row.program_ids.join(', ') : '—'}
                </td>
                <td className="px-3 py-2">
                  {row._valid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black whitespace-nowrap">
                      <CheckCircle size={11} weight="fill" /> Valid
                    </span>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[11px] font-black whitespace-nowrap">
                        <Warning size={11} weight="fill" /> Invalid
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {row._errors.map((error, index) => (
                          <li key={index} className="text-[11px] text-rose-600 dark:text-rose-400">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
