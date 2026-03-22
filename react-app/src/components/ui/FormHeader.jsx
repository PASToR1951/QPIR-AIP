import React from 'react';
import { ArrowLeft, FloppyDisk as Save, House as Home, CheckCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeToggle } from './ViewModeToggle';

export const FormHeader = ({ title, programName, onSave, onBack, onHome, isSaving, isSaved, lastSavedTime, theme = "indigo", appMode, toggleAppMode, onBeta }) => {
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch {
        localStorage.removeItem('user');
    }

    const pillClasses = {
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
        pink: "text-pink-600 bg-pink-50 border-pink-200",
        blue: "text-blue-600 bg-blue-50 border-blue-200",
    };

    const btnClasses = {
        indigo: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
        emerald: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        pink: "bg-pink-600 hover:bg-pink-700 shadow-pink-200",
        blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    };

    const formLabel = title?.includes('Annual') ? 'AIP' : title?.includes('Quarterly') ? 'PIR' : '';
    const displayTitle = programName || title;
    const schoolName = user?.school_name;

    return (
        <nav className="bg-white/80 dark:bg-dark-base/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm print:hidden">
            <div className="container mx-auto px-4 flex justify-between items-center h-16 max-w-6xl">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
                        title="Go Back"
                    >
                        <ArrowLeft size={22} weight="bold" />
                    </button>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate max-w-[160px] md:max-w-[300px] lg:max-w-none">{displayTitle}</h2>
                            {formLabel && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide shrink-0 ${pillClasses[theme]}`}>
                                    {formLabel}
                                </span>
                            )}
                        </div>
                        {schoolName && (
                            <span className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[160px] md:max-w-[300px] lg:max-w-none">
                                {schoolName}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ViewModeToggle appMode={appMode} toggleAppMode={toggleAppMode} onBeta={onBeta} theme={theme} />

                    {lastSavedTime && !isSaved && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                            Last saved: {lastSavedTime}
                        </span>
                    )}
                    <AnimatePresence mode="wait">
                        {isSaved ? (
                            <motion.div
                                key="saved"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50`}
                            >
                                <CheckCircle size={18} />
                                <span className="hidden sm:inline">Saved {lastSavedTime}</span>
                                <span className="sm:hidden">Saved</span>
                            </motion.div>
                        ) : onSave ? (
                            <motion.button 
                                key="save-btn"
                                onClick={onSave}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-lg disabled:opacity-70 disabled:cursor-wait ${btnClasses[theme]}`}
                            >
                                {isSaving ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <Save size={18} />
                                )}
                                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Draft'}</span>
                                <span className="sm:hidden">{isSaving ? '...' : 'Save'}</span>
                            </motion.button>
                        ) : null}
                    </AnimatePresence>

                    {onHome && (
                        <>
                            <div className="w-px h-6 bg-slate-200 dark:bg-dark-border mx-1 hidden sm:block"></div>
                            <button
                                onClick={onHome}
                                className="p-2 bg-slate-50 dark:bg-dark-surface text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-colors hidden sm:flex"
                                title="Home Dashboard"
                            >
                                <Home size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
