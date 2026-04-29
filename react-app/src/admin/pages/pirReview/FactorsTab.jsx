import React from 'react';
import { FactorCell } from './ui.jsx';
import { FACTOR_TYPES } from './pirReviewUtils.js';

function isActivityFactorMap(factor) {
  return factor && typeof factor === 'object' &&
    !Array.isArray(factor) &&
    typeof factor.facilitating !== 'string' &&
    typeof factor.hindering !== 'string';
}

function ActivityFactorRows({ factor, activities }) {
  const orderedActivities = [
    ...activities.filter((activity) => !activity.isUnplanned),
    ...activities.filter((activity) => activity.isUnplanned),
  ];
  const fallbackRows = Object.entries(factor ?? {}).map(([activityId, entry], index) => ({
    id: activityId,
    name: `Activity ${index + 1}`,
    entry,
  }));
  const rows = orderedActivities.length
    ? orderedActivities.map((activity, index) => ({
      id: activity.id,
      name: activity.name || `Activity ${index + 1}`,
      entry: factor?.[activity.id] ?? {},
    }))
    : fallbackRows;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-dark-base dark:text-slate-400">
            <th className="w-[34%] border-r border-slate-100 px-4 py-2 dark:border-dark-border">Activity</th>
            <th className="w-[33%] border-r border-slate-100 px-4 py-2 text-emerald-600 dark:border-dark-border">Facilitating</th>
            <th className="w-[33%] px-4 py-2 text-rose-600">Hindering</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 dark:border-dark-border">
              <td className="border-r border-slate-100 px-4 py-3 align-top font-semibold text-slate-700 dark:border-dark-border dark:text-slate-200">{row.name || 'Untitled Activity'}</td>
              <td className="border-r border-slate-100 px-4 py-3 align-top whitespace-pre-wrap text-slate-600 dark:border-dark-border dark:text-slate-300">{row.entry?.facilitating || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}</td>
              <td className="px-4 py-3 align-top whitespace-pre-wrap text-slate-600 dark:text-slate-300">{row.entry?.hindering || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FactorsTab({ factors, activities = [] }) {
  return (
    <div className="space-y-4">
      {FACTOR_TYPES.map((type) => {
        const factor = factors[type];
        return (
          <div key={type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-surface">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-dark-border dark:bg-dark-base">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{type}</p>
            </div>
            {isActivityFactorMap(factor) ? (
              <ActivityFactorRows factor={factor} activities={activities} />
            ) : (
              <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-dark-border">
                <FactorCell label="Facilitating" value={factor?.facilitating} accent="text-emerald-600 dark:text-emerald-400" />
                <FactorCell label="Hindering" value={factor?.hindering} accent="text-rose-600 dark:text-rose-400" />
                <FactorCell label="Recommendations" value={factor?.recommendations || null} accent="text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
