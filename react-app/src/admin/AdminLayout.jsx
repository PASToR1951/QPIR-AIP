import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminTopBar } from './AdminTopBar.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/admin/layout-info`, { headers: authHeaders() })
      .then(r => setDeadline({ daysLeft: r.data.daysLeft, currentQuarter: r.data.currentQuarter }))
      .catch(() => {});
  }, []);

  const fetchNotifications = useCallback(() => {
    axios.get(`${API}/api/notifications`, { headers: authHeaders() })
      .then(r => setNotifications(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    window.addEventListener('focus', fetchNotifications);
    return () => { clearInterval(interval); window.removeEventListener('focus', fetchNotifications); };
  }, [fetchNotifications]);

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

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-rose-50/30 dark:from-dark-base dark:via-[#1A1A2E] dark:to-[#0F3460]/20 relative">
      {/* Ambient gradient blobs for glassmorphism depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#E94560]/[0.06] dark:bg-[#E94560]/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-blue-400/[0.05] dark:bg-blue-500/[0.03] rounded-full blur-3xl" />
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
