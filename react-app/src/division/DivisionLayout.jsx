import { createElement } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { ClipboardText, FileText, ChartBar, House, SignOut } from '@phosphor-icons/react';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { AnnouncementBanner } from '../components/ui/AnnouncementBanner.jsx';
import { auth } from '../lib/auth.js';
import { getRoleVisualTheme } from '../lib/roleVisualTheme.js';
import FocalPersonQueue from './FocalPersonQueue.jsx';
import FocalPersonReview from './FocalPersonReview.jsx';
import ProgramDocuments from './ProgramDocuments.jsx';
import AdminConsolidationTemplate from '../admin/pages/AdminConsolidationTemplate.jsx';
import { ReportingPeriodPicker } from '../components/ui/ReportingPeriodPicker.jsx';

export default function DivisionLayout() {
  const appLogo = useAppLogo();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
  const roleTheme = getRoleVisualTheme(user?.role === 'Division Personnel' ? user : 'Division Personnel');
  const navItems = [
    { to: '/', label: 'Dashboard', icon: House, end: true },
    { to: '/division', label: 'Queue', icon: ClipboardText, end: true },
    { to: '/division/programs', label: 'Programs', icon: FileText },
    { to: '/division/consolidation', label: 'Consolidation', icon: ChartBar },
    { to: '/aip', label: 'My AIP', icon: FileText },
    { to: '/pir', label: 'My PIR', icon: ChartBar },
  ];

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
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-dark-base">
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${roleTheme.header}`}>
        <div className={`h-0.5 w-full ${roleTheme.topAccent}`} />
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img src={appLogo} alt="AIP-PIR Logo" className="h-8 w-auto shrink-0 drop-shadow-sm" />
            <div className="hidden h-6 w-px bg-slate-200 dark:bg-dark-border sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                AIP-PIR
              </p>
              <p className={`hidden truncate text-[10px] font-black uppercase tracking-[0.18em] sm:block ${roleTheme.subtleText}`}>
                Focal Review Portal
              </p>
            </div>
          </div>

          <nav className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto">
            <div className="mr-3">
              <ReportingPeriodPicker />
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-xs font-black transition-colors sm:px-3 ${
                    isActive
                      ? roleTheme.activeNav
                      : `text-slate-500 dark:text-slate-400 ${roleTheme.hoverNav}`
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {createElement(item.icon, { size: 16, weight: isActive ? 'fill' : 'regular' })}
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="ml-1 flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-xs font-black text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:px-3">
              <SignOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </nav>
        </div>
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
  );
}
