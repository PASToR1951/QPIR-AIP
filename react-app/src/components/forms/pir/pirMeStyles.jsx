import React from 'react';
import { TextareaAuto } from '../../ui/TextareaAuto';

// ── Shared className constants ────────────────────────────────────────────────
export const MOBILE_CARD_CLASSNAME         = 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface';
export const MOBILE_INPUT_CLASSNAME        = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-blue-300 dark:border-dark-border dark:bg-dark-base dark:text-slate-200';
export const MOBILE_NUMBER_PANEL_CLASSNAME = 'rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-dark-border dark:bg-dark-base';
export const WIZARD_PANEL_CLASSNAME        = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 dark:border-dark-border dark:bg-dark-surface dark:focus-within:ring-blue-950/20';
export const TABLE_CELL_CLASSNAME          = 'border-r border-slate-200 p-3 align-top dark:border-dark-border';
export const TABLE_NUMBER_INPUT_CLASSNAME  = 'min-h-[44px] w-full rounded-md border border-transparent bg-transparent text-center font-mono text-sm font-semibold text-slate-700 outline-none focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface';
export const TABLE_TEXTAREA_CLASSNAME      = 'w-full rounded-md border border-transparent bg-transparent p-1 font-medium text-slate-700 focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface';
export const TABLE_DELETE_BUTTON_CLASSNAME = 'mx-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-950/30';

// ── Helpers ───────────────────────────────────────────────────────────────────
export function sanitizeDecimalInput(value) {
    return value.replace(/[^0-9.]/g, '');
}

// ── Wizard/Mobile field-definition factories ──────────────────────────────────
export function createWizardTextareaField({ key, label, placeholder, field, handleActivityChange, wrapperClassName = '' }) {
    return {
        key,
        wrapperClassName,
        hideLabel: true,
        render: ({ activity }) => (
            <div className={WIZARD_PANEL_CLASSNAME}>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {label}
                </label>
                <TextareaAuto
                    placeholder={placeholder}
                    className="min-h-[40px] w-full bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                    value={activity[field]}
                    onChange={(event) => handleActivityChange(activity.id, field, event.target.value)}
                />
            </div>
        ),
    };
}

export function createMobileTextareaField({ key, label, placeholder, field, handleActivityChange, wrapperClassName = '' }) {
    return {
        key,
        label,
        wrapperClassName,
        render: ({ activity }) => (
            <TextareaAuto
                placeholder={placeholder}
                className={MOBILE_INPUT_CLASSNAME}
                value={activity[field]}
                onChange={(event) => handleActivityChange(activity.id, field, event.target.value)}
            />
        ),
    };
}
