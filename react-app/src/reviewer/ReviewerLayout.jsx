import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardText, SignOut } from '@phosphor-icons/react';
import ReviewerDashboard from './ReviewerDashboard.jsx';
import ReviewerPIRResponse from './ReviewerPIRResponse.jsx';

export default function ReviewerLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      {/* Top nav bar */}
      <header className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
              QPIR-AIP
            </span>
            <span className="text-slate-200 dark:text-dark-border select-none">|</span>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest select-none">
              Reviewer Portal
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/reviewer"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border/40'
                }`
              }
            >
              <ClipboardText size={15} />
              PIR Submissions
            </NavLink>

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

      {/* Page content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route index element={<ReviewerDashboard />} />
          <Route path="pirs/:id" element={<ReviewerPIRResponse />} />
        </Routes>
      </main>
    </div>
  );
}
