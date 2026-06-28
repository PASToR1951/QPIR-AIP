import { useState, useEffect, Suspense } from 'react';
import lazyWithRetry from './lib/lazyWithRetry.js';
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
import { ReportingPeriodProvider } from './context/ReportingPeriodContext.jsx';
import { Outlet } from 'react-router-dom';

// Route-level lazy imports — each becomes its own chunk
const Dashboard = lazyWithRetry(() => import('./Dashboard'));
const AIPForm = lazyWithRetry(() => import('./AIPForm'));
const PIRForm = lazyWithRetry(() => import('./PIRForm'));
const NotFound = lazyWithRetry(() => import('./NotFound'));
const ErrorPage = lazyWithRetry(() => import('./ErrorPage'));
const Changelog = lazyWithRetry(() => import('./components/Changelog'));
const SystemDocs = lazyWithRetry(() => import('./components/SystemDocs'));
const GettingStarted = lazyWithRetry(() => import('./components/GettingStarted.jsx'));
const FAQ = lazyWithRetry(() => import('./components/FAQ'));
const AnnouncementDetail = lazyWithRetry(() => import('./components/AnnouncementDetail.jsx'));
const PrivacyPolicy = lazyWithRetry(() => import('./components/PrivacyPolicy'));
const OAuthCallback = lazyWithRetry(() => import('./OAuthCallback'));
const MagicLinkCallback = lazyWithRetry(() => import('./MagicLinkCallback.jsx'));
const OnboardingWizard = lazyWithRetry(() => import('./OnboardingWizard.jsx'));

// CES pages
const CESLayout = lazyWithRetry(() => import('./ces/CESLayout.jsx'));
const DivisionLayout = lazyWithRetry(() => import('./division/DivisionLayout.jsx'));
const ClusterConsultantLayout = lazyWithRetry(() => import('./cluster-consultant/ClusterConsultantLayout.jsx'));

// Admin layout + pages
const AdminLayout = lazyWithRetry(() => import('./admin/AdminLayout.jsx'));
const AdminOverview = lazyWithRetry(() => import('./admin/pages/AdminOverview.jsx'));
const AdminSubmissions = lazyWithRetry(() => import('./admin/pages/AdminSubmissions.jsx'));
const AdminUsers = lazyWithRetry(() => import('./admin/pages/AdminUsers.jsx'));
const AdminSchools = lazyWithRetry(() => import('./admin/pages/AdminSchools.jsx'));
const AdminPrograms = lazyWithRetry(() => import('./admin/pages/AdminPrograms.jsx'));
const AdminDeadlines = lazyWithRetry(() => import('./admin/pages/AdminDeadlines.jsx'));
const AdminReports = lazyWithRetry(() => import('./admin/pages/AdminReports.jsx'));
const AdminSettings = lazyWithRetry(() => import('./admin/pages/AdminSettings.jsx'));
const AdminBackups = lazyWithRetry(() => import('./admin/pages/AdminBackups.jsx'));
const AdminSessions = lazyWithRetry(() => import('./admin/pages/AdminSessions.jsx'));
const AdminLogs = lazyWithRetry(() => import('./admin/pages/AdminLogs.jsx'));
const AdminPIRReview = lazyWithRetry(() => import('./admin/pages/AdminPIRReview.jsx'));
const AdminConsolidationTemplate = lazyWithRetry(() => import('./admin/pages/AdminConsolidationTemplate.jsx'));
const AdminFAQ = lazyWithRetry(() => import('./admin/pages/AdminFAQ.jsx'));
const UserLogs = lazyWithRetry(() => import('./UserLogs.jsx'));

const CES_ROLES = ['CES-SGOD', 'CES-ASDS', 'CES-CID', 'Superintendent'];

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
  } else if (role === 'Division Personnel') {
    import('./division/DivisionLayout.jsx');
    import('./AIPForm');
    import('./PIRForm');
    import('./admin/pages/AdminConsolidationTemplate.jsx');
  } else if (role === 'Cluster Consultant') {
    import('./cluster-consultant/ClusterConsultantLayout.jsx');
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
    pathname.startsWith('/announcements') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/ces') ||
    pathname.startsWith('/division') ||
    pathname.startsWith('/cluster-consultant') ||
    pathname === '/onboarding'
  );
}

function hasValidStoredSession() {
  const user = auth.getUser();
  return Boolean(user?.role) && !auth.isExpired();
}

function getCurrentUser() {
  const user = auth.getUser();
  return user?.role ? user : null;
}

// Route guards
const ProtectedRoute = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.needs_onboarding || user.role === 'Pending') return <Navigate to="/onboarding" replace />;
  if (auth.isAdminPanelRole(user.role)) return <Navigate to="/admin" replace />;
  if (CES_ROLES.includes(user.role)) return <Navigate to="/ces" replace />;
  if (user.role === 'Cluster Consultant') return <Navigate to="/cluster-consultant" replace />;
  return children;
};

const DivisionPersonnelRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.needs_onboarding || user.role === 'Pending') return <Navigate to="/onboarding" replace />;
  if (user.role !== 'Division Personnel') return <Navigate to="/" replace />;
  return children;
};

const AdminRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!auth.isAdminPanelRole(user.role)) return <Navigate to="/403" replace />;
  return children;
};

const AdminAnalyticsGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!['Admin', 'Superintendent'].includes(user.role)) return <Navigate to="/403" replace />;
  return children;
};

const AdminOnlyGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/403" replace />;
  return children;
};

const CESRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.needs_onboarding || user.role === 'Pending') return <Navigate to="/onboarding" replace />;
  if (!CES_ROLES.includes(user.role) && user.role !== 'Admin') return <Navigate to="/" replace />;
  return children;
};

const ClusterConsultantRouteGuard = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.needs_onboarding || user.role === 'Pending') return <Navigate to="/onboarding" replace />;
  if (user.role !== 'Cluster Consultant') return <Navigate to="/" replace />;
  return children;
};

const AuthenticatedRoute = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.needs_onboarding || user.role === 'Pending') return <Navigate to="/onboarding" replace />;
  return children;
};

const SUBMITTER_ROLES = ['School', 'Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID'];

const SubmitterRoute = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.needs_onboarding || user.role === 'Pending') return <Navigate to="/onboarding" replace />;
  if (!SUBMITTER_ROLES.includes(user.role)) return <Navigate to="/403" replace />;
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
  const isDivisionPersonnel = ['Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(user?.role);

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
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-dark-base z-50">
    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-pink-500 animate-spin" />
  </div>
);

const ReportingPeriodLayout = () => (
  <ReportingPeriodProvider>
    <Outlet />
  </ReportingPeriodProvider>
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
          <ReportingPeriodProvider>
            <Suspense fallback={<Spinner />}>
              <Routes location={location}>
                <Route path="/admin" element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
                  <Route index element={<AdminAnalyticsGuard><AdminOverview /></AdminAnalyticsGuard>} />
                  <Route path="submissions" element={<AdminAnalyticsGuard><AdminSubmissions /></AdminAnalyticsGuard>} />
                  <Route path="users" element={<AdminOnlyGuard><AdminUsers /></AdminOnlyGuard>} />
                  <Route path="schools" element={<AdminOnlyGuard><AdminSchools /></AdminOnlyGuard>} />
                  <Route path="programs" element={<AdminOnlyGuard><AdminPrograms /></AdminOnlyGuard>} />
                  <Route path="deadlines" element={<AdminOnlyGuard><AdminDeadlines /></AdminOnlyGuard>} />
                  <Route path="reports" element={<AdminAnalyticsGuard><AdminReports /></AdminAnalyticsGuard>} />
                  <Route path="consolidation-template" element={<AdminAnalyticsGuard><AdminConsolidationTemplate /></AdminAnalyticsGuard>} />
                  <Route path="sessions" element={<AdminOnlyGuard><AdminSessions /></AdminOnlyGuard>} />
                  <Route path="logs" element={<AdminOnlyGuard><AdminLogs /></AdminOnlyGuard>} />
                  <Route path="settings" element={<AdminOnlyGuard><AdminSettings /></AdminOnlyGuard>} />
                  <Route path="backups" element={<AdminOnlyGuard><AdminBackups /></AdminOnlyGuard>} />
                  <Route path="faq" element={<AdminOnlyGuard><AdminFAQ /></AdminOnlyGuard>} />
                  <Route path="pirs/:id" element={<AdminAnalyticsGuard><AdminPIRReview /></AdminAnalyticsGuard>} />
                </Route>
              </Routes>
            </Suspense>
          </ReportingPeriodProvider>
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
            <Route path="/onboarding" element={<PageTransition><OnboardingWizard /></PageTransition>} />
            <Route path="/changelog" element={<PageTransition><Changelog /></PageTransition>} />
            <Route path="/user-logs" element={<AuthenticatedRoute><PageTransition><UserLogs /></PageTransition></AuthenticatedRoute>} />
            <Route path="/announcements/:id" element={<AuthenticatedRoute><PageTransition><AnnouncementDetail /></PageTransition></AuthenticatedRoute>} />
            <Route path="/docs" element={<PageTransition><SystemDocs /></PageTransition>} />
            <Route path="/getting-started" element={<PageTransition><GettingStarted /></PageTransition>} />
            <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />

            {/* Protected Routes inside ReportingPeriodLayout */}
            <Route element={<ReportingPeriodLayout />}>
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

              {/* Division Focal Review Routes */}
              <Route path="/division/*" element={<DivisionPersonnelRouteGuard><DivisionLayout /></DivisionPersonnelRouteGuard>} />

              {/* Cluster Consultant Routes */}
              <Route path="/cluster-consultant/*" element={<ClusterConsultantRouteGuard><ClusterConsultantLayout /></ClusterConsultantRouteGuard>} />
              
              <Route path="/user-logs" element={<AuthenticatedRoute><PageTransition><UserLogs /></PageTransition></AuthenticatedRoute>} />
              <Route path="/announcements/:id" element={<AuthenticatedRoute><PageTransition><AnnouncementDetail /></PageTransition></AuthenticatedRoute>} />
            </Route>

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
