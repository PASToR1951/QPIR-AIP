import React from 'react';

export function ComplianceToggle({ activity, handleActivityChange }) {
    if (!activity.fromAIP) return null;
    return (
        <div>
            <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Compliance with AIP</label>
            <div className="flex gap-3">
                <button
                    type="button"
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${activity.complied === true ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400 hover:border-emerald-300 dark:border-dark-border dark:text-slate-500'}`}
                    onClick={() => handleActivityChange(activity.id, 'complied', activity.complied === true ? null : true)}
                >
                    ✓ Complied
                </button>
                <button
                    type="button"
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${activity.complied === false ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200 text-slate-400 hover:border-red-300 dark:border-dark-border dark:text-slate-500'}`}
                    onClick={() => handleActivityChange(activity.id, 'complied', activity.complied === false ? null : false)}
                >
                    ✗ Not Complied
                </button>
            </div>
        </div>
    );
}
