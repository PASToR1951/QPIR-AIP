import { Routes, Route, useNavigate } from 'react-router-dom';
import { ClipboardText, FileText, ChartBar, SignOut } from '@phosphor-icons/react';
import CESDashboard from './CESDashboard.jsx';
import CESPIRReview from './CESPIRReview.jsx';
import CESAIPReview from './CESAIPReview.jsx';
import Footer from '../components/ui/Footer.jsx';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { auth } from '../lib/auth.js';

export default function CESLayout() {
  const appLogo = useAppLogo();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; } })();

  const roleLabel = {
    'CES-SGOD': 'CES – SGOD',
    'CES-ASDS': 'CES – ASDS',
    'CES-CID':  'CES – CID',
  }[user?.role] ?? 'CES Portal';

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
      <header className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border sticky top-0 z-40">
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
              <span className="text-[9px] font-black text-teal-600 tracking-[0.2em] uppercase mt-0.5 select-none">
                {roleLabel} Review Portal
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate('/ces')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border/40 transition-colors"
            >
              <ClipboardText size={15} />
              Review Queue
            </button>

            <button
              onClick={() => navigate('/aip')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border/40 transition-colors"
            >
              <FileText size={15} />
              My AIP
            </button>

            <button
              onClick={() => navigate('/pir')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border/40 transition-colors"
            >
              <ChartBar size={15} />
              My PIR
            </button>

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

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route index element={<CESDashboard />} />
          <Route path="pirs/:id" element={<CESPIRReview />} />
          <Route path="aips/:id" element={<CESAIPReview />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
