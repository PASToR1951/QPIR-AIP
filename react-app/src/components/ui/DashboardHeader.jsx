

import { useState, useRef, useEffect } from 'react';
import { useAppLogo } from '../../context/BrandingContext.jsx';
import { SignOut as LogOut, CaretDown as ChevronDown, ChatCircleIcon as MessageCircle, TagIcon, IdentificationCardIcon, ListBulletsIcon, BookOpenUserIcon, BooksIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from './NotificationBell.jsx';
import { SchoolAvatar } from './SchoolAvatar.jsx';

const MotionDiv = motion.div;

export const DashboardHeader = ({ user, onLogout }) => {
    const appLogo = useAppLogo();
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

    const displayRole = user?.role || (user?.email?.includes('deped.gov.ph') ? 'DepEd Personnel' : 'User');
    const displayName =
      user?.role === 'School'
        ? (user?.school_name || 'User')
        : user?.role === 'Division Personnel'
          ? (user?.first_name || user?.email?.split('@')[0] || 'User')
          : /* Admin */
            (user?.name || user?.email?.split('@')[0] || 'User');

    return (
        <nav className="bg-white/80 dark:bg-dark-base/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm print:hidden">
            <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
                {/* Left Side Logo */}
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <img src={appLogo} alt="AIP-PIR Logo" className="h-9 w-auto drop-shadow-sm" />
                        <div className="w-px h-6 bg-slate-200 dark:bg-dark-border/60 mx-1 hidden sm:block"></div>
                        <img src="/DepEd_Seal.webp" alt="DepEd Seal" width={36} height={36} loading="lazy" className="h-9 w-auto drop-shadow-sm hidden sm:block" />
                        <img src="/Division_Logo.webp" alt="Division Logo" width={36} height={36} loading="lazy" className="h-9 w-auto drop-shadow-sm hidden sm:block" />
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-dark-border/60 hidden sm:block"></div>
                    <div className="hidden sm:flex min-w-0 flex-col">
                        <div className="font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none uppercase text-[11px] sm:text-xs md:text-sm">
                            DepEd Division of Guihulngan City
                        </div>
                        <div className="text-[9px] font-black text-blue-600 tracking-[0.2em] uppercase mt-0.5">AIP-PIR Portal</div>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">

                {/* Profile Dropdown */}
                <div className="flex items-center relative" ref={dropdownRef}>
                    <button
                        data-tour="dashboard-profile-menu"
                        aria-label="Open profile menu"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex min-w-0 max-w-[58vw] items-center gap-2 rounded-2xl px-2 py-1.5 transition-colors active:scale-95 sm:gap-3 sm:px-3 md:max-w-none ${isDropdownOpen ? 'bg-slate-100 dark:bg-dark-border' : 'hover:bg-slate-50 dark:hover:bg-dark-base'}`}
                    >
                        <div className="hidden sm:flex min-w-0 flex-col items-start text-left md:items-end md:text-right">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight break-words sm:text-sm">
                                {displayName}
                            </span>
                            <span className="mt-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest sm:text-[10px]">
                                {displayRole}
                            </span>
                        </div>
                        {user?.role === 'School' && user?.cluster_number ? (
                            <SchoolAvatar
                                clusterNumber={user.cluster_number}
                                schoolLogo={user?.school_logo ?? null}
                                clusterLogo={user?.cluster_logo ?? null}
                                name={displayName}
                                size={40}
                                rounded="rounded-full"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-black border border-pink-200 uppercase">
                                {displayName[0] || 'U'}
                            </div>
                        )}
                        <ChevronDown size={18} className={`text-slate-400 dark:text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <MotionDiv
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-14 right-0 w-64 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-xl rounded-2xl py-2 z-50 transform origin-top-right"
                            >
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-border md:hidden">
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight break-words">{displayName}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold break-all">{user?.email}</p>
                                </div>
                                
                                <div className="px-2 py-1">
                                    <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-300 dark:text-slate-600 rounded-xl cursor-not-allowed select-none">
                                        <IdentificationCardIcon size={18} />
                                        Profile
                                        <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">Beta</span>
                                    </div>
                                    <Link to="/user-logs" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../UserLogs.jsx')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <ListBulletsIcon size={18} />
                                        User Logs
                                    </Link>
                                </div>

                                <div className="px-2 py-1 border-t border-slate-100 dark:border-dark-border">
                                    <Link to="/getting-started" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/GettingStarted.jsx')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <BookOpenUserIcon size={18} />
                                        Getting Started
                                    </Link>
                                    <Link to="/faq" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/FAQ')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <MessageCircle size={18} />
                                        FAQ
                                    </Link>
                                    <Link to="/docs" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/SystemDocs')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <BooksIcon size={18} />
                                        Documentation
                                    </Link>
                                    <Link to="/changelog" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/Changelog')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
                                        <TagIcon size={18} />
                                        Change Logs
                                    </Link>
                                </div>

                                <div className="px-2 pt-1 border-t border-slate-100 dark:border-dark-border">
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); onLogout(); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                </div>
                <NotificationBell />
                </div>{/* end Right Side Actions */}
            </div>
        </nav>
    );
};
