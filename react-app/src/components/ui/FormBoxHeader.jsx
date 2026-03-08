import React from 'react';

export const FormBoxHeader = ({ title, subtitle, badge, compact = false }) => {
    if (compact) {
        return (
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 select-none mb-4">
                <div className="flex items-center gap-4 shrink-0">
                    <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-16 w-auto drop-shadow-sm" />
                    <img src="/Division_Logo.webp" alt="Division Logo" className="h-16 w-auto drop-shadow-sm" />
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                        Republic of the Philippines • Department of Education
                    </div>
                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight mt-0.5">
                        Region VII, Central Visayas
                    </div>
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                        Division of Guihulngan City
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter mt-2 uppercase">
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
        <div className="flex flex-col items-center justify-center mb-10 select-none text-center relative">
            <div className="flex justify-center items-center gap-6 mb-6">
                <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-24 w-auto drop-shadow-md" />
                <div className="flex flex-col items-center">
                    <div className="text-[11px] space-y-0.5 text-slate-500 font-bold uppercase tracking-[0.25em] leading-tight">
                        <p>Republic of the Philippines</p>
                        <p className="text-slate-900 font-extrabold text-[12px] tracking-[0.3em]">Department of Education</p>
                        <p>Region VII, Central Visayas</p>
                        <p className="text-blue-600 tracking-[0.15em]">Schools Division of Guihulngan City</p>
                    </div>
                </div>
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-24 w-auto drop-shadow-md" />
            </div>
            
            <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-8"></div>

            <div className="flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 pb-1 uppercase">
                    {title}
                </h1>
                {subtitle && <p className="text-sm md:text-lg mt-3 text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">{subtitle}</p>}
                {badge && (
                    <div className="mt-8 inline-flex items-center px-6 py-2 rounded-2xl text-[11px] font-black bg-slate-900 text-white shadow-xl shadow-slate-200 relative overflow-hidden group uppercase tracking-widest">
                        <span className="relative z-10">{badge}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 px-6 py-2"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
