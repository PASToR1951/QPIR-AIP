import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useAccessibility } from './context/AccessibilityContext';
import api from './lib/api.js';
import PageTransition from './components/ui/PageTransition';
import FormBackground from './components/ui/FormBackground';
import HelpLauncher from './components/ui/HelpLauncher.jsx';
import OnboardingController from './components/ui/OnboardingController.jsx';
import PracticeModeController from './components/ui/PracticeModeController.jsx';
import ForceChangePasswordModal from './components/ui/ForceChangePasswordModal.jsx';
import { auth } from './lib/auth';
import Login from './Login';

// Route-level lazy imports — each becomes its own chunk
const Dashboard = lazy(() => import('./Dashboard'));
const AIPForm = lazy(() => import('./AIPForm'));
const PIRForm = lazy(() => import('./PIRForm'));
const NotFound = lazy(() => import('./NotFound'));
const ErrorPage = lazy(() => import('./ErrorPage'));
const Changelog = lazy(() => import('./components/Changelog'));
const SystemDocs = lazy(() => import('./components/SystemDocs'));
const GettingStarted = lazy(() => import('./components/GettingStarted.jsx'));
const FAQ = lazy(() => import('./components/FAQ'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const OAuthCallback = lazy(() => import('./OAuthCallback'));
const MagicLinkCallback = lazy(() => import('./MagicLinkCallback.jsx'));

// CES pages
const CESLayout = lazy(() => import('./ces/CESLayout.jsx'));

// Cluster Head pages
const ClusterHeadLayout = lazy(() => import('./cluster-head/ClusterHeadLayout.jsx'));

// Admin layout + pages
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const AdminOverview = lazy(() => import('./admin/pages/AdminOverview.jsx'));
const AdminSubmissions = lazy(() => import('./admin/pages/AdminSubmissions.jsx'));
const AdminUsers = lazy(() => import('./admin/pages/AdminUsers.jsx'));
const AdminSchools = lazy(() => import('./admin/pages/AdminSchools.jsx'));
const AdminPrograms = lazy(() => import('./admin/pages/AdminPrograms.jsx'));
const AdminDeadlines = lazy(() => import('./admin/pages/AdminDeadlines.jsx'));
const AdminReports = lazy(() => import('./admin/pages/AdminReports.jsx'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings.jsx'));
const AdminBackups = lazy(() => import('./admin/pages/AdminBackups.jsx'));
const AdminSessions = lazy(() => import('./admin/pages/AdminSessions.jsx'));
const AdminLogs = lazy(() => import('./admin/pages/AdminLogs.jsx'));
const AdminPIRReview = lazy(() => import('./admin/pages/AdminPIRReview.jsx'));
const AdminConsolidationTemplate = lazy(() => import('./admin/pages/AdminConsolidationTemplate.jsx'));
const UserLogs = lazy(() => import('./UserLogs.jsx'));

const CES_ROLES = ['CES-SGOD', 'CES-ASDS', 'CES-CID'];

// Preload only the chunks the logged-in user's role will actually navigate to.
function preloadForRole(role) {
  if (auth.isAdminPanelRole(role)) {
    import('./admin/pages/AdminOverview.jsx');
    import('./admin/pages/AdminSubmissions.jsx');
    import('./admin/pages/AdminPIRReview.jsx');
    if (role === 'Admin') {
      import('./admin/pages/AdminUsers.jsx');
      import('./admin/pages/AdminSchools.jsx');
      import('./admin/pages/AdminPrograms.jsx');
      import('./admin/pages/AdminDeadlines.jsx');
      import('./admin/pages/AdminReports.jsx');
      import('./admin/pages/AdminSettings.jsx');
      import('./admin/pages/AdminBackups.jsx');
      import('./admin/pages/AdminSessions.jsx');
      import('./admin/pages/AdminLogs.jsx');
    }
  } else if (CES_ROLES.includes(role)) {
    import('./ces/CESLayout.jsx');
    import('./AIPForm');
    import('./PIRForm');
  } else if (role === 'Cluster Coordinator') {
    import('./cluster-head/ClusterHeadLayout.jsx');
    import('./AIPForm');
    import('./PIRForm');
  } else {
    import('./AIPForm');
    import('./PIRForm');
  }
}

const isTokenObsolete = () => {
  if (auth.isExpired()) {
    void auth.expireSession();
    return true;
  }
  return false;
};

function isProtectedPath(pathname) {
  return (
    pathname === '/' ||
    pathname === '/aip' ||
    pathname === '/pir' ||
    pathname === '/user-logs' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/ces') ||
    pathname.startsWith('/cluster-head')
  );
}

function hasValidStoredSession() {
  const user = auth.getUser();
  return Boolean(user?.role) && !auth.isExpired();
}

// Route guards
const ProtectedRoute = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (auth.isAdminPanelRole(user?.role)) return <Navigate to="/admin" replace />;
    if (CES_ROLES.includes(user?.role)) return <Navigate to="/ces" replace />;
    if (user?.role === 'Cluster Coordinator') return <Navigate to="/cluster-head" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const DivisionPersonnelRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (user?.role !== 'Division Personnel') return <Navigate to="/" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return children;
};

const AdminRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!auth.isAdminPanelRole(user?.role)) return <Navigate to="/403" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminOnlyGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (user?.role !== 'Admin') return <Navigate to="/403" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const CESRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const u = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!CES_ROLES.includes(u?.role) && u?.role !== 'Admin') return <Navigate to="/" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return children;
};

const ClusterHeadRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const u = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (u?.role !== 'Cluster Coordinator' && u?.role !== 'Admin') return <Navigate to="/" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return children;
};

const AuthenticatedRoute = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  return children;
};

const SUBMITTER_ROLES = ['School', 'Division Personnel', 'Cluster Coordinator', 'CES-SGOD', 'CES-ASDS', 'CES-CID'];

const SubmitterRoute = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!SUBMITTER_ROLES.includes(user?.role)) return <Navigate to="/403" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return children;
};

const PIRRouteGuard = ({ children }) => {
  const [hasAIP, setHasAIP] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const userStr = sessionStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    sessionStorage.removeItem('user');
  }
  const isDivisionPersonnel = ['Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(user?.role) ||
    (user?.role === 'Cluster Coordinator' && !user?.school_id);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        setHasAIP(false);
        return;
      }
      try {
        let dbExists = false;
        if (isDivisionPersonnel) {
          const res = await api.get(`/api/users/${user.id}/aip-status`);
          dbExists = res.data.hasAIP;
        } else if (user.school_id) {
          const res = await api.get(`/api/schools/${user.school_id}/aip-status`);
          dbExists = res.data.hasAIP;
        }
        setHasAIP(dbExists);
      } catch (error) {
        console.error('Failed to verify AIP status:', error);
        setHasAIP(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, [isDivisionPersonnel, user?.id, user?.school_id]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-dark-base z-50">
        <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!hasAIP) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-dark-base">
    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-pink-500 animate-spin" />
  </div>
);

function SessionBootstrap({ pathname, children }) {
  const needsSession = isProtectedPath(pathname);
  const [bootstrap, setBootstrap] = useState(() => ({
    pathname,
    ready: !needsSession || hasValidStoredSession(),
  }));

  const ready = bootstrap.pathname === pathname
    ? bootstrap.ready
    : (!needsSession || hasValidStoredSession());

  useEffect(() => {
    if (!needsSession || hasValidStoredSession()) {
      return undefined;
    }

    let cancelled = false;
    auth.restoreSession()
      .catch(() => {
        auth.clearBrowserSession({ clearDrafts: false });
      })
      .finally(() => {
        if (!cancelled) setBootstrap({ pathname, ready: true });
      });

    return () => {
      cancelled = true;
    };
  }, [needsSession, pathname]);

  if (needsSession && !ready) return <Spinner />;
  return children;
}

/**
 * All framer-motion-dependent route rendering lives here.
 * This module is lazy-loaded so framer-motion stays off the Login critical path.
 */
export default function AnimatedContent() {
  const location = useLocation();
  const { settings } = useAccessibility();
  const formOrb = location.pathname === '/pir' ? 'blue' : 'pink';
  const isAdminPath = location.pathname.startsWith('/admin');

  // Kick off background preloads for the user's role once, after mount
  useEffect(() => {
    if (isAdminPath) return;
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (user?.role) preloadForRole(user.role);
    } catch { /* session not ready yet */ }
  }, [isAdminPath]);

  // Admin routes rendered outside AnimatePresence so AdminLayout stays mounted
  if (isAdminPath) {
    return (
      <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'never'}>
        <SessionBootstrap pathname={location.pathname}>
          <Suspense fallback={<Spinner />}>
            <Routes location={location}>
              <Route path="/admin" element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
                <Route index element={<AdminOverview />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="users" element={<AdminOnlyGuard><AdminUsers /></AdminOnlyGuard>} />
                <Route path="schools" element={<AdminOnlyGuard><AdminSchools /></AdminOnlyGuard>} />
                <Route path="programs" element={<AdminOnlyGuard><AdminPrograms /></AdminOnlyGuard>} />
                <Route path="deadlines" element={<AdminOnlyGuard><AdminDeadlines /></AdminOnlyGuard>} />
                <Route path="reports" element={<AdminOnlyGuard><AdminReports /></AdminOnlyGuard>} />
                <Route path="consolidation-template" element={<AdminOnlyGuard><AdminConsolidationTemplate /></AdminOnlyGuard>} />
                <Route path="sessions" element={<AdminOnlyGuard><AdminSessions /></AdminOnlyGuard>} />
                <Route path="logs" element={<AdminOnlyGuard><AdminLogs /></AdminOnlyGuard>} />
                <Route path="settings" element={<AdminOnlyGuard><AdminSettings /></AdminOnlyGuard>} />
                <Route path="backups" element={<AdminOnlyGuard><AdminBackups /></AdminOnlyGuard>} />
                <Route path="pirs/:id" element={<AdminPIRReview />} />
              </Route>
            </Routes>
          </Suspense>
        </SessionBootstrap>
        <OnboardingController />
        <PracticeModeController />
        <HelpLauncher />
        <ForceChangePasswordModal />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'never'}>
      {['/aip', '/pir'].includes(location.pathname) && (
        <FormBackground orb={formOrb} />
      )}
      <SessionBootstrap pathname={location.pathname}>
        <Suspense fallback={<Spinner />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/auth/magic-link" element={<MagicLinkCallback />} />
            <Route path="/changelog" element={<PageTransition><Changelog /></PageTransition>} />
            <Route path="/user-logs" element={<AuthenticatedRoute><PageTransition><UserLogs /></PageTransition></AuthenticatedRoute>} />
            <Route path="/docs" element={<PageTransition><SystemDocs /></PageTransition>} />
            <Route path="/getting-started" element={<PageTransition><GettingStarted /></PageTransition>} />
            <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageTransition><Dashboard /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/aip"
              element={
                <SubmitterRoute>
                  <PageTransition><AIPForm /></PageTransition>
                </SubmitterRoute>
              }
            />
            <Route
              path="/pir"
              element={
                <SubmitterRoute>
                  <PIRRouteGuard>
                    <PageTransition><PIRForm /></PageTransition>
                  </PIRRouteGuard>
                </SubmitterRoute>
              }
            />

            {/* CES Routes */}
            <Route path="/ces/*" element={<CESRouteGuard><CESLayout /></CESRouteGuard>} />

            {/* Cluster Head Routes */}
            <Route path="/cluster-head/*" element={<ClusterHeadRouteGuard><ClusterHeadLayout /></ClusterHeadRouteGuard>} />

            {/* Error Pages */}
            <Route path="/403" element={<PageTransition><ErrorPage type="403" /></PageTransition>} />
            <Route path="/500" element={<PageTransition><ErrorPage type="500" /></PageTransition>} />

            {/* Catch-all 404 Route */}
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </SessionBootstrap>
      <OnboardingController />
      <PracticeModeController />
      <HelpLauncher />
      <ForceChangePasswordModal />
    </MotionConfig>
  );
}
