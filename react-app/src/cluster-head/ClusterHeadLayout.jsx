import { Routes, Route, useNavigate } from 'react-router-dom';
import { ClipboardText, SignOut } from '@phosphor-icons/react';
import ClusterHeadDashboard from './ClusterHeadDashboard.jsx';

export default function ClusterHeadLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <header className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/AIP-PIR-logo.png" alt="AIP-PIR Logo" className="h-8 w-auto drop-shadow-sm" />
              <div className="w-px h-6 bg-slate-200 dark:bg-dark-border/60 mx-1 hidden sm:block" />
              <img src="/DepEd_Seal.webp" alt="DepEd Seal" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
              <img src="/Division_Logo.webp" alt="Division Logo" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-dark-border/60 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest select-none leading-none">
                QPIR-AIP
              </span>
              <span className="text-[9px] font-black text-amber-600 tracking-[0.2em] uppercase mt-0.5 select-none">
                Cluster Head Review Portal
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate('/cluster-head')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border/40 transition-colors"
            >
              <ClipboardText size={15} />
              PIR Queue
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
          <Route index element={<ClusterHeadDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
