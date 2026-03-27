import React from 'react';

export const FormBoxHeader = ({ title, subtitle, badge, compact = false }) => {
    if (compact) {
        return (
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-dark-surface rounded-2xl border border-slate-100 dark:border-dark-border select-none mb-4">
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-10 sm:h-16 w-auto drop-shadow-sm print:block" />
                    <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-10 sm:h-16 w-auto drop-shadow-sm print:block" />
                    <img src="/Division_Logo.webp" alt="Division Logo" className="h-10 sm:h-16 w-auto drop-shadow-sm print:block" />
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-dark-border hidden md:block"></div>
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
                        Republic of the Philippines • Department of Education
                    </div>
                    <div className="text-[11px] sm:text-[12px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mt-0.5">
                        Negros Island Region
                    </div>
                    <div className="text-[11px] sm:text-[12px] font-black text-blue-600 uppercase tracking-tight">
                        Division of Guihulngan City
                    </div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight sm:tracking-tighter mt-2 uppercase">
                        {title}
                    </h1>
                </div>
                {badge && (
                    <div className="shrink-0 px-3 py-1 rounded-full text-[11px] font-black bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-border shadow-sm uppercase tracking-tighter">
                        {badge}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center mb-10 select-none text-center relative">
            <div className="flex justify-center items-center gap-4 md:gap-8 mb-6 w-full max-w-4xl mx-auto">
                <div className="flex items-center gap-3 shrink-0">
                    <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-24 w-auto drop-shadow-md hidden md:block print:block" />
                    <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-24 w-auto drop-shadow-md hidden md:block print:block" />
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-[10px] md:text-[11px] space-y-0.5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] leading-tight text-center">
                        <p>Republic of the Philippines</p>
                        <p className="text-slate-900 dark:text-slate-100 font-extrabold text-[11px] md:text-[12px] tracking-[0.2em] md:tracking-[0.3em]">Department of Education</p>
                        <p>Negros Island Region</p>
                        <p className="text-blue-600 tracking-[0.1em] md:tracking-[0.15em]">Schools Division of Guihulngan City</p>
                    </div>
                </div>
                <div className="items-center gap-3 shrink-0 hidden md:flex print:flex">
                    <img src="/Division_Logo.webp" alt="Division Logo" className="h-24 w-auto drop-shadow-md" />
                    <img src="/AIP-PIR-logo.png" alt="AIP-PIR Logo" className="h-24 w-auto drop-shadow-md" />
                </div>
            </div>

            <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-dark-border to-transparent mb-8"></div>

            <div className="flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-slate-100 pb-1 uppercase">
                    {title}
                </h1>
                {subtitle && <p className="text-sm md:text-lg mt-3 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest bg-slate-50 dark:bg-dark-surface px-4 py-1 rounded-full border border-slate-100 dark:border-dark-border">{subtitle}</p>}
                {badge && (
                    <div className="mt-8 inline-flex items-center px-6 py-2 rounded-2xl text-[11px] font-black bg-slate-900 dark:bg-dark-surface text-white shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden group uppercase tracking-widest">
                        <span className="relative z-10">{badge}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 px-6 py-2"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
