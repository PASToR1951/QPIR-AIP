import React from 'react';
import { FileText, ChartBar as BarChart3, Clock } from '@phosphor-icons/react';
import { periodNoun, periodPrefix } from '../../lib/periods.js';
import { calculateDaysLeft } from './dashboardPrompt.js';

function formatDeadlineShort(isoDate) {
    if (!isoDate) return 'Not set';
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


function getUrgencyTier(daysLeft) {
    if (daysLeft <= 0)  return { level: 'overdue',   color: 'rose',  bgTint: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' };
    if (daysLeft <= 7)  return { level: 'urgent',    color: 'rose',  bgTint: 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-800' };
    if (daysLeft <= 29) return { level: 'attention', color: 'amber', bgTint: 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800' };
    return                      { level: 'calm',      color: 'slate', bgTint: 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border' };
}

// Interpolate between green (#10b981) and pink (#E94560) based on position t ∈ [0,1]
function gradientColor(t) {
    const r = Math.round(16  + t * (233 - 16));
    const g = Math.round(185 + t * (69  - 185));
    const b = Math.round(129 + t * (96  - 129));
    return `rgb(${r},${g},${b})`;
}

// Segmented progress bar
function SegmentedBar({ completed, total }) {
    if (total === 0) return null;
    return (
        <div className="flex gap-1 mt-3 w-full">
            {Array.from({ length: total }).map((_, i) => {
                const t = total > 1 ? i / (total - 1) : 0;
                return (
                    <div
                        key={i}
                        className="h-1.5 rounded-full flex-1 transition-all"
                        style={i < completed
                            ? { backgroundColor: gradientColor(t) }
                            : { backgroundColor: 'var(--segment-empty)' }
                        }
                    />
                );
            })}
        </div>
    );
}

// Dot pips for PIR progress
function DotPips({ submitted, total }) {
    if (total === 0) return null;
    return (
        <div className="flex gap-1.5 mt-3 justify-start">
            {Array.from({ length: total }).map((_, i) => {
                const t = total > 1 ? i / (total - 1) : 0;
                return (
                    <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full transition-all"
                        style={i < submitted
                            ? { backgroundColor: gradientColor(t) }
                            : { backgroundColor: 'var(--segment-empty)' }
                        }
                    />
                );
            })}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-dark-border/60" />
                        <div className="min-w-0 flex-1">
                            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-dark-border/60" />
                            <div className="mt-4 h-6 w-16 rounded bg-slate-200 dark:bg-dark-border/60" />
                            <div className="mt-3 h-3 w-36 rounded bg-slate-100 dark:bg-dark-border" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function DashboardStats({ data, loading }) {
    if (loading || !data) return <LoadingSkeleton />;

    const { aipCompletion, pirSubmitted, currentQuarter, deadline } = data;
    const currentPeriod = data.currentPeriodLabel || `${periodPrefix(data.period_type)}${currentQuarter}`;
    const currentPeriodShort = `${periodPrefix(data.period_type)}${currentQuarter}`;
    const noun = periodNoun(data.period_type);
    const daysLeft = calculateDaysLeft(deadline);
    const urgency = deadline ? getUrgencyTier(daysLeft) : { level: 'locked', color: 'slate', bgTint: 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border' };

    const aipPending = aipCompletion.total - aipCompletion.completed;
    const pirPending = pirSubmitted.total - pirSubmitted.submitted;
    const allAipDone = aipCompletion.total > 0 && aipCompletion.completed >= aipCompletion.total;
    const allPirDone = pirSubmitted.total > 0 && pirSubmitted.submitted >= pirSubmitted.total;
    const noPirNeeded = pirSubmitted.total === 0;

    return (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* AIP Progress */}
            <div className={`rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-dark-surface ${allAipDone ? 'border-emerald-200 dark:border-emerald-700' : 'border-slate-200 dark:border-dark-border'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${allAipDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400'}`}>
                        <FileText size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">AIP Progress</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                    {aipCompletion.completed} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">of {aipCompletion.total}</span>
                </div>
                <p className={`text-xs font-semibold mt-1.5 ${allAipDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {aipCompletion.total === 0
                        ? 'No programs assigned'
                        : allAipDone
                            ? 'All programs complete'
                            : `${aipPending} program${aipPending !== 1 ? 's' : ''} need AIP`
                    }
                </p>
                <SegmentedBar completed={aipCompletion.completed} total={aipCompletion.total} />
            </div>

            {/* PIR This Quarter */}
            <div className={`rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-dark-surface ${allPirDone ? 'border-emerald-200 dark:border-emerald-700' : noPirNeeded ? 'border-slate-200 dark:border-dark-border' : 'border-amber-100 dark:border-amber-800/50'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${allPirDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : noPirNeeded ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                        <BarChart3 size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{currentPeriodShort} Reviews</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                    {noPirNeeded
                        ? <span className="text-slate-400 dark:text-slate-500">—</span>
                        : <>{pirSubmitted.submitted} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">of {pirSubmitted.total}</span></>
                    }
                </div>
                <p className={`text-xs font-semibold mt-1.5 ${allPirDone ? 'text-emerald-600 dark:text-emerald-400' : noPirNeeded ? 'text-slate-400 dark:text-slate-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    {noPirNeeded
                        ? `No activities this ${noun}`
                        : allPirDone
                            ? 'All reviews submitted'
                            : `${pirPending} review${pirPending !== 1 ? 's' : ''} pending`
                    }
                </p>
                <DotPips submitted={pirSubmitted.submitted} total={pirSubmitted.total} />
            </div>

            {/* Deadline */}
            <div className={`rounded-lg border p-5 shadow-sm transition-all hover:shadow-md ${urgency.bgTint}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        urgency.level === 'calm' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400' :
                        urgency.level === 'attention' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' :
                        'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    }`}>
                        <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{currentPeriodShort} Deadline</span>
                    {urgency.level === 'urgent' && (
                        <span className="relative flex h-2.5 w-2.5 ml-auto">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                        </span>
                    )}
                </div>
                <div className={`text-2xl font-black leading-none ${
                    urgency.level === 'overdue' ? 'text-rose-600' :
                    urgency.level === 'urgent' ? 'text-rose-600' :
                    urgency.level === 'attention' ? 'text-amber-700' :
                    'text-slate-800 dark:text-slate-100'
                }`}>
                    {!deadline
                        ? 'Not Set'
                        : urgency.level === 'overdue'
                        ? (daysLeft === 0 ? 'Due Today' : 'Overdue')
                        : urgency.level === 'calm'
                            ? formatDeadlineShort(deadline)
                            : `${daysLeft} Day${daysLeft !== 1 ? 's' : ''}`
                    }
                </div>
                <p className="text-xs font-semibold mt-1.5 text-slate-500 dark:text-slate-400">
                    {!deadline
                        ? `${currentPeriod} window is not configured`
                        : urgency.level === 'calm'
                        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
                        : `${currentPeriodShort} deadline · ${formatDeadlineShort(deadline)}`
                    }
                </p>
            </div>
        </div>
    );
}
