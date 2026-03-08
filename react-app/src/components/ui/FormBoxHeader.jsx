import React from 'react';

export const FormBoxHeader = ({ title, subtitle, badge }) => {
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
