import React from 'react';
import { FactorCell } from './ui.jsx';
import { FACTOR_TYPES } from './pirReviewUtils.js';

export function FactorsTab({ factors }) {
  return (
    <div className="space-y-4">
      {FACTOR_TYPES.map((type) => {
        const factor = factors[type];
        return (
          <div key={type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-surface">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-dark-border dark:bg-dark-base">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{type}</p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-dark-border">
              <FactorCell label="Facilitating" value={factor?.facilitating} accent="text-emerald-600 dark:text-emerald-400" />
              <FactorCell label="Hindering" value={factor?.hindering} accent="text-rose-600 dark:text-rose-400" />
              <FactorCell label="Recommendations" value={factor?.recommendations || null} accent="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
