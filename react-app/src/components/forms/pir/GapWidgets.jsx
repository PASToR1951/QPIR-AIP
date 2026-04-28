import React from 'react';
import { WIZARD_PANEL_CLASSNAME, MOBILE_NUMBER_PANEL_CLASSNAME, sanitizeDecimalInput, CommaNumberInput } from './pirMeStyles.jsx';

/** Inline text summary: "Physical Gap: -2.50%" with color */
export function GapSummary({ label, value }) {
    return (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
            {label}:{' '}
            <span className={value < 0 ? 'text-red-500' : 'text-emerald-500'}>
                {value.toFixed(2)}%
            </span>
        </span>
    );
}

/** Wizard-mode target/accomplished/gap panel for one axis (physical or financial) */
export function GapPanel({ title, colorClass, targetValue, accomplishedValue, gapValue, onTargetChange, onAccomplishedChange }) {
    return (
        <div className="flex flex-col gap-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <span className={`h-2 w-2 rounded-full ${colorClass}`} />
                {title}
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <div className={WIZARD_PANEL_CLASSNAME}>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Target</label>
                    <CommaNumberInput value={targetValue} onChange={onTargetChange}
                        className="w-full bg-transparent font-mono text-base font-semibold text-slate-800 outline-none dark:text-slate-100" />
                </div>
                <div className={WIZARD_PANEL_CLASSNAME}>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Accomplished</label>
                    <CommaNumberInput value={accomplishedValue} onChange={onAccomplishedChange}
                        className="w-full bg-transparent font-mono text-base font-semibold text-slate-800 outline-none dark:text-slate-100" />
                </div>
            </div>
            <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${gapValue < 0 ? 'border-red-100 bg-red-50 dark:bg-red-950/30' : 'border-slate-200 bg-slate-100 dark:border-dark-border dark:bg-dark-border'}`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title.replace('Targets', 'Gap')}</span>
                <span className={`font-mono text-sm font-bold ${gapValue < 0 ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>{gapValue.toFixed(2)}%</span>
            </div>
        </div>
    );
}

/** Mobile-mode 2×2 number input grid for physical/financial targets and accomplishments */
export function MobileGapInputs({ activity, calculateGap, handleActivityChange }) {
    const physGap = calculateGap(activity.physTarget, activity.physAcc);
    const finGap  = calculateGap(activity.finTarget,  activity.finAcc);
    const fields = [
        { label: 'Physical Target',        field: 'physTarget' },
        { label: 'Physical Accomplished',  field: 'physAcc'    },
        { label: 'Financial Target',       field: 'finTarget'  },
        { label: 'Financial Accomplished', field: 'finAcc'     },
    ];
    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                {fields.map(({ label, field }) => (
                    <div key={field} className={MOBILE_NUMBER_PANEL_CLASSNAME}>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</label>
                        <CommaNumberInput
                            className="w-full bg-transparent font-mono text-sm font-semibold text-slate-800 outline-none dark:text-slate-100"
                            value={activity[field]}
                            onChange={(e) => handleActivityChange(activity.id, field, sanitizeDecimalInput(e.target.value))}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] font-bold uppercase tracking-widest">
                <div className={`rounded-xl border px-3 py-2 ${physGap < 0 ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-950/30' : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-dark-border dark:bg-dark-border dark:text-slate-300'}`}>
                    Physical Gap: {physGap.toFixed(2)}%
                </div>
                <div className={`rounded-xl border px-3 py-2 ${finGap < 0 ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-950/30' : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-dark-border dark:bg-dark-border dark:text-slate-300'}`}>
                    Financial Gap: {finGap.toFixed(2)}%
                </div>
            </div>
        </>
    );
}
