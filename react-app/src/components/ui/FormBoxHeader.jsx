import React from 'react';

export const FormBoxHeader = ({ title, subtitle, badge, compact = false }) => {
    if (compact) {
        return (
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 select-none mb-10">
                <div className="flex items-center gap-4 shrink-0">
                    <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-12 w-auto" />
                    <img src="/Division_Logo.webp" alt="Division Logo" className="h-10 w-auto" />
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                        Republic of the Philippines • Department of Education
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5 uppercase">
                        {title}
                    </h1>
                </div>
                {badge && (
                    <div className="shrink-0 px-3 py-1 rounded-full text-[10px] font-black bg-white text-slate-600 border border-slate-200 shadow-sm uppercase tracking-tighter">
                        {badge}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center mb-10 select-none text-center">
            <div className="flex justify-center items-center gap-6 mb-6">
                <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-24 w-auto" />
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-20 w-auto" />
            </div>
            <div className="text-[11px] space-y-1 text-slate-500 font-bold uppercase tracking-[0.2em]">
                <p>Republic of the Philippines</p>
                <p className="text-slate-700">Department of Education</p>
                <p>Negros Island Region</p>
                <p>Division of Guihulngan City</p>
            </div>
            <div className="mt-8 flex flex-col items-center">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900 pb-1">
                    {title}
                </h1>
                {subtitle && <p className="text-sm md:text-base mt-2 text-slate-500 font-medium">{subtitle}</p>}
                {badge && (
                    <div className="mt-6 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <span className="relative">{badge}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
