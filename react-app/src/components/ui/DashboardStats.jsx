import React from 'react';
import { FileText, ChartBar as BarChart3, Clock } from '@phosphor-icons/react';

function calculateDaysLeft(isoDate) {
    const deadline = new Date(isoDate);
    const now = new Date();
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadlineShort(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBudget(amount) {
    if (!amount || amount === 0) return null;
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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
        <div className="flex gap-1.5 mt-3 justify-center">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm animate-pulse">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-dark-border/60 rounded-full" />
                        <div className="w-20 h-6 bg-slate-200 dark:bg-dark-border/60 rounded" />
                        <div className="w-32 h-3 bg-slate-100 dark:bg-dark-border rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function DashboardStats({ data, loading }) {
    if (loading || !data) return <LoadingSkeleton />;

    const { aipCompletion, pirSubmitted, currentQuarter, deadline, totalPlannedBudget } = data;
    const daysLeft = calculateDaysLeft(deadline);
    const urgency = getUrgencyTier(daysLeft);

    const aipPending = aipCompletion.total - aipCompletion.completed;
    const pirPending = pirSubmitted.total - pirSubmitted.submitted;
    const allAipDone = aipCompletion.total > 0 && aipCompletion.completed >= aipCompletion.total;
    const allPirDone = pirSubmitted.total > 0 && pirSubmitted.submitted >= pirSubmitted.total;
    const noPirNeeded = pirSubmitted.total === 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* AIP Progress */}
            <div className={`bg-white dark:bg-dark-surface border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md ${allAipDone ? 'border-emerald-200 dark:border-emerald-700' : 'border-slate-200 dark:border-dark-border'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${allAipDone ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400'}`}>
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
            <div className={`bg-white dark:bg-dark-surface border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md ${allPirDone ? 'border-emerald-200 dark:border-emerald-700' : noPirNeeded ? 'border-slate-200 dark:border-dark-border' : 'border-amber-100 dark:border-amber-800/50'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${allPirDone ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : noPirNeeded ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'}`}>
                        <BarChart3 size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Q{currentQuarter} Reviews</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                    {noPirNeeded
                        ? <span className="text-slate-400 dark:text-slate-500">—</span>
                        : <>{pirSubmitted.submitted} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">of {pirSubmitted.total}</span></>
                    }
                </div>
                <p className={`text-xs font-semibold mt-1.5 ${allPirDone ? 'text-emerald-600 dark:text-emerald-400' : noPirNeeded ? 'text-slate-400 dark:text-slate-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    {noPirNeeded
                        ? 'No activities this quarter'
                        : allPirDone
                            ? 'All reviews submitted'
                            : `${pirPending} review${pirPending !== 1 ? 's' : ''} pending`
                    }
                </p>
                <DotPips submitted={pirSubmitted.submitted} total={pirSubmitted.total} />
            </div>

            {/* Deadline */}
            <div className={`border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md ${urgency.bgTint}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        urgency.level === 'calm' ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400' :
                        urgency.level === 'attention' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' :
                        'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}>
                        <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Q{currentQuarter} Deadline</span>
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
                    {urgency.level === 'overdue'
                        ? (daysLeft === 0 ? 'Due Today' : 'Overdue')
                        : urgency.level === 'calm'
                            ? formatDeadlineShort(deadline)
                            : `${daysLeft} Day${daysLeft !== 1 ? 's' : ''}`
                    }
                </div>
                <p className="text-xs font-semibold mt-1.5 text-slate-500 dark:text-slate-400">
                    {urgency.level === 'calm'
                        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
                        : `Q${currentQuarter} deadline · ${formatDeadlineShort(deadline)}`
                    }
                </p>
            </div>
        </div>
    );
}

// Helper for welcome section action prompt
export function getActionPrompt(data, aipStatus) {
    if (!data) return '';
    const { aipCompletion, pirSubmitted, currentQuarter } = data;
    const daysLeft = calculateDaysLeft(data.deadline);

    if (aipCompletion.completed === 0) {
        return `Start by submitting your AIP - Annual Plan for FY ${new Date().getFullYear()}.`;
    }
    if (pirSubmitted.total > 0 && pirSubmitted.submitted < pirSubmitted.total) {
        return `Your Q${currentQuarter} PIR - Quarterly Report is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;
    }
    if (pirSubmitted.total === 0 && aipCompletion.completed > 0) {
        return `No activities are scheduled for Q${currentQuarter}. ${currentQuarter < 4 ? `Your next report opens in Q${currentQuarter + 1}.` : 'All quarters are complete.'}`;
    }
    if (pirSubmitted.submitted >= pirSubmitted.total && aipCompletion.completed >= aipCompletion.total) {
        return `You are on track for Q${currentQuarter}. ${currentQuarter < 4 ? `Your next report opens in Q${currentQuarter + 1}.` : 'Great work this year.'}`;
    }
    return `You are managing the planning and reporting cycle for FY ${new Date().getFullYear()}.`;
}
