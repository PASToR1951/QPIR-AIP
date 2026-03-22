import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House, X,
  FileText, Users, Buildings, BookOpen,
  CalendarBlank, ChartLine, Gear, SignOut, Checks
} from '@phosphor-icons/react';

const NAV_GROUPS = [
  {
    label: 'Monitoring',
    items: [
      { to: '/admin', label: 'Dashboard', icon: House, end: true },
    ],
  },
  {
    label: 'Submissions & Data',
    items: [
      { to: '/admin/submissions', label: 'Submissions', icon: FileText },
      { to: '/verify-aips', label: 'Verify AIPs', icon: Checks },
      { to: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'School Management',
    items: [
      { to: '/admin/schools', label: 'Schools', icon: Buildings },
      { to: '/admin/programs', label: 'Programs', icon: BookOpen },
      { to: '/admin/deadlines', label: 'Deadlines', icon: CalendarBlank },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: ChartLine },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Gear },
    ],
  },
];

const NavItem = ({ to, label, Icon, end, onNavigate }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative select-none
      ${isActive
        ? 'bg-white/55 dark:bg-white/[0.10] text-slate-900 dark:text-slate-50 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm border border-white/60 dark:border-white/[0.08]'
        : 'text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-slate-100 font-medium border border-transparent'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon
          size={20}
          weight={isActive ? 'fill' : 'regular'}
          className={`shrink-0 transition-all duration-200 ${
            isActive
              ? 'text-[#E94560] drop-shadow-[0_0_6px_rgba(233,69,96,0.3)]'
              : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
          }`}
        />
        <span className="truncate">{label}</span>
      </>
    )}
  </NavLink>
);

export const AdminSidebar = ({ user, onLogout, mobileOpen = false, onMobileClose }) => {
  const glassClasses = 'bg-white/40 dark:bg-[#1A1A2E]/40 backdrop-blur-2xl backdrop-saturate-[1.8] border-r border-white/50 dark:border-white/[0.06]';
  const glassShadow = { boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(255,255,255,0.2)' };

  const sidebarContent = (
    <div className="flex flex-col h-full w-[240px]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <img src="/AIP-PIR-logo.png" alt="AIP-PIR" className="h-8 w-auto shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-[-0.01em]">AIP-PIR</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight tracking-wide">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-5 scrollbar-thin scrollbar-thumb-white/30 dark:scrollbar-thumb-white/10">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.06em] px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavItem key={to} to={to} label={label} Icon={Icon} end={end} onNavigate={onMobileClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="px-2 py-3 mt-auto">
        <div className="mx-2 mb-3 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/[0.06] to-transparent" />

        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/30 dark:bg-white/[0.03] border border-white/40 dark:border-white/[0.04] backdrop-blur-sm mb-1.5 transition-all duration-200 hover:bg-white/40 dark:hover:bg-white/[0.05] cursor-default">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E94560] to-[#c23152] flex items-center justify-center shrink-0 shadow-md shadow-[#E94560]/20 ring-2 ring-white/30 dark:ring-white/10">
            <span className="text-[11px] font-semibold text-white leading-none">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/[0.08] rounded-xl transition-all duration-200 border border-transparent hover:border-red-200/40 dark:hover:border-red-500/10"
        >
          <SignOut size={17} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`fixed inset-y-0 left-0 z-50 ${glassClasses} shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] lg:hidden`}
            style={glassShadow}
          >
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/40 dark:hover:bg-white/[0.08] transition-all border border-transparent hover:border-white/40 dark:hover:border-white/[0.06]"
            >
              <X size={15} weight="bold" />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col ${glassClasses} h-screen sticky top-0 shrink-0 overflow-hidden w-[240px]`}
        style={glassShadow}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 dark:via-white/[0.08] to-transparent pointer-events-none" />
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
