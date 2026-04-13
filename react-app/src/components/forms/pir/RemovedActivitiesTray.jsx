import React from 'react';

export function RemovedActivitiesTray({ removedAIPActivities, handleRestoreActivity }) {
    if (!removedAIPActivities.length) return null;
    return (
        <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3 dark:border-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Removed AIP Activities</span>
                <span className="ml-auto text-[10px] font-semibold text-amber-500">Restore to add back</span>
            </div>
            <div className="divide-y divide-amber-100 dark:divide-amber-900">
                {removedAIPActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {activity.name || <span className="italic font-normal text-slate-400">Untitled Activity</span>}
                            </p>
                            {activity.implementation_period && (
                                <p className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">{activity.implementation_period}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRestoreActivity(activity.id)}
                            className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
                        >
                            Restore
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
