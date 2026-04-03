import React from 'react';

const STATUS_CONFIG = {
    'Submitted':     { bg: 'bg-emerald-500', ring: 'ring-emerald-100', text: 'text-emerald-700', label: 'Submitted',     icon: '✓' },
    'In Progress':   { bg: 'bg-blue-500',    ring: 'ring-blue-100',    text: 'text-blue-700',    label: 'In Progress',   icon: null, pulse: true },
    'In Grace':      { bg: 'bg-amber-400',   ring: 'ring-amber-100',   text: 'text-amber-600',   label: 'Grace Period',  icon: '⏳', pulse: true },
    'Missed':        { bg: 'bg-rose-500',     ring: 'ring-rose-100',    text: 'text-rose-600',    label: 'Missed',        icon: '✗' },
    'No Activities': { bg: 'bg-slate-300',    ring: 'ring-slate-100',   text: 'text-slate-400',   label: 'No Activities', icon: '—' },
    'Locked':        { bg: 'bg-slate-200',    ring: 'ring-slate-50',    text: 'text-slate-400',   label: 'Locked',        icon: null, locked: true },
};

function formatDeadline(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function QuarterTimeline({ quarters, currentQuarter, loading }) {
    if (loading || !quarters) {
        return (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm mb-8 animate-pulse">
                <div className="flex justify-between items-center">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 bg-slate-200 dark:bg-dark-border/60 rounded-full" />
                            <div className="w-12 h-3 bg-slate-100 dark:bg-dark-border rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Determine fill progress: index of current quarter on the line
    const progressIndex = Math.max(0, (currentQuarter || 1) - 1);

    return (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 md:px-10 shadow-sm mb-8">
            {/* Desktop: horizontal */}
            <div className="hidden md:block">
                <div className="flex justify-between items-center relative">
                    {/* Connecting line background */}
                    <div className="absolute left-[12%] right-[12%] top-4 h-[2px] bg-slate-200 dark:bg-dark-border/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-400 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${(progressIndex / 3) * 100}%` }}
                        />
                    </div>

                    {quarters.map((q, i) => {
                        const config = STATUS_CONFIG[q.status] || STATUS_CONFIG['Locked'];
                        return (
                            <div key={q.name} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white transition-all ${config.bg} ${config.pulse ? 'ring-4 ' + config.ring + ' animate-pulse' : ''} ${q.status === 'Locked' ? 'text-slate-400' : ''}`}>
                                    {config.icon || (config.locked ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    ) : q.name.replace('Q', ''))}
                                </div>
                                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{q.name}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>{config.label}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{formatDeadline(q.deadline)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile: vertical */}
            <div className="md:hidden space-y-3">
                {quarters.map((q, i) => {
                    const config = STATUS_CONFIG[q.status] || STATUS_CONFIG['Locked'];
                    return (
                        <div key={q.name} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${config.bg} ${config.pulse ? 'ring-3 ' + config.ring + ' animate-pulse' : ''} ${q.status === 'Locked' ? 'text-slate-400' : ''}`}>
                                {config.icon || (config.locked ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                ) : q.name.replace('Q', ''))}
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{q.name}</span>
                                    <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${config.text}`}>{config.label}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{formatDeadline(q.deadline)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
