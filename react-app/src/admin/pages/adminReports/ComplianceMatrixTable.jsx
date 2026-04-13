import { STATUS_PILL, STATUS_SYMBOL, rowBorderColor } from './complianceUtils.js';

export function ComplianceMatrixTable({ data, rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
      <table className="border-collapse text-xs" style={{ minWidth: 'max-content' }}>
        <thead>
          <tr className="bg-slate-50 dark:bg-dark-surface">
            <th className="sticky left-0 z-20 whitespace-nowrap border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-black uppercase tracking-wide text-slate-500 dark:border-dark-border dark:bg-dark-surface dark:text-slate-400">School</th>
            {data.programs.map((program) => (
              <th key={program} title={program} className="relative h-20 w-7 px-1 align-bottom">
                <div className="relative flex h-full items-end justify-center pb-2">
                  <span className="absolute bottom-2 left-3 w-20 origin-bottom-left -rotate-45 overflow-hidden whitespace-nowrap text-[9px] font-black text-slate-500 text-ellipsis dark:text-slate-400">
                    {program}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
          {rows.map((row) => (
            <tr key={row.schoolId} className={`border-l-4 hover:bg-slate-50 dark:hover:bg-dark-border/20 ${rowBorderColor(row.rate)}`}>
              <td className="sticky left-0 z-10 whitespace-nowrap border-r border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-900 dark:border-dark-border dark:bg-dark-surface dark:text-slate-100">{row.school}</td>
              {data.programs.map((program) => {
                const status = row[program] ?? 'na';
                return (
                  <td key={program} className="px-1 py-1.5 text-center">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black ${STATUS_PILL[status]}`}>{STATUS_SYMBOL[status]}</span>
                  </td>
                );
              })}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={data.programs.length + 1} className="px-4 py-12 text-center text-sm font-bold text-slate-400 dark:text-slate-500">No schools match the current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
