import React from 'react';
import { TextareaAuto } from '../../ui/TextareaAuto';
import { GapSummary } from './GapWidgets.jsx';

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

export function ActivityCollapsedTitle({ activity, isExpanded, calculateGap, handleActivityChange }) {
    const physGap = calculateGap(activity.physTarget, activity.physAcc);
    const finGap  = calculateGap(activity.finTarget,  activity.finAcc);

    if (isExpanded) {
        return (
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Editing Activity</p>
                <div className="mt-2">
                    {activity.fromAIP ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {activity.implementation_period && (
                                <span className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:border-blue-900 dark:bg-blue-950/30">
                                    <CalendarIcon />{activity.implementation_period}
                                </span>
                            )}
                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{activity.name}</p>
                        </div>
                    ) : (
                        <TextareaAuto
                            placeholder="Describe the activity here..."
                            className="w-full border-b border-transparent bg-transparent py-1 text-lg font-semibold text-slate-800 transition-colors focus:border-blue-500 dark:text-slate-100"
                            value={activity.name}
                            onChange={(e) => handleActivityChange(activity.id, 'name', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {activity.name || <span className="italic font-normal text-slate-400 dark:text-slate-500">Untitled Activity...</span>}
            </span>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {activity.implementation_period && (
                    <span className="flex items-center gap-1 whitespace-nowrap font-semibold normal-case tracking-normal text-blue-500">
                        <CalendarIcon />{activity.implementation_period}
                    </span>
                )}
                <GapSummary label="Physical Gap"  value={physGap} />
                <GapSummary label="Financial Gap" value={finGap} />
            </div>
        </div>
    );
}
