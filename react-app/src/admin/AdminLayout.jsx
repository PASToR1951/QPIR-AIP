import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminTopBar } from './AdminTopBar.jsx';

const API = import.meta.env.VITE_API_URL;

export const AdminLayout = ({ children, title, breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deadline, setDeadline] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => setDeadline({ daysLeft: r.data.stats?.daysLeft, currentQuarter: r.data.stats?.currentQuarter }))
      .catch(() => {});
  }, []);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-base">
      <AdminSidebar
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopBar
          title={title}
          breadcrumbs={breadcrumbs}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          deadline={deadline}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
