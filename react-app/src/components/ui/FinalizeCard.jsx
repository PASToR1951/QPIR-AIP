import React from 'react';

export default function FinalizeCard({ isSubmitted, onSubmit, onPreview, theme = 'pink' }) {
    const themeColors = {
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-950/30',
            bgHover: 'bg-pink-50/30 dark:bg-pink-950/20',
            text: 'text-pink-600',
            borderHover: 'hover:border-pink-200',
            btnBg: 'bg-slate-900 hover:bg-slate-800 shadow-slate-200',
            btnRing: 'ring-slate-500/30 text-white',
            border: 'border-pink-100 dark:border-pink-900/50'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            bgHover: 'bg-blue-50/30 dark:bg-blue-950/20',
            text: 'text-blue-600',
            borderHover: 'hover:border-blue-200',
            btnBg: 'bg-slate-900 hover:bg-slate-800 shadow-slate-200',
            btnRing: 'ring-slate-500/30 text-white',
            border: 'border-blue-100 dark:border-blue-900/50'
        }
    }[theme] || themeColors.pink;

    return (
        <div className={`bg-white dark:bg-dark-surface p-8 md:p-12 rounded-[2.5rem] border-2 border-slate-100 dark:border-dark-border shadow-sm mb-12 flex flex-col items-center justify-center text-center group relative overflow-hidden transition-all ${themeColors.borderHover}`}>
            <div className={`absolute inset-0 ${themeColors.bgHover} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className={`w-16 h-16 ${themeColors.bg} rounded-2xl flex items-center justify-center mb-6 ${themeColors.text} border ${themeColors.border} group-hover:scale-110 transition-transform`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Final Review</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-sm">Please ensure all required information is complete and accurate. Once submitted, the AIP will be recorded and you will not be able to make further edits.</p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center relative z-10">
                {onPreview && (
                    <button
                        type="button"
                        onClick={onPreview}
                        className={`px-8 py-4 bg-${theme}-600 text-white font-bold rounded-2xl shadow-lg shadow-${theme}-200 hover:bg-${theme}-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Preview Document
                    </button>
                )}
                
                <button
                    type="button"
                    className={`px-8 py-4 ${themeColors.btnBg} text-white font-bold rounded-2xl shadow-lg ${themeColors.btnRing} hover:-translate-y-0.5 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
                    onClick={onSubmit}
                    disabled={isSubmitted}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    {isSubmitted ? "Submitted" : "Confirm & Submit"}
                </button>
            </div>
        </div>
    );
}
