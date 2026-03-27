import React from 'react';

/**
 * Standard DepEd government document header.
 * Matches the official letterhead: seal → agency hierarchy → document title.
 */
export const GovDocHeader = ({ documentTitle, documentSubtitle, badge }) => (
    <div className="mb-4 pb-2 border-b-2 border-black text-center">
        {/* DepEd Seal */}
        <div className="flex justify-center mb-1">
            <img
                src="/DepEd_Seal.webp"
                alt="DepEd Seal"
                className="h-[70px] w-[70px] object-contain"
            />
        </div>

        {/* Agency hierarchy */}
        <p className="text-[9px] italic font-semibold leading-tight">Republic of the Philippines</p>
        <p className="text-[16px] font-black leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Department of Education
        </p>
        <p className="text-[9px] font-semibold leading-tight tracking-wide">Negros Island Region</p>
        <p className="text-[9px] font-black uppercase tracking-widest leading-tight mb-2">
            Division of Guihulngan City
        </p>

        {/* Document title */}
        <div className="border-t border-slate-400 pt-2 mt-1">
            <h1 className="text-[13px] font-black uppercase tracking-wide leading-snug">
                {documentTitle}
            </h1>
            {documentSubtitle && (
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mt-0.5">{documentSubtitle}</p>
            )}
            {badge && (
                <p className="text-[9px] font-black uppercase tracking-widest mt-0.5">{badge}</p>
            )}
        </div>
    </div>
);
