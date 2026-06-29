import { Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardText, FileText, ChartBar, SignOut, Table } from '@phosphor-icons/react';
import CESDashboard from './CESDashboard.jsx';
import CESPIRReview from './CESPIRReview.jsx';
import CESAIPReview from './CESAIPReview.jsx';
import AdminConsolidationTemplate from '../admin/pages/AdminConsolidationTemplate.jsx';
import Footer from '../components/ui/Footer.jsx';
import { AnnouncementBanner } from '../components/ui/AnnouncementBanner.jsx';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { auth } from '../lib/auth.js';
import { getRoleVisualTheme } from '../lib/roleVisualTheme.js';
import { ReportingPeriodPicker } from '../components/ui/ReportingPeriodPicker.jsx';

export default function CESLayout() {
  const appLogo = useAppLogo();
  const location = useLocation();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
  const isCesReviewer = user?.role?.startsWith('CES-');
  const isConsolidationRoute = location.pathname.startsWith('/ces/consolidation');

  const roleLabel = {
    'CES-SGOD': 'CES – SGOD',
    'CES-ASDS': 'CES – ASDS',
    'CES-CID':  'CES – CID',
    'Superintendent': 'Superintendent',
  }[user?.role] ?? 'CES Portal';
  const roleTheme = getRoleVisualTheme(user);

  const handleLogout = async () => {
    try {
      await auth.logout({ clearDrafts: true });
    } catch {
      window.alert('This browser was cleared, but the server could not confirm logout. Please close the tab if this is a shared device.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const navItems = [
    {
      key: 'review',
      label: 'Review Queue',
      icon: ClipboardText,
      onClick: () => navigate('/ces'),
      active: location.pathname === '/ces',
      show: true,
    },
    {
      key: 'consolidation',
      label: 'Consolidation',
      icon: Table,
      onClick: () => navigate('/ces/consolidation'),
      active: isConsolidationRoute,
      show: isCesReviewer,
    },
    {
      key: 'aip',
      label: 'My AIP',
      icon: FileText,
      onClick: () => navigate('/aip'),
      active: false,
      show: user?.role !== 'Superintendent',
    },
    {
      key: 'pir',
      label: 'My PIR',
      icon: ChartBar,
      onClick: () => navigate('/pir'),
      active: false,
      show: user?.role !== 'Superintendent',
    },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 lg:w-60 flex-col border-r border-slate-200 bg-white dark:border-dark-border dark:bg-dark-surface print:hidden">
        <div className={`h-0.5 w-full ${roleTheme.topAccent}`} />
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-3 dark:border-dark-border lg:px-4">
          <img src={appLogo} alt="AIP-PIR Logo" className="h-8 w-auto shrink-0 drop-shadow-sm" />
          <div className="hidden min-w-0 flex-col lg:flex">
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest select-none leading-none">
              AIP-PIR
            </span>
            <span className={`text-[9px] font-black tracking-[0.2em] uppercase mt-0.5 select-none truncate ${roleTheme.subtleText}`}>
              {roleLabel} Review Portal
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                title={item.label}
                aria-current={item.active ? 'page' : undefined}
                className={`flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors lg:justify-start ${
                  item.active
                    ? roleTheme.activeNav
                    : `text-slate-500 dark:text-slate-400 ${roleTheme.hoverNav}`
                }`}
              >
                <Icon size={20} weight={item.active ? 'fill' : 'regular'} className="shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-2 dark:border-dark-border">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 lg:justify-start"
          >
            <SignOut size={20} className="shrink-0" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col pl-16 lg:pl-60">
        <header className={`sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 ${roleTheme.header}`}>
          <div className="flex items-center gap-2">
            <img src="/DepEd_Seal.webp" alt="DepEd Seal" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
            <img src="/Division_Logo.webp" alt="Division Logo" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
          </div>
          <ReportingPeriodPicker />
        </header>
        <AnnouncementBanner />

        <main className={`flex-1 w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 ${isConsolidationRoute ? 'max-w-7xl' : 'max-w-[92rem]'}`}>
          <Routes>
            <Route index element={<CESDashboard />} />
            <Route path="pirs/:id" element={<CESPIRReview />} />
            <Route path="aips/:id" element={<CESAIPReview />} />
            <Route path="consolidation" element={isCesReviewer ? <AdminConsolidationTemplate /> : <Navigate to="/ces" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}
