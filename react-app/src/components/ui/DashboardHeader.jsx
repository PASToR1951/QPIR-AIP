

import { useState, useRef, useEffect } from 'react';
import { useAppLogo } from '../../context/BrandingContext.jsx';
import { SignOut as LogOut, CaretDown as ChevronDown, ChatCircleIcon as MessageCircle, TagIcon, IdentificationCardIcon, ListBulletsIcon, BookOpenUserIcon, BooksIcon, ClockCounterClockwise, ClipboardText, List as MenuIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from './NotificationBell.jsx';
import { SchoolAvatar } from './SchoolAvatar.jsx';
import MyDevicesModal from './MyDevicesModal.jsx';
import { DivisionSidebar } from './DivisionSidebar.jsx';
import api from '../../lib/api.js';
import { getRoleVisualTheme } from '../../lib/roleVisualTheme.js';
import { ReportingPeriodPicker } from './ReportingPeriodPicker.jsx';
import { useReportingPeriod } from '../../context/ReportingPeriodContext.jsx';

const MotionDiv = motion.div;

export const DashboardHeader = ({ user, onLogout }) => {
    const appLogo = useAppLogo();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDevicesOpen, setIsDevicesOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const dropdownRef = useRef(null);
    const { selectedYear, selectedQuarter } = useReportingPeriod();

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

    useEffect(() => {
        if (user?.role !== 'Division Personnel') return;
        let cancelled = false;

        const params = new URLSearchParams();
        if (selectedYear) params.set('year', selectedYear);
        if (selectedQuarter) params.set('quarter', selectedQuarter);
        const suffix = params.toString() ? `?${params.toString()}` : '';

        api.get(`/api/admin/focal/pending-count${suffix}`)
            .then(res => {
                if (!cancelled) setPendingCount(res.data?.total ?? 0);
            })
            .catch(() => {
                if (!cancelled) setPendingCount(0);
            });
        return () => { cancelled = true; };
    }, [user?.role, selectedYear, selectedQuarter]);

    const displayRole = user?.role || (user?.email?.includes('deped.gov.ph') ? 'DepEd Personnel' : 'User');
    const displayName =
      user?.role === 'School'
        ? (user?.school_name || 'User')
        : user?.role === 'Division Personnel'
          ? (user?.first_name || user?.email?.split('@')[0] || 'User')
          : /* Admin */
            (user?.name || user?.email?.split('@')[0] || 'User');
    const roleTheme = getRoleVisualTheme(user);

    // Only Division Personnel get the navigation sidebar; other roles (e.g.
    // School) have no extra destinations, so the dashboard runs full width.
    // Keep in sync with the `lg:pl-60` padding applied by consuming pages.
    const hasSidebar = user?.role === 'Division Personnel';

    return (
        <>
            {/* Shared Division navigation sidebar (desktop + mobile drawer) */}
            {hasSidebar && (
                <DivisionSidebar
                    user={user}
                    onLogout={onLogout}
                    mobileOpen={isMobileNavOpen}
                    onCloseMobile={() => setIsMobileNavOpen(false)}
                />
            )}

            {/* Top bar */}
            <header className={`sticky top-0 z-30 border-b shadow-sm backdrop-blur-md print:hidden ${roleTheme.header}`}>
                <div className={`h-0.5 w-full ${roleTheme.topAccent}`} />
                <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
                    {/* Mobile: menu toggle (only when a sidebar exists) + brand */}
                    {hasSidebar && (
                        <button
                            aria-label="Open navigation"
                            onClick={() => setIsMobileNavOpen(true)}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-600 transition-colors active:scale-95 dark:text-slate-300 lg:hidden ${roleTheme.hoverNav}`}
                        >
                            <MenuIcon size={20} weight="bold" />
                        </button>
                    )}
                    {/* Brand: always shown on mobile; also on desktop when there's no sidebar to host it */}
                    <div className={`flex min-w-0 items-center gap-2 ${hasSidebar ? 'lg:hidden' : ''}`}>
                        <img src={appLogo} alt="AIP-PIR Logo" className="h-8 w-auto shrink-0 drop-shadow-sm" />
                        <span className="truncate text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">AIP-PIR</span>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <ReportingPeriodPicker />

                        {/* Profile Dropdown */}
                        <div className="flex items-center relative" ref={dropdownRef}>
                            <button
                                data-tour="dashboard-profile-menu"
                                aria-label="Open profile menu"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`flex h-9 min-w-0 max-w-[52vw] items-center gap-2 rounded-lg px-1.5 transition-colors active:scale-95 sm:max-w-none sm:px-2 ${isDropdownOpen ? `${roleTheme.softButton} border` : `${roleTheme.hoverNav} border border-transparent`}`}
                            >
                                <div className="hidden min-w-0 flex-col items-end text-right sm:flex">
                                    <span className="max-w-36 truncate text-xs font-black leading-tight text-slate-900 dark:text-slate-100 md:max-w-44">
                                        {displayName}
                                    </span>
                                    <span className="mt-0.5 max-w-36 truncate text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 md:max-w-44">
                                        {displayRole}
                                    </span>
                                </div>
                                {user?.role === 'School' && user?.cluster_number ? (
                                    <SchoolAvatar
                                        clusterNumber={user.cluster_number}
                                        schoolLogo={user?.school_logo ?? null}
                                        clusterLogo={user?.cluster_logo ?? null}
                                        name={displayName}
                                        size={32}
                                        rounded="rounded-full"
                                        className={`ring-2 ${roleTheme.ring}`}
                                    />
                                ) : user?.role === 'Division Personnel' ? (
                                    <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border bg-white ring-2 dark:bg-dark-surface ${roleTheme.border} ${roleTheme.ring}`}>
                                        <img src="/Division_Logo.webp" alt="Division Logo" className="w-full h-full object-contain" />
                                    </div>
                                ) : (
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border font-black uppercase ring-2 ${roleTheme.avatar} ${roleTheme.ring}`}>
                                        {displayName[0] || 'U'}
                                    </div>
                                )}
                                <ChevronDown size={16} className={`text-slate-400 transition-transform dark:text-slate-500 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <MotionDiv
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute right-0 top-11 z-50 w-64 origin-top-right rounded-lg border border-slate-200 bg-white py-2 shadow-xl dark:border-dark-border dark:bg-dark-surface"
                                    >
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-border md:hidden">
                                            <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight break-words">{displayName}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold break-all">{user?.email}</p>
                                        </div>

                                        <div className="px-2 py-1">
                                            <div className="flex cursor-not-allowed select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-300 dark:text-slate-600">
                                                <IdentificationCardIcon size={18} />
                                                Profile
                                                <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">Beta</span>
                                            </div>
                                            <button
                                                onClick={() => { setIsDropdownOpen(false); setIsDevicesOpen(true); }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/30"
                                            >
                                                <ClockCounterClockwise size={18} />
                                                My Devices
                                            </button>
                                            <Link to="/user-logs" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../UserLogs.jsx')} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/30">
                                                <ListBulletsIcon size={18} />
                                                User Logs
                                            </Link>
                                            {user?.role === 'Division Personnel' && (
                                                <Link to="/division" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../division/DivisionLayout.jsx')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors dark:text-slate-300 ${roleTheme.hoverNav}`}>
                                                    <ClipboardText size={18} />
                                                    Review Queue
                                                    {pendingCount > 0 && (
                                                        <span className="ml-auto rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                                                            {pendingCount > 99 ? '99+' : pendingCount}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </div>

                                        <div className="px-2 py-1 border-t border-slate-100 dark:border-dark-border">
                                            <Link to="/getting-started" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/GettingStarted.jsx')} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/30">
                                                <BookOpenUserIcon size={18} />
                                                Getting Started
                                            </Link>
                                            <Link to="/faq" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/FAQ')} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/30">
                                                <MessageCircle size={18} />
                                                FAQ
                                            </Link>
                                            <Link to="/docs" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/SystemDocs')} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/30">
                                                <BooksIcon size={18} />
                                                Documentation
                                            </Link>
                                            <Link to="/changelog" onClick={() => setIsDropdownOpen(false)} onMouseEnter={() => import('../../components/Changelog')} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/30">
                                                <TagIcon size={18} />
                                                Change Logs
                                            </Link>
                                        </div>

                                        <div className="px-2 pt-1 border-t border-slate-100 dark:border-dark-border">
                                            <button
                                                onClick={() => { setIsDropdownOpen(false); onLogout(); }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
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
            </header>

            <MyDevicesModal open={isDevicesOpen} onClose={() => setIsDevicesOpen(false)} />
        </>
    );
};
