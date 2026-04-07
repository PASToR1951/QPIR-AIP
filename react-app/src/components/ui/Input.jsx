import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Info, WarningCircle as AlertCircle } from '@phosphor-icons/react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Theme variants mapping
const THEME_CLASSES = {
    indigo: {
        labelFocus: "group-focus-within:text-blue-700 dark:group-focus-within:text-blue-300",
        gradient: null,
        input: "bg-white dark:bg-dark-surface border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-blue-500/20 shadow-sm",
    },
    emerald: {
        labelFocus: "group-focus-within:text-emerald-600",
        gradient: "from-emerald-200 to-teal-200",
        input: "bg-white dark:bg-dark-surface focus:border-transparent focus:ring-emerald-500/20 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)] print:bg-transparent print:border-b-black print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:rounded-none print:px-0 print:py-1 print:placeholder-transparent print:text-black",
    },
    pink: {
        labelFocus: "group-focus-within:text-pink-600",
        gradient: "from-pink-200 to-rose-200",
        input: "bg-white dark:bg-dark-surface focus:border-transparent focus:ring-pink-500/20 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)] print:bg-transparent print:border-b-black print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:rounded-none print:px-0 print:py-1 print:placeholder-transparent print:text-black",
    },
    blue: {
        labelFocus: "group-focus-within:text-blue-600",
        gradient: null, // No gradient blur for PIR
        input: "bg-white dark:bg-dark-surface focus:border-blue-400 focus:ring-blue-500/20 shadow-sm print:bg-transparent print:border-b-black print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:rounded-none print:px-0 print:py-1 print:placeholder-transparent print:text-black",
    },
    default: {
        labelFocus: "group-focus-within:text-slate-600",
        gradient: null,
        input: "bg-white dark:bg-dark-surface focus:ring-slate-500/20",
    }
};

export const Input = React.forwardRef(({ label, className, endIcon, theme = "default", helpText, error, errorMessage, ...props }, ref) => {
    
    const currentTheme = THEME_CLASSES[theme] || THEME_CLASSES.default;

    return (
        <div className="flex flex-col gap-1.5 w-full group text-left">
            {label && (
                <div className="flex items-center gap-1.5 print:hidden">
                    <label className={cn(
                        "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none transition-colors",
                        currentTheme.labelFocus
                    )}>
                        {label}
                    </label>
                    {helpText && (
                        <div className="relative group/tip">
                            <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-[11px] leading-snug rounded-lg w-52 invisible group-hover/tip:visible opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
                                {helpText}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="relative">
                {currentTheme.gradient && (
                    <div className={cn(
                        "absolute -inset-0.5 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-500 bg-gradient-to-r print:hidden",
                        currentTheme.gradient
                    )}></div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "relative w-full border border-slate-200 dark:border-dark-border focus:ring-2 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        endIcon && "pr-11",
                        error && "border-red-400 focus:ring-red-500/20 bg-red-50 dark:bg-red-950/30",
                        currentTheme.input,
                        className
                    )}
                    aria-invalid={error || undefined}
                    aria-describedby={errorMessage ? `${props.id || props.name}-error` : undefined}
                    {...props}
                />
                {endIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors z-10 print:hidden">
                        {endIcon}
                    </div>
                )}
            </div>
            {error && errorMessage && (
                <p id={`${props.id || props.name}-error`} className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-0.5 print:hidden">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errorMessage}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";
