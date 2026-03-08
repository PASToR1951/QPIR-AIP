import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Input = React.forwardRef(({ label, className, endIcon, theme = "default", ...props }, ref) => {
    
    // Theme variants mapping
    const themeClasses = {
        indigo: {
            labelFocus: "group-focus-within:text-indigo-600",
            gradient: "from-indigo-200 to-purple-200",
            input: "bg-[#fafafa] focus:border-transparent focus:ring-indigo-500/20 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)]",
        },
        emerald: {
            labelFocus: "group-focus-within:text-emerald-600",
            gradient: "from-emerald-200 to-teal-200",
            input: "bg-white focus:border-transparent focus:ring-emerald-500/20 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)] print:bg-transparent print:border-b-black print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:rounded-none print:px-0 print:py-1 print:placeholder-transparent print:text-black",
        },
        pink: {
            labelFocus: "group-focus-within:text-pink-600",
            gradient: "from-pink-200 to-rose-200",
            input: "bg-white focus:border-transparent focus:ring-pink-500/20 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)] print:bg-transparent print:border-b-black print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:rounded-none print:px-0 print:py-1 print:placeholder-transparent print:text-black",
        },
        blue: {
            labelFocus: "group-focus-within:text-blue-600",
            gradient: null, // No gradient blur for PIR
            input: "bg-white focus:border-blue-400 focus:ring-blue-500/20 shadow-sm print:bg-transparent print:border-b-black print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:rounded-none print:px-0 print:py-1 print:placeholder-transparent print:text-black",
        },
        default: {
            labelFocus: "group-focus-within:text-slate-600",
            gradient: null,
            input: "bg-white focus:ring-slate-500/20",
        }
    };

    const currentTheme = themeClasses[theme] || themeClasses.default;

    return (
        <div className="flex flex-col gap-1.5 w-full group text-left">
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
                <input
                    ref={ref}
                    className={cn(
                        "relative w-full border border-slate-200 focus:ring-2 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400",
                        endIcon && "pr-11",
                        currentTheme.input,
                        className
                    )}
                    {...props}
                />
                {endIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 transition-colors z-10 print:hidden">
                        {endIcon}
                    </div>
                )}
            </div>
        </div>
    );
});

Input.displayName = "Input";
