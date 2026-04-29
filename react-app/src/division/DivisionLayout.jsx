import { Routes, Route, useNavigate } from 'react-router-dom';
import { ClipboardText, FileText, ChartBar, House, SignOut } from '@phosphor-icons/react';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { auth } from '../lib/auth.js';
import FocalPersonQueue from './FocalPersonQueue.jsx';
import FocalPersonReview from './FocalPersonReview.jsx';

export default function DivisionLayout() {
  const appLogo = useAppLogo();
  const navigate = useNavigate();

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
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-dark-border dark:bg-dark-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="AIP-PIR Logo" className="h-8 w-auto drop-shadow-sm" />
            <div className="hidden h-6 w-px bg-slate-200 dark:bg-dark-border sm:block" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                AIP-PIR
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
                Focal Review Portal
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-dark-border/40 dark:hover:text-slate-200">
              <House size={15} />
              Dashboard
            </button>
            <button onClick={() => navigate('/division')} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-dark-border/40 dark:hover:text-slate-200">
              <ClipboardText size={15} />
              Queue
            </button>
            <button onClick={() => navigate('/aip')} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-dark-border/40 dark:hover:text-slate-200">
              <FileText size={15} />
              My AIP
            </button>
            <button onClick={() => navigate('/pir')} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-dark-border/40 dark:hover:text-slate-200">
              <ChartBar size={15} />
              My PIR
            </button>
            <button onClick={handleLogout} className="ml-2 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400">
              <SignOut size={15} />
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Routes>
          <Route index element={<FocalPersonQueue />} />
          <Route path="pirs/:id/review" element={<FocalPersonReview type="pir" />} />
          <Route path="aips/:id/review" element={<FocalPersonReview type="aip" />} />
        </Routes>
      </main>
    </div>
  );
}
