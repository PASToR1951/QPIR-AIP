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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <header className={`border-b sticky top-0 z-40 ${roleTheme.header}`}>
        <div className={`h-0.5 w-full ${roleTheme.topAccent}`} />
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={appLogo} alt="AIP-PIR Logo" className="h-8 w-auto drop-shadow-sm" />
              <div className="w-px h-6 bg-slate-200 dark:bg-dark-border/60 mx-1 hidden sm:block" />
              <img src="/DepEd_Seal.webp" alt="DepEd Seal" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
              <img src="/Division_Logo.webp" alt="Division Logo" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-dark-border/60 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest select-none leading-none">
                AIP-PIR
              </span>
              <span className={`text-[9px] font-black tracking-[0.2em] uppercase mt-0.5 select-none ${roleTheme.subtleText}`}>
                {roleLabel} Review Portal
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <div className="mr-4">
              <ReportingPeriodPicker />
            </div>
            <button
              onClick={() => navigate('/ces')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors ${roleTheme.hoverNav}`}
            >
              <ClipboardText size={15} />
              Review Queue
            </button>

            {isCesReviewer && (
              <button
                onClick={() => navigate('/ces/consolidation')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors ${roleTheme.hoverNav}`}
              >
                <Table size={15} />
                Consolidation
              </button>
            )}

            {user?.role !== 'Superintendent' && (
              <>
                <button
                  onClick={() => navigate('/aip')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors ${roleTheme.hoverNav}`}
                >
                  <FileText size={15} />
                  My AIP
                </button>

                <button
                  onClick={() => navigate('/pir')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors ${roleTheme.hoverNav}`}
                >
                  <ChartBar size={15} />
                  My PIR
                </button>
              </>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-2"
            >
              <SignOut size={15} />
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <AnnouncementBanner />

      <main className={`flex-1 w-full mx-auto px-4 py-8 ${isConsolidationRoute ? 'max-w-7xl' : 'max-w-6xl'}`}>
        <Routes>
          <Route index element={<CESDashboard />} />
          <Route path="pirs/:id" element={<CESPIRReview />} />
          <Route path="aips/:id" element={<CESAIPReview />} />
          <Route path="consolidation" element={isCesReviewer ? <AdminConsolidationTemplate /> : <Navigate to="/ces" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
