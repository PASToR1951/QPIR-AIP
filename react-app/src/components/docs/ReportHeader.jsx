import React from 'react';

/**
 * Formal report header matching the DepEd government document style.
 * Used for PDF exports of admin reports to give them official formality.
 */
export const ReportHeader = ({ reportTitle, reportSubtitle, fiscalYear }) => (
    <div className="report-header mb-6 pb-3 border-b-2 border-black text-center print:bg-white">
        {/* DepEd Seal */}
        <div className="flex justify-center mb-2">
            <img
                src="/DepEd_Seal.webp"
                alt="DepEd Seal"
                className="h-[72px] w-[72px] object-contain"
                crossOrigin="anonymous"
            />
        </div>

        {/* Agency hierarchy */}
        <p className="text-[10px] italic font-semibold leading-tight text-slate-700">Republic of the Philippines</p>
        <p className="text-[17px] font-black leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Department of Education
        </p>
        <p className="text-[10px] font-semibold leading-tight tracking-wide text-slate-700">Negros Island Region</p>
        <p className="text-[10px] font-black uppercase tracking-widest leading-tight mb-2 text-slate-800">
            Division of Guihulngan City
        </p>

        {/* Report title section */}
        <div className="border-t border-slate-400 pt-2 mt-1">
            <h1 className="text-[14px] font-black uppercase tracking-wide leading-snug text-slate-900">
                {reportTitle}
            </h1>
            {reportSubtitle && (
                <p className="text-[10px] uppercase tracking-widest text-slate-600 mt-0.5">{reportSubtitle}</p>
            )}
            {fiscalYear && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Fiscal Year {fiscalYear}</p>
            )}
        </div>
    </div>
);