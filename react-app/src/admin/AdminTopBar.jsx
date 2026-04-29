import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { List as Menu, Bell, Check, ArrowBendUpLeft, NotePencil, FileText, ClipboardText, CheckCircle, HourglassMedium, PencilSimple, LockKeyOpen, LockKey, Megaphone, CalendarBlank } from '@phosphor-icons/react';

const PAGE_LABELS = {
  '/admin': 'Dashboard',
  '/admin/submissions': 'Submissions',
  '/admin/users': 'Users',
  '/admin/schools': 'Schools',
  '/admin/programs': 'Programs',
  '/admin/deadlines': 'Deadlines',
  '/admin/reports': 'Reports',
  '/admin/consolidation-template': 'Consolidation',
  '/admin/sessions': 'Device Management',
  '/admin/settings': 'Settings',
};

function relativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const NOTIF_ICON = {
  aip_submitted:           <FileText size={15} className="text-blue-400 shrink-0 mt-0.5" />,
  pir_submitted:           <ClipboardText size={15} className="text-violet-400 shrink-0 mt-0.5" />,
  approved:                <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />,
  returned:                <ArrowBendUpLeft size={15} className="text-amber-400 shrink-0 mt-0.5" />,
  remarked:                <NotePencil size={15} className="text-pink-400 shrink-0 mt-0.5" />,
  under_review:            <Bell size={15} className="text-indigo-400 shrink-0 mt-0.5" />,
  for_recommendation:      <HourglassMedium size={15} className="text-blue-400 shrink-0 mt-0.5" />,
  for_ces_review:          <HourglassMedium size={15} className="text-violet-400 shrink-0 mt-0.5" />,
  for_cluster_head_review: <HourglassMedium size={15} className="text-violet-400 shrink-0 mt-0.5" />,
  aip_edit_requested:      <PencilSimple size={15} className="text-orange-400 shrink-0 mt-0.5" />,
  aip_edit_approved:       <LockKeyOpen size={15} className="text-emerald-400 shrink-0 mt-0.5" />,
  aip_edit_denied:         <LockKey size={15} className="text-red-400 shrink-0 mt-0.5" />,
  announcement:            <Megaphone size={15} className="text-rose-400 shrink-0 mt-0.5" />,
  deadline_reminder:       <CalendarBlank size={15} className="text-sky-400 shrink-0 mt-0.5" />,
  submitted:               <CheckCircle size={15} className="text-slate-400 shrink-0 mt-0.5" />,
};

function resolveAdminRoute(n) {
  if (n.type === 'announcement') return null;
  if (n.entity_type === 'pir' && n.entity_id)
    return `/admin/submissions?type=pir&review=${n.entity_id}`;
  if (n.entity_type === 'aip' && n.entity_id)
    return `/admin/submissions?type=aip&review=${n.entity_id}`;
  return '/admin/submissions';
}

export const AdminTopBar = ({ onMobileMenuToggle, notifications = [], markOne, markAll }) => {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const pageLabel = PAGE_LABELS[pathname] || 'Admin';
  const unread = notifications.filter(n => !n.read).length;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="h-14 bg-white/80 dark:bg-dark-base/80 backdrop-blur-md flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        data-tour="admin-menu-toggle"
        onClick={onMobileMenuToggle}
        className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Menu size={24} />
      </button>

      {/* Page label */}
      <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{pageLabel}</h1>

      {/* Live date/time */}
      <div className="ml-auto hidden sm:flex flex-col items-end leading-none shrink-0">
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 tabular-nums">{timeStr}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{dateStr}</span>
      </div>

      {/* Bell button — always visible on all pages and screen sizes */}
      <div className="relative" ref={dropRef}>
        <button
          data-tour="admin-notifications"
          onClick={() => setOpen(o => !o)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-border/40 transition-colors"
        >
          <Bell size={20} weight={unread > 0 ? 'fill' : 'regular'} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-pink-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-11 w-80 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-xl overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Notifications</span>
                {unread > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-pink-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={() => { markAll?.(); }}
                  className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest"
                >
                  <Check size={13} weight="bold" />
                  Mark all read
                </button>
              )}
            </div>
            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-dark-border/60">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell size={24} className="text-slate-200 dark:text-slate-700" />
                  <p className="text-xs text-slate-400 dark:text-slate-600 font-semibold">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      if (!n.read) markOne?.(n.id);
                      setOpen(false);
                      const route = resolveAdminRoute(n);
                      if (route) navigate(route);
                    }}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors ${
                      !n.read
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-dark-base'
                    }`}
                  >
                    {NOTIF_ICON[n.type] ?? <Bell size={15} className="text-slate-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-snug truncate ${n.read ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug line-clamp-1">{n.message}</p>
                      <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">{relativeTime(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 mt-1.5" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminTopBar;
