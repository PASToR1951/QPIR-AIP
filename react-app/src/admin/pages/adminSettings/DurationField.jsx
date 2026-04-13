import React from 'react';
import { DURATION_UNITS, durationInputToMinutes, formatMinutes } from './settingsConstants.js';

export function DurationField({ label, description, value, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{formatMinutes(durationInputToMinutes(value) ?? 0)}</p>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_120px] gap-3">
        <input type="number" min="1" value={value.value} onChange={e => onChange({ ...value, value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
        <select value={value.unit} onChange={e => onChange({ ...value, unit: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all">
          {DURATION_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
      </div>
    </div>
  );
}
