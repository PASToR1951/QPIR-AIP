import React from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { STATUS_PILL, STATUS_SYMBOL, rateBarColor, rateBarTrack, rateTextColor, rowBorderColor } from './complianceUtils.js';

export function ComplianceSummaryTable({ data, rows, expandedRows, setExpandedRows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-dark-border dark:bg-dark-surface">
            <th className="sticky left-0 z-10 min-w-[180px] bg-slate-50 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-dark-surface dark:text-slate-400">School</th>
            <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Level</th>
            <th className="px-4 py-3 text-center text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Submitted</th>
            <th className="min-w-[140px] px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Rate</th>
            <th className="min-w-[220px] px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Missing Programs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
          {rows.map((row) => {
            const isExpanded = expandedRows.has(row.schoolId);

            return (
              <React.Fragment key={row.schoolId}>
                <tr
                  onClick={() => setExpandedRows((previousRows) => {
                    const nextRows = new Set(previousRows);
                    if (nextRows.has(row.schoolId)) nextRows.delete(row.schoolId);
                    else nextRows.add(row.schoolId);
                    return nextRows;
                  })}
                  className={`cursor-pointer border-l-4 transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/20 ${rowBorderColor(row.rate)}`}
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-900 dark:bg-dark-surface dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <CaretUp size={13} className="shrink-0 text-slate-400" /> : <CaretDown size={13} className="shrink-0 text-slate-400" />}
                      {row.school}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-dark-border dark:text-slate-400">{row.level}</span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{row.submitted}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500"> / {row.eligible}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.rate === null ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`h-2 flex-1 rounded-full ${rateBarTrack(row.rate)}`}>
                          <div className={`h-full rounded-full ${rateBarColor(row.rate)}`} style={{ width: `${Math.max(row.rate, 3)}%` }} />
                        </div>
                        <span className={`w-9 text-right text-xs font-black tabular-nums ${rateTextColor(row.rate)}`}>{row.rate}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.missingPrograms.length === 0 ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">All submitted</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.missingPrograms.slice(0, 3).map((program) => (
                          <span key={program} title={program} className="inline-flex max-w-[100px] items-center truncate rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">{program}</span>
                        ))}
                        {row.missingPrograms.length > 3 && (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-dark-border dark:text-slate-400">+{row.missingPrograms.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className={`border-l-4 ${rowBorderColor(row.rate)}`}>
                    <td colSpan={5} className="bg-slate-50 px-6 py-4 dark:bg-dark-surface/60">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Full Program Breakdown — {row.school}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.programs.map((program) => {
                          const status = row[program] ?? 'na';
                          return (
                            <div key={program} title={program} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${STATUS_PILL[status]}`}>
                              <span>{STATUS_SYMBOL[status]}</span>
                              <span className="max-w-[130px] truncate">{program}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm font-bold text-slate-400 dark:text-slate-500">No schools match the current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
