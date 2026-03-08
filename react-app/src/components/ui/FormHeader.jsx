import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Home, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FormHeader = ({ title, onSave, onBack, isSaving, isSaved, theme = "indigo" }) => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const themeClasses = {
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        pink: "text-pink-600 bg-pink-50 border-pink-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
    };

    const btnClasses = {
        indigo: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
        emerald: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        pink: "bg-pink-600 hover:bg-pink-700 shadow-pink-200",
        blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    };

    const loaderColors = {
        indigo: "#4f46e5",
        emerald: "#10b981",
        pink: "#db2777",
        blue: "#2563eb",
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
            <div className="container mx-auto px-4 flex justify-between items-center h-16 max-w-6xl">
                <div className="flex items-center gap-2 md:gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                        title="Go Back"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    
                    <button 
                        onClick={() => {
                            if (window.confirm("Return to Home? Any unsaved changes will be lost.")) {
                                navigate('/');
                            }
                        }}
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors hidden sm:flex"
                        title="Home Dashboard"
                    >
                        <Home size={18} strokeWidth={2.5} />
                    </button>

                    <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                    <div className="flex flex-col">
                        <h2 className="text-xs md:text-sm font-black text-slate-900 tracking-tight leading-none uppercase truncate max-w-[150px] md:max-w-none">{title}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                             <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter truncate max-w-[120px] md:max-w-none ${themeClasses[theme]}`}>
                                {user?.school_name || user?.name || 'User'}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {isSaved ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-600 border border-emerald-100`}
                            >
                                <CheckCircle size={16} strokeWidth={3} />
                                <span className="hidden sm:inline">Draft Saved</span>
                                <span className="sm:hidden">Saved</span>
                            </motion.div>
                        ) : (
                            <motion.button 
                                layout
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
                                    <Save size={16} strokeWidth={2.5} />
                                )}
                                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Draft'}</span>
                                <span className="sm:hidden">{isSaving ? '...' : 'Save'}</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};
