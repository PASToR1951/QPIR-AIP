import React from 'react';
import { LogOut, Home } from 'lucide-react';

export const DashboardHeader = ({ user, onLogout }) => {
    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
            <div className="container mx-auto px-4 flex justify-between items-center h-16 max-w-6xl">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <img src="/DepEd-emblem.webp" alt="DepEd Logo" className="h-8 w-auto" />
                    </div>
                    <div className="flex flex-col">
                        <div className="font-extrabold text-base text-slate-900 tracking-tight leading-none uppercase">DepEd Division of <br className="sm:hidden"/> Guihulngan City</div>
                        <div className="text-[10px] font-bold text-pink-600 tracking-[0.2em] uppercase mt-1">QPIR-AIP Portal</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2 text-right">
                        <span className="text-sm font-black text-slate-900 leading-none">
                            {user?.school_name || user?.name || 'User'}
                        </span>
                        <span className="text-[10px] lowercase tracking-wider text-pink-600 font-extrabold mt-1.5 px-2 py-0.5 bg-pink-50 rounded-full border border-pink-100/50">
                            {user?.email}
                        </span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                    <button 
                        onClick={onLogout}
                        className="group flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <LogOut size={16} strokeWidth={2.5} />
                        </div>
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
