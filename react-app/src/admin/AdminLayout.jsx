import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminTopBar } from './AdminTopBar.jsx';
import HelpLauncher from '../components/ui/HelpLauncher.jsx';
import api, { API } from '../lib/api.js';
import { mergeNotifications } from '../lib/notifications.js';
import { auth } from '../lib/auth.js';
import { SSE_INITIAL_RETRY_MS, SSE_MAX_RETRY_MS } from '../constants.js';


export const AdminLayout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const redirectToLogin = useCallback(() => {
    void auth.clearSession();
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    api.get('/api/admin/layout-info')
      .then(r => setDeadline({ daysLeft: r.data.daysLeft, currentQuarter: r.data.currentQuarter }))
      .catch((err) => {
        console.warn('[layout-info]', err?.response?.status);
      });
  }, []);

  const fetchNotifications = useCallback(() => {
    api.get('/api/notifications')
      .then(r => setNotifications(mergeNotifications([], r.data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();

    let abortController = null;
    let retryTimer = null;
    let retryDelay = SSE_INITIAL_RETRY_MS;
    let dead = false;

    async function connect() {
      if (dead) return;
      abortController = new AbortController();

      try {
        const res = await fetch(`${API}/api/notifications/stream`, {
          signal: abortController.signal,
          credentials: 'include',
          headers: {
            'Accept': 'text/event-stream',
          },
        });

        if (res.status === 401) {
          dead = true;
          redirectToLogin();
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        retryDelay = SSE_INITIAL_RETRY_MS; // reset backoff on successful connect

        while (!dead) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const notif = JSON.parse(line.slice(6));
                setNotifications(prev => mergeNotifications(prev, [notif]));
              } catch { /* malformed event — ignore */ }
            }
          }
        }
      } catch (err) {
        if (!dead && err.name !== 'AbortError') {
          retryTimer = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, SSE_MAX_RETRY_MS);
            connect();
          }, retryDelay);
        }
      }
    }

    connect();

    // Full resync on tab focus (handles gaps during inactivity / reconnects)
    window.addEventListener('focus', fetchNotifications);
    return () => {
      dead = true;
      clearTimeout(retryTimer);
      abortController?.abort();
      window.removeEventListener('focus', fetchNotifications);
    };
  }, [fetchNotifications, redirectToLogin]);

  const markOne = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  const markAll = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const user = auth.getUser();

  const handleLogout = () => {
    navigate('/login', { replace: true });
    void auth.clearSession();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-rose-50/30 dark:bg-none dark:bg-dark-base relative select-none [&_input]:select-text [&_textarea]:select-text">
      {/* Ambient gradient blobs for glassmorphism depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#E94560]/[0.06] dark:bg-[#E94560]/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-blue-400/[0.05] dark:bg-[#E94560]/[0.02] rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-violet-300/[0.05] dark:bg-violet-500/[0.02] rounded-full blur-3xl" />
      </div>
      <AdminSidebar
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-[1]">
        <AdminTopBar
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          deadline={deadline}
          notifications={notifications}
          markOne={markOne}
          markAll={markAll}
        />
        <main data-tour="admin-workspace" className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <Outlet />
        </main>
      </div>
      <HelpLauncher />
    </div>
  );
};

export default AdminLayout;
