import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useAccessibility } from './context/AccessibilityContext';
import axios from 'axios';
import PageTransition from './components/ui/PageTransition';
import FormBackground from './components/ui/FormBackground';
import AccessibilityPanel from './components/ui/AccessibilityPanel';
import { auth } from './lib/auth';
import Login from './Login';

// Route-level lazy imports — each becomes its own chunk
const Dashboard      = lazy(() => import('./Dashboard'));
const AIPForm        = lazy(() => import('./AIPForm'));
const PIRForm        = lazy(() => import('./PIRForm'));
const NotFound       = lazy(() => import('./NotFound'));
const ErrorPage      = lazy(() => import('./ErrorPage'));
const Changelog      = lazy(() => import('./components/Changelog'));
const SystemDocs     = lazy(() => import('./components/SystemDocs'));
const FAQ            = lazy(() => import('./components/FAQ'));
const PrivacyPolicy  = lazy(() => import('./components/PrivacyPolicy'));
const OAuthCallback  = lazy(() => import('./OAuthCallback'));

// CES pages
const CESLayout      = lazy(() => import('./ces/CESLayout.jsx'));

// Cluster Head pages
const ClusterHeadLayout = lazy(() => import('./cluster-head/ClusterHeadLayout.jsx'));

// Admin layout + pages
const AdminLayout     = lazy(() => import('./admin/AdminLayout.jsx'));
const AdminOverview   = lazy(() => import('./admin/pages/AdminOverview.jsx'));
const AdminSubmissions = lazy(() => import('./admin/pages/AdminSubmissions.jsx'));
const AdminUsers      = lazy(() => import('./admin/pages/AdminUsers.jsx'));
const AdminSchools    = lazy(() => import('./admin/pages/AdminSchools.jsx'));
const AdminPrograms   = lazy(() => import('./admin/pages/AdminPrograms.jsx'));
const AdminDeadlines  = lazy(() => import('./admin/pages/AdminDeadlines.jsx'));
const AdminReports    = lazy(() => import('./admin/pages/AdminReports.jsx'));
const AdminSettings   = lazy(() => import('./admin/pages/AdminSettings.jsx'));

const CES_ROLES = ['CES-SGOD', 'CES-ASDS', 'CES-CID'];

// Preload only the chunks the logged-in user's role will actually navigate to.
function preloadForRole(role) {
  if (role === 'Admin') {
    import('./admin/pages/AdminOverview.jsx');
    import('./admin/pages/AdminSubmissions.jsx');
    import('./admin/pages/AdminUsers.jsx');
    import('./admin/pages/AdminSchools.jsx');
    import('./admin/pages/AdminPrograms.jsx');
    import('./admin/pages/AdminDeadlines.jsx');
    import('./admin/pages/AdminReports.jsx');
    import('./admin/pages/AdminSettings.jsx');
  } else if (CES_ROLES.includes(role)) {
    import('./ces/CESLayout.jsx');
  } else if (role === 'Cluster Coordinator') {
    import('./cluster-head/ClusterHeadLayout.jsx');
  } else {
    import('./AIPForm');
    import('./PIRForm');
  }
}

const isTokenObsolete = () => {
  if (auth.isExpired()) {
    auth.clearSession();
    return true;
  }
  return false;
};

// Route guards
const ProtectedRoute = ({ children }) => {
  if (isTokenObsolete()) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (user?.role === 'Admin') return <Navigate to="/admin" replace />;
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
  const isDivisionPersonnel = user?.role === 'Division Personnel' || user?.role === 'Cluster Coordinator';

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
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/aip-status`, { withCredentials: true });
          dbExists = res.data.hasAIP;
        } else if (user.school_id) {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/schools/${user.school_id}/aip-status`, { withCredentials: true });
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
  }, [user?.id]);

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
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (user?.role) preloadForRole(user.role);
    } catch { /* session not ready yet */ }
  }, []);

  // Admin routes rendered outside AnimatePresence so AdminLayout stays mounted
  if (isAdminPath) {
    return (
      <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'never'}>
        <Suspense fallback={<Spinner />}>
          <Routes location={location}>
            <Route path="/admin" element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
              <Route index element={<AdminOverview />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="schools" element={<AdminSchools />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="deadlines" element={<AdminDeadlines />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Suspense>
        <AccessibilityPanel />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'never'}>
      {['/aip', '/pir'].includes(location.pathname) && (
        <FormBackground orb={formOrb} />
      )}
      <Suspense fallback={<Spinner />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/changelog" element={<PageTransition><Changelog /></PageTransition>} />
            <Route path="/docs" element={<PageTransition><SystemDocs /></PageTransition>} />
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
                <ProtectedRoute>
                  <PageTransition><AIPForm /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pir"
              element={
                <ProtectedRoute>
                  <PIRRouteGuard>
                    <PageTransition><PIRForm /></PageTransition>
                  </PIRRouteGuard>
                </ProtectedRoute>
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
      <AccessibilityPanel />
    </MotionConfig>
  );
}
