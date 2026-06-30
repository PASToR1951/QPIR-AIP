import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { List as Menu } from '@phosphor-icons/react';
import { AnnouncementBanner } from '../components/ui/AnnouncementBanner.jsx';
import { DivisionSidebar } from '../components/ui/DivisionSidebar.jsx';
import { auth } from '../lib/auth.js';
import { getRoleVisualTheme } from '../lib/roleVisualTheme.js';
import FocalPersonQueue from './FocalPersonQueue.jsx';
import FocalPersonReview from './FocalPersonReview.jsx';
import ProgramDocuments from './ProgramDocuments.jsx';
import AdminConsolidationTemplate from '../admin/pages/AdminConsolidationTemplate.jsx';
import { ReportingPeriodPicker } from '../components/ui/ReportingPeriodPicker.jsx';

export default function DivisionLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
  const roleTheme = getRoleVisualTheme(user?.role === 'Division Personnel' ? user : 'Division Personnel');

  const handleLogout = async () => {
    try {
      await auth.logout({ clearDrafts: true });
    } catch {
      window.alert('This browser was cleared, but the server could not confirm logout. Please close the tab if this is a shared device.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 dark:bg-none dark:bg-dark-base font-sans lg:pl-60">
      <DivisionSidebar
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen flex-col min-w-0">
        <header className={`sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md ${roleTheme.header}`}>
          <div className={`absolute inset-x-0 top-0 h-0.5 ${roleTheme.topAccent}`} />
          <button
            onClick={() => setMobileOpen(true)}
            className={`lg:hidden text-slate-500 dark:text-slate-400 ${roleTheme.hoverNav}`}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate flex-1">Focal Review Portal</h1>
          <ReportingPeriodPicker />
        </header>
        <AnnouncementBanner />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-5">
          <Routes>
            <Route index element={<FocalPersonQueue />} />
            <Route path="pirs/:id/review" element={<FocalPersonReview type="pir" />} />
            <Route path="aips/:id/review" element={<FocalPersonReview type="aip" />} />
            <Route path="programs" element={<ProgramDocuments />} />
            <Route path="consolidation" element={<AdminConsolidationTemplate />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
