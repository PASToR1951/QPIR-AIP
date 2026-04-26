import { useMemo } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { calculateGap, fmt, fmtPeso, getValidationFlags } from './pirReviewUtils.js';
import { FlagChip } from './ui.jsx';

export function ActivityRow({ review, measureText }) {
  const [expanded, setExpanded] = useState(false);

  const physGap = calculateGap(review.physical_target, review.physical_accomplished);
  const finGap  = calculateGap(review.financial_target, review.financial_accomplished);
  const flags   = getValidationFlags(review);
  const aip     = review.aip_activity;

  const actionsHeight = useMemo(() => {
    if (!review.actions_to_address_gap) return 0;
    return measureText(review.actions_to_address_gap, 200).height;
  }, [review.actions_to_address_gap, measureText]);

  return (
    <>
      <tr className="bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors align-top">
        <td className="px-3 py-3 w-8">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-0.5"
            title={expanded ? 'Collapse AIP detail' : 'Expand AIP detail'}
          >
            {expanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
          </button>
        </td>
        <td className="px-3 py-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
            {aip?.activity_name ?? <span className="italic text-slate-400">Manual entry</span>}
          </p>
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {flags.map(f => <FlagChip key={f.type} flag={f} />)}
            </div>
          )}
        </td>
        <td className="px-3 py-3 text-center">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 leading-snug">
            {aip?.implementation_period ?? '—'}
          </span>
        </td>
        <td className="px-3 py-3 text-center border-l border-slate-100 dark:border-dark-border">
          <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(review.physical_target)}</span>
        </td>
        <td className="px-3 py-3 text-center border-r border-slate-100 dark:border-dark-border">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">{fmtPeso(review.financial_target)}</span>
        </td>
        <td className="px-3 py-3 text-center border-l border-slate-100 dark:border-dark-border">
          <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(review.physical_accomplished)}</span>
        </td>
        <td className="px-3 py-3 text-center border-r border-slate-100 dark:border-dark-border">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">{fmtPeso(review.financial_accomplished)}</span>
        </td>
        <td className="px-3 py-3 text-center bg-slate-50/50 dark:bg-dark-base/30 border-l border-slate-100 dark:border-dark-border">
          <span className={`text-sm font-bold font-mono tabular-nums ${physGap < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {physGap.toFixed(2)}%
          </span>
        </td>
        <td className="px-3 py-3 text-center bg-slate-50/50 dark:bg-dark-base/30 border-r border-slate-100 dark:border-dark-border">
          <span className={`text-sm font-bold font-mono tabular-nums ${finGap < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {finGap.toFixed(2)}%
          </span>
        </td>
        <td className="px-3 py-3" style={{ minHeight: actionsHeight > 0 ? `${actionsHeight + 12}px` : undefined }}>
          {review.actions_to_address_gap ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{review.actions_to_address_gap}</p>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600 italic">—</span>
          )}
        </td>
      </tr>
      {expanded && aip && (
        <tr className="bg-indigo-50/60 dark:bg-indigo-950/10 border-b border-indigo-100 dark:border-indigo-900/30">
          <td />
          <td colSpan={9} className="px-4 py-3">
            <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">AIP Reference</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Phase</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{aip.phase}</p>
              </div>
              <div>
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Budget Source</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{aip.budget_source} · {fmtPeso(aip.budget_amount)}</p>
              </div>
              <div className="col-span-2">
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Persons Involved</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{aip.persons_involved}</p>
              </div>
              <div className="col-span-2 md:col-span-4">
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Expected Outputs</p>
                <p className="text-slate-600 dark:text-slate-300">{aip.outputs}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
