import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User, BookOpen, MessageCircle, History, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardHeader = ({ user, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper text for role (using email as proxy if role isn't explicitly defined)
    const displayRole = user?.role || (user?.email?.includes('deped.gov.ph') ? 'DepEd Personnel' : 'User');

    return (
        <nav className="bg-white/80 dark:bg-dark-base/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm print:hidden">
            <div className="container mx-auto px-4 flex justify-between items-center h-16 max-w-6xl">
                {/* Left Side Logo */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/AIP-PIR-logo.png" alt="AIP-PIR Logo" className="h-9 w-auto drop-shadow-sm" />
                        <div className="w-px h-6 bg-slate-200 dark:bg-dark-border/60 mx-1 hidden sm:block"></div>
                        <img src="/DepEd_Seal.webp" alt="DepEd Seal" width={36} height={36} loading="lazy" className="h-9 w-auto drop-shadow-sm hidden sm:block" />
                        <img src="/Division_Logo.webp" alt="Division Logo" width={36} height={36} loading="lazy" className="h-9 w-auto drop-shadow-sm hidden sm:block" />
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-dark-border/60 hidden sm:block"></div>
                    <div className="flex flex-col">
                        <div className="font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none uppercase text-xs md:text-sm">
                            DepEd Division of <br className="sm:hidden"/> Guihulngan City
                        </div>
                        <div className="text-[9px] font-black text-blue-600 tracking-[0.2em] uppercase mt-0.5">AIP-PIR Portal</div>
                    </div>
                </div>

                {/* Right Side Profile Dropdown */}
                <div className="flex items-center relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-colors active:scale-95 ${isDropdownOpen ? 'bg-slate-100 dark:bg-dark-border' : 'hover:bg-slate-50 dark:hover:bg-dark-base'}`}
                    >
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none truncate max-w-[150px]">
                                {user?.school_name || user?.name || 'User'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                                {displayRole}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-black border border-pink-200 uppercase">
                            {user?.school_name?.[0] || user?.name?.[0] || 'U'}
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 dark:text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-14 right-0 w-64 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-xl rounded-2xl py-2 z-50 transform origin-top-right"
                            >
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-border md:hidden">
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{user?.school_name || user?.name || 'User'}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold truncate">{user?.email}</p>
                                </div>
                                
                                <div className="px-2 py-1">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <User size={16} strokeWidth={2.5} />
                                        Profile
                                    </a>
                                    <Link to="/faq" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <MessageCircle size={16} strokeWidth={2.5} />
                                        FAQ
                                    </Link>
                                    <Link to="/docs" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <BookOpen size={16} strokeWidth={2.5} />
                                        User Manual
                                    </Link>
                                </div>

                                <div className="px-2 py-1 border-t border-slate-100 dark:border-dark-border">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-xl transition-colors">
                                        <History size={16} strokeWidth={2.5} />
                                        User Logs
                                    </a>
                                    <Link to="/changelog" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors">
                                        <Tag size={16} strokeWidth={2.5} />
                                        Change Logs
                                    </Link>
                                </div>

                                <div className="px-2 pt-1 border-t border-slate-100 dark:border-dark-border">
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); onLogout(); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                                    >
                                        <LogOut size={16} strokeWidth={2.5} />
                                        Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};
