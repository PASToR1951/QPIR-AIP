import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House, List as ListIcon, X,
  ChartBar, FileText, Users, Buildings, BookOpen,
  CalendarBlank, ChartLine, Gear, SignOut
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

const NavItem = ({ to, label, Icon, end, collapsed }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group relative
      ${isActive
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-l-4 border-slate-800 dark:border-slate-400 pl-2.5'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border hover:text-slate-900 dark:hover:text-slate-100 border-l-4 border-transparent pl-2.5'
      }`
    }
    title={collapsed ? label : undefined}
  >
    <Icon size={18} className="shrink-0" />
    {!collapsed && <span className="truncate">{label}</span>}
    {collapsed && (
      <span className="absolute left-14 bg-slate-900 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
        {label}
      </span>
    )}
  </NavLink>
);

export const AdminSidebar = ({ user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarContent = (
    <div className={`flex flex-col h-full ${collapsed ? 'w-16' : 'w-64'} transition-all duration-200`}>
      {/* Logo + Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-dark-border">
        <img src="/AIP-PIR-logo.png" alt="AIP-PIR" className="h-8 w-auto shrink-0" />
        {!collapsed && (
          <div>
            <div className="font-black text-slate-900 dark:text-slate-100 text-sm leading-none tracking-tight">AIP-PIR</div>
            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mt-0.5">Admin</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hidden lg:flex"
        >
          <ListIcon size={18} />
        </button>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavItem key={to} to={to} label={label} Icon={Icon} end={end} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-3 border-t border-slate-200 dark:border-dark-border">
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <SignOut size={18} className="shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button (shown in AdminTopBar, but keep overlay here) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-50 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border shadow-2xl lg:hidden"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border h-screen sticky top-0 shrink-0 overflow-hidden transition-all duration-200"
        style={{ width: collapsed ? 64 : 256 }}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
