import { useState } from 'react';
import { Warning } from '@phosphor-icons/react';
import { FLAG_CLS } from './pirReviewUtils.js';

export function FlagChip({ flag }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${FLAG_CLS[flag.color]}`}>
      <Warning size={10} weight="bold" />
      {flag.label}
    </span>
  );
}

export function RateBar({ value }) {
  if (value === null || value === undefined) return <span className="text-slate-400 text-xs">—</span>;
  const capped = Math.min(value, 150);
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 dark:bg-dark-border rounded-full h-1.5 overflow-hidden max-w-[80px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(capped, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${value >= 80 ? 'text-emerald-600 dark:text-emerald-400' : value >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
        {value}%{value > 100 ? ' ↑' : ''}
      </span>
    </div>
  );
}

export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none">
          <div className="w-2 h-2 bg-slate-900 dark:bg-dark-base rotate-45 mx-auto -mb-1" />
          <div className="bg-slate-900 dark:bg-dark-base text-slate-100 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg max-w-[220px] text-center leading-snug">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

export function StatCard({ label, value, icon, color, tooltip }) {
  const colorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20',
    amber:   'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20',
    red:     'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20',
    default: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20',
  };
  const cls = colorMap[color] ?? colorMap.default;
  const card = (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 flex items-center gap-3 cursor-default">
      <div className={`p-2.5 rounded-xl ${cls}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
  return tooltip ? <Tooltip text={tooltip}>{card}</Tooltip> : card;
}

export function MetaField({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value ?? '—'}</p>
    </div>
  );
}

export function FactorCell({ label, value, accent }) {
  const accentCls = accent ?? 'text-slate-400';
  return (
    <div className="px-4 py-3">
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${accentCls}`}>{label}</p>
      {value ? (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-xs text-slate-300 dark:text-slate-600 italic">Not provided</p>
      )}
    </div>
  );
}
