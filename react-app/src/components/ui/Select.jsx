import React from 'react';
import { cn } from './Input'; // Reuse utility

export const Select = React.forwardRef(({ label, options, className, theme = "default", ...props }, ref) => {
    
    // Theme variants mapping
    const themeClasses = {
        emerald: {
            labelFocus: "group-focus-within:text-emerald-600",
            gradient: "from-emerald-200 to-teal-200",
            select: "bg-white focus:border-transparent focus:ring-emerald-500/20 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)]",
            iconHover: "group-focus-within:text-emerald-500"
        },
        blue: {
            labelFocus: "group-focus-within:text-blue-600",
            gradient: null, 
            select: "bg-white focus:border-blue-400 focus:ring-blue-500/20 shadow-sm",
            iconHover: "group-focus-within:text-blue-500"
        },
        default: {
            labelFocus: "group-focus-within:text-slate-600",
            gradient: null,
            select: "bg-white focus:ring-slate-500/20",
            iconHover: "group-focus-within:text-slate-500"
        }
    };

    const currentTheme = themeClasses[theme] || themeClasses.default;

    return (
        <div className="flex flex-col gap-1.5 w-full relative group text-left">
            {label && (
                <label className={cn(
                    "text-xs font-semibold text-slate-500 uppercase tracking-widest select-none transition-colors print:hidden",
                    currentTheme.labelFocus
                )}>
                    {label}
                </label>
            )}
            <div className="relative">
                {currentTheme.gradient && (
                    <div className={cn(
                        "absolute -inset-0.5 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-500 bg-gradient-to-r print:hidden",
                        currentTheme.gradient
                    )}></div>
                )}
                <select
                    ref={ref}
                    className={cn(
                        "relative w-full border border-slate-200 focus:ring-2 transition-all rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none cursor-pointer appearance-none print:bg-transparent print:border-b-black print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:rounded-none print:px-0 print:py-1 print:appearance-none print:text-black",
                        currentTheme.select,
                        className
                    )}
                    {...props}
                >
                    {props.placeholder && <option value="" disabled>{props.placeholder}</option>}
                    {options && options.map(opt => (
                        <option key={opt.value || opt} value={opt.value || opt}>
                            {opt.label || opt}
                        </option>
                    ))}
                </select>
                <div className={cn(
                    "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors print:hidden",
                    currentTheme.iconHover
                )}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>
        </div>
    );
});

Select.displayName = "Select";
