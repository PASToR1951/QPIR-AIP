import { useState, createElement } from 'react';
import { Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ClipboardText, FileText, ChartBar, SignOut, Table, List as Menu, XCircle } from '@phosphor-icons/react';
import CESDashboard from './CESDashboard.jsx';
import CESPIRReview from './CESPIRReview.jsx';
import CESAIPReview from './CESAIPReview.jsx';
import AdminConsolidationTemplate from '../admin/pages/AdminConsolidationTemplate.jsx';
import { AnnouncementBanner } from '../components/ui/AnnouncementBanner.jsx';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { auth } from '../lib/auth.js';
import { getRoleVisualTheme } from '../lib/roleVisualTheme.js';
import { ReportingPeriodPicker } from '../components/ui/ReportingPeriodPicker.jsx';

const NAV_BASE = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group select-none border';
const NAV_ACTIVE = 'bg-white/55 dark:bg-white/[0.10] text-slate-900 dark:text-slate-50 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm border-white/60 dark:border-white/[0.08]';

function NavButton({ label, Icon, active, onClick, roleTheme }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`${NAV_BASE} ${active ? NAV_ACTIVE : `text-slate-600 dark:text-slate-300 font-medium border-transparent hover:border-slate-900/[0.06] dark:hover:border-white/[0.08] ${roleTheme.hoverNav}`}`}
    >
      {createElement(Icon, {
        size: 20,
        weight: active ? 'fill' : 'regular',
        className: `shrink-0 transition-all duration-200 ${active ? `${roleTheme.text} drop-shadow-sm` : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`,
      })}
      <span className="truncate flex-1 text-left">{label}</span>
    </button>
  );
}

export default function CESLayout() {
  const appLogo = useAppLogo();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const closeMobile = () => setMobileOpen(false);
  const go = (path) => { navigate(path); closeMobile(); };

  const navGroups = [
    {
      label: 'Review',
      items: [
        { key: 'review', label: 'Review Queue', icon: ClipboardText, onClick: () => go('/ces'), active: location.pathname === '/ces', show: true },
        { key: 'consolidation', label: 'Consolidation', icon: Table, onClick: () => go('/ces/consolidation'), active: isConsolidationRoute, show: isCesReviewer },
      ],
    },
    {
      label: 'My Submissions',
      items: [
        { key: 'aip', label: 'My AIP', icon: FileText, onClick: () => go('/aip'), active: false, show: user?.role !== 'Superintendent' },
        { key: 'pir', label: 'My PIR', icon: ChartBar, onClick: () => go('/pir'), active: false, show: user?.role !== 'Superintendent' },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
    .filter((group) => group.items.length > 0);

  const initials = (user?.name || roleLabel || 'C')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const glassClasses = `bg-white/40 dark:bg-dark-base/40 backdrop-blur-2xl backdrop-saturate-[1.8] border-r ${roleTheme.header}`;
  const glassShadow = { boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(255,255,255,0.2)' };

  const sidebarContent = (
    <div className="flex flex-col h-full w-[240px]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <img src={appLogo} alt="AIP-PIR" className="h-8 w-auto shrink-0 drop-shadow-sm" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-[-0.01em]">AIP-PIR</span>
          <span className={`text-[11px] font-medium leading-tight tracking-wide truncate ${roleTheme.subtleText}`}>{roleLabel}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-5 scrollbar-thin scrollbar-thumb-white/30 dark:scrollbar-thumb-white/10">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.06em] px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavButton key={item.key} label={item.label} Icon={item.icon} active={item.active} onClick={item.onClick} roleTheme={roleTheme} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile section */}
      <div className="px-2 py-3 mt-auto">
        <div className="mx-2 mb-3 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/[0.06] to-transparent" />

        <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/30 dark:bg-white/[0.03] border backdrop-blur-sm mb-1.5 ${roleTheme.border}`}>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleTheme.gradient} flex items-center justify-center shrink-0 shadow-md ${roleTheme.shadow} ring-2 ring-white/30 dark:ring-white/10`}>
            <span className="text-[11px] font-semibold text-white leading-none">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">{user?.name || roleLabel}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">{user?.email || roleLabel}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/[0.08] rounded-xl transition-all duration-200 border border-transparent hover:border-red-200/40 dark:hover:border-red-500/10"
        >
          <SignOut size={17} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 dark:bg-none dark:bg-dark-base font-sans">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <Motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`fixed inset-y-0 left-0 z-50 ${glassClasses} shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] lg:hidden print:hidden`}
            style={glassShadow}
          >
            <button
              onClick={closeMobile}
              className="absolute top-4 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/40 dark:hover:bg-white/[0.08] transition-all border border-transparent hover:border-white/40 dark:hover:border-white/[0.06]"
            >
              <XCircle size={15} weight="bold" />
            </button>
            {sidebarContent}
          </Motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col ${glassClasses} h-screen sticky top-0 shrink-0 overflow-hidden w-[240px] print:hidden`}
        style={glassShadow}
      >
        <div className={`absolute top-0 left-0 right-0 h-0.5 pointer-events-none ${roleTheme.topAccent}`} />
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <header className={`sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md ${roleTheme.header}`}>
          <div className={`absolute inset-x-0 top-0 h-0.5 ${roleTheme.topAccent}`} />
          <button
            onClick={() => setMobileOpen(true)}
            className={`lg:hidden text-slate-500 dark:text-slate-400 ${roleTheme.hoverNav}`}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/DepEd_Seal.webp" alt="DepEd Seal" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
            <img src="/Division_Logo.webp" alt="Division Logo" loading="lazy" className="h-8 w-auto drop-shadow-sm hidden sm:block" />
          </div>
          <div className="ml-auto">
            <ReportingPeriodPicker />
          </div>
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
      </div>
    </div>
  );
}
