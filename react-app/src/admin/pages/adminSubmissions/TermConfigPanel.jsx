import React from 'react';
import { CalendarDots, Warning, CheckCircle, FloppyDisk } from '@phosphor-icons/react';
import { TERM_OPTIONS, MONTHS } from './submissionsConstants.js';

export function TermConfigPanel({
  termConfig, pendingTermType, periodMonths, setPeriodMonths,
  termSaving, termSaved, termError,
  handleTermTypeSelect, handleTermSave,
}) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-border space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDots size={14} className="text-violet-500 dark:text-violet-400" />
        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Term Structure</span>
      </div>

      <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
        <Warning size={13} weight="fill" className="shrink-0 mt-px" />
        <span>Existing PIR records keep their original period labels. Only new submissions are affected.</span>
      </div>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {TERM_OPTIONS.map(opt => {
          const activeType = pendingTermType ?? termConfig.termType;
          const isActive   = activeType === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => handleTermTypeSelect(opt.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isActive
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20'
                  : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {isActive && <CheckCircle size={12} weight="fill" className="text-violet-500 dark:text-violet-400" />}
              {opt.label}
              <span className="text-[10px] font-bold opacity-60">{opt.periodCount} periods</span>
            </button>
          );
        })}
      </div>

      {/* Month assignment */}
      {pendingTermType && periodMonths.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Which months does each period cover?
          </p>
          {periodMonths.map((pm, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-16 shrink-0">Period {i + 1}</span>
              <select
                value={pm.start}
                onChange={e => setPeriodMonths(prev => prev.map((m, j) => j === i ? { ...m, start: Number(e.target.value) } : m))}
                className="flex-1 text-xs bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500"
              >
                <option value="">Start month…</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">to</span>
              <select
                value={pm.end}
                onChange={e => setPeriodMonths(prev => prev.map((m, j) => j === i ? { ...m, end: Number(e.target.value) } : m))}
                className="flex-1 text-xs bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500"
              >
                <option value="">End month…</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Apply row */}
      <div className="flex items-center justify-between pt-1">
        <div>{termError && <span className="text-[11px] text-rose-500 font-bold">{termError}</span>}</div>
        <button
          onClick={handleTermSave}
          disabled={termSaving || !pendingTermType || pendingTermType === termConfig.termType}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            termSaved ? 'bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}
        >
          {termSaved
            ? <><CheckCircle size={12} weight="fill" /> Applied</>
            : <><FloppyDisk size={12} weight="bold" /> {termSaving ? 'Saving…' : 'Apply'}</>
          }
        </button>
      </div>
    </div>
  );
}
