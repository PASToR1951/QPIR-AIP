import React from 'react';
import { ArrowsLeftRight, ListDashes } from '@phosphor-icons/react';
import { ActivityRow } from './ActivityRow.jsx';
import { SideBySideView } from './SideBySideView.jsx';

export function ActivitiesTab({
  allAipActivities,
  measureText,
  reviews,
  setViewMode,
  viewMode,
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          {reviews.length} reported activit{reviews.length === 1 ? 'y' : 'ies'}
          {allAipActivities.length > reviews.length && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              · {allAipActivities.length - reviews.length} not reported this quarter
            </span>
          )}
        </p>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-dark-border">
          <button
            onClick={() => setViewMode('inline')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'inline' ? 'bg-white text-slate-800 shadow-sm dark:bg-dark-surface dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <ListDashes size={14} /> Inline
          </button>
          <button
            onClick={() => setViewMode('sidebyside')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'sidebyside' ? 'bg-white text-slate-800 shadow-sm dark:bg-dark-surface dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <ArrowsLeftRight size={14} /> Side-by-Side
          </button>
        </div>
      </div>

      {viewMode === 'inline' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-center dark:border-dark-border dark:bg-dark-base">
                <th rowSpan={2} className="w-8 px-3 py-2.5" />
                <th rowSpan={2} className="border-r border-slate-200 px-3 py-2.5 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-dark-border">Activity</th>
                <th rowSpan={2} className="border-r border-slate-200 px-3 py-2.5 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-dark-border">Period</th>
                <th colSpan={2} className="border-r border-slate-200 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-dark-border">Target</th>
                <th colSpan={2} className="border-r border-slate-200 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-dark-border">Accomplishment</th>
                <th colSpan={2} className="border-r border-slate-200 bg-slate-100/50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-dark-border dark:bg-dark-base/50">Gap (%)</th>
                <th rowSpan={2} className="px-3 py-2.5 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-dark-border">Actions to Address Gap</th>
              </tr>
              <tr className="border-b border-slate-200 bg-white text-center dark:border-dark-border dark:bg-dark-surface">
                <th className="border-r border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border">Physical</th>
                <th className="border-r border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border">Financial</th>
                <th className="border-r border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border">Physical</th>
                <th className="border-r border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border">Financial</th>
                <th className="border-r border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:bg-dark-base/30">Physical</th>
                <th className="border-r border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:bg-dark-base/30">Financial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {reviews.map((review) => (
                <ActivityRow
                  key={review.id}
                  review={review}
                  measureText={measureText}
                />
              ))}
            </tbody>
          </table>
          {allAipActivities.length > reviews.length && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-dark-border dark:bg-dark-base">
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">AIP Activities Not Reported This Quarter</p>
              {allAipActivities
                .filter((activity) => !reviews.some((review) => review.aip_activity_id === activity.id))
                .map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 opacity-60">
                    <span className="font-semibold">{activity.activity_name}</span>
                    <span>·</span><span>{activity.phase}</span>
                    <span>·</span><span>{activity.implementation_period}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <SideBySideView
          reviews={reviews}
          allAipActivities={allAipActivities}
          measureText={measureText}
        />
      )}
    </div>
  );
}
