import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Bell, Check, CheckCircle, ArrowBendUpLeft, NotePencil, XCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TYPE_ICON = {
  approved:     <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  returned:     <ArrowBendUpLeft size={16} className="text-amber-400 shrink-0" />,
  remarked:     <NotePencil size={16} className="text-accent shrink-0" />,
  under_review: <Bell size={16} className="text-indigo-400 shrink-0" />,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios
      .get(`${API}/api/notifications`, { headers: authHeaders() })
      .then(r => setNotifications(r.data))
      .catch(() => {});
  }, []);

  // Poll every 60 s and on window focus
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    window.addEventListener('focus', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchNotifications);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const markOne = async (id) => {
    try {
      await axios.patch(`${API}/api/notifications/${id}/read`, {}, { headers: authHeaders() });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  const markAll = async () => {
    try {
      await axios.patch(`${API}/api/notifications/read-all`, {}, { headers: authHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        className={`relative p-2 rounded-xl transition-colors ${open ? 'bg-slate-100 dark:bg-dark-border' : 'hover:bg-slate-50 dark:hover:bg-dark-base'}`}
      >
        <Bell size={22} className="text-slate-500 dark:text-slate-400" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute top-12 right-0 w-80 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-xl rounded-2xl z-50 overflow-hidden origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-dark-border">
              <span className="text-sm font-black text-slate-800 dark:text-slate-100">Notifications</span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    <Check size={14} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <XCircle size={18} weight="fill" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">No notifications yet.</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markOne(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${!n.read ? 'bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-dark-base'}`}
                  >
                    <div className="mt-0.5">{TYPE_ICON[n.type] ?? <Bell size={16} className="text-slate-400 shrink-0" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-snug ${n.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
