import React from 'react';

export const ViewModeToggle = ({ appMode, toggleAppMode, theme = "indigo" }) => {
    if (!toggleAppMode || appMode === 'splash') return null;

    const textHoverClasses = {
        indigo: "hover:text-indigo-600",
        emerald: "hover:text-emerald-600",
        pink: "hover:text-pink-600",
        blue: "hover:text-blue-600",
    };

    return (
        <div className="hidden lg:flex items-center gap-2">
            <button
                onClick={toggleAppMode}
                className={`flex text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border px-3 py-1.5 rounded-full shadow-sm transition-colors items-center gap-1.5 ${textHoverClasses[theme]}`}
            >
                {appMode === 'wizard' ? (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg> <span className="hidden sm:inline">Switch to Full View</span></>
                ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg> <span className="hidden sm:inline">Switch to Wizard</span></>
                )}
            </button>

        </div>
    );
};

export default ViewModeToggle;