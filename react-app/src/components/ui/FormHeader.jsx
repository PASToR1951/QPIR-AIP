import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Home } from 'lucide-react';

export const FormHeader = ({ title, onSave, theme = "indigo" }) => {
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

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
            <div className="container mx-auto px-4 flex justify-between items-center h-16 max-w-6xl">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to leave? Any unsaved changes will be lost.")) {
                                navigate('/');
                            }
                        }}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">{title}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                             <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${themeClasses[theme]}`}>
                                {user?.school_name || user?.name || 'User'}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={onSave}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-lg ${btnClasses[theme]}`}
                    >
                        <Save size={16} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Save Draft</span>
                        <span className="sm:hidden">Save</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
