import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useAccessibility } from './context/AccessibilityContext';
import axios from 'axios';
import { NotePencil, Table, LockKey as Lock, Warning as AlertTriangle, CaretCircleRight } from '@phosphor-icons/react';
import Login from './Login';
import AIPForm from './AIPForm';
import PIRForm from './PIRForm';
import NotFound from './NotFound';
import ErrorPage from './ErrorPage';
import Changelog from './components/Changelog';
import SystemDocs from './components/SystemDocs';
import FAQ from './components/FAQ';
import { DashboardHeader } from './components/ui/DashboardHeader';
import { AnnouncementBanner } from './components/ui/AnnouncementBanner';
import Footer from './components/ui/Footer';
import PageTransition from './components/ui/PageTransition';
import PageLoader from './components/ui/PageLoader';
import FormBackground from './components/ui/FormBackground';
import AccessibilityPanel from './components/ui/AccessibilityPanel';
import DashboardStats, { getActionPrompt } from './components/ui/DashboardStats';

// CES pages
import CESLayout from './ces/CESLayout.jsx';

// Cluster Head pages
import ClusterHeadLayout from './cluster-head/ClusterHeadLayout.jsx';

// Admin pages
import AdminOverview from './admin/pages/AdminOverview.jsx';
import AdminSubmissions from './admin/pages/AdminSubmissions.jsx';
import AdminUsers from './admin/pages/AdminUsers.jsx';
import AdminSchools from './admin/pages/AdminSchools.jsx';
import AdminPrograms from './admin/pages/AdminPrograms.jsx';
import AdminDeadlines from './admin/pages/AdminDeadlines.jsx';
import AdminReports from './admin/pages/AdminReports.jsx';
import AdminSettings from './admin/pages/AdminSettings.jsx';

const CES_ROLES = ['CES-SGOD', 'CES-ASDS', 'CES-CID'];

// Simple Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role === 'Admin') return <Navigate to="/admin" replace />;
    if (CES_ROLES.includes(user?.role)) return <Navigate to="/ces" replace />;
    if (user?.role === 'Cluster Coordinator') return <Navigate to="/cluster-head" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Division Personnel-only route guard
const DivisionPersonnelRouteGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role !== 'Division Personnel') return <Navigate to="/" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return children;
};

// Admin-only route guard
const AdminRouteGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role !== 'Admin') return <Navigate to="/403" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// CES route guard — allows CES-SGOD, CES-ASDS, CES-CID (and Admin for testing)
const CESRouteGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (!CES_ROLES.includes(u?.role) && u?.role !== 'Admin') return <Navigate to="/" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return children;
};

// Cluster Head route guard
const ClusterHeadRouteGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u?.role !== 'Cluster Coordinator' && u?.role !== 'Admin') return <Navigate to="/" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return children;
};

// PIR Route Guard - Checks if AIP is completed before allowing access
const PIRRouteGuard = ({ children }) => {
  const [hasAIP, setHasAIP] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    localStorage.removeItem('user');
  }
  const isDivisionPersonnel = user?.role === 'Division Personnel' || user?.role === 'Cluster Coordinator';
  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

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
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/aip-status`, { headers: authHeaders });
          dbExists = res.data.hasAIP;
        } else if (user.school_id) {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/schools/${user.school_id}/aip-status`, { headers: authHeaders });
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
    // Redirect to dashboard if AIP is not completed
    return <Navigate to="/" replace />;
  }

  return children;
};

function Dashboard() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    localStorage.removeItem('user');
  }
  const token = localStorage.getItem('token');

  const [aipStatus, setAipStatus] = useState('none');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id) return;
      setDashboardLoading(true);
      try {
        // Fetch aggregated dashboard stats
        const dashRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(dashRes.data);

        // Derive AIP card status from dashboard data + draft check
        const hasSubmittedAIP = dashRes.data.aipCompletion.completed > 0;
        if (hasSubmittedAIP) {
          setAipStatus('review');
        } else {
          try {
            const draftRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/aips/draft`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setAipStatus(draftRes.data.hasDraft ? 'draft' : 'none');
          } catch {
            setAipStatus('none');
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  const hasAIP = dashboardData ? dashboardData.aipCompletion.completed > 0 : false;

  const actionPrompt = dashboardData ? getActionPrompt(dashboardData, aipStatus) : '';

  const handleLogout = () => {
    navigate('/login', { replace: true });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans relative select-none">
      {/* Subtle Background Asset Overlay */}
      <div
        className="absolute inset-x-0 top-0 h-[60vh] z-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          maskImage: 'linear-gradient(to bottom, black, transparent)'
        }}
      ></div>

      <DashboardHeader user={user} onLogout={handleLogout} />
      <AnnouncementBanner />

      <main className="flex-1 w-full max-w-6xl mx-auto mt-6 px-4 pb-12 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] p-8 md:p-10 shadow-sm overflow-hidden group">
{/* Card Background Facade */}
            <div
              className="absolute inset-0 opacity-70 grayscale pointer-events-none transition-all duration-700 group-hover:opacity-85 group-hover:grayscale-0"
              style={{
                backgroundImage: `url('/SDO_Facade.webp')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 70%',
                maskImage: 'radial-gradient(circle at top right, black, transparent 80%)'
              }}
            ></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center mb-6">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Summary</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                Welcome back, <br />
                <span className="text-pink-600">
                  {user?.role === 'School'
                    ? (user?.school_name || 'User')
                    : user?.role === 'Division Personnel'
                      ? (user?.first_name || 'User')
                      : (user?.name || 'User')}
                </span>
              </h1>

              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md text-sm md:text-base leading-relaxed mb-8">
                You are currently managing the planning and review cycle for <span className="text-slate-900 dark:text-slate-100 font-bold">FY {new Date().getFullYear()}</span>.
              </p>

              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-auto">
                {dashboardLoading
                  ? <span className="inline-block w-64 h-4 bg-slate-200 dark:bg-dark-border/60 rounded animate-pulse" />
                  : actionPrompt
                }
              </p>
            </div>
          </div>

        </div>

        {/* Stats + Quarter Timeline */}
        <DashboardStats data={dashboardData} loading={dashboardLoading} />

        {/* Modules Section */}
        <div className="flex items-center justify-between mb-8 px-2 mt-4">
          <h2 className="text-sm font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-4">
            Workspace Hub
            <span className="flex-1 h-px bg-slate-200 dark:bg-dark-border/60"></span>
          </h2>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* AIP Card */}
          <Link to="/aip" className="group block bg-white dark:bg-dark-surface rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] overflow-hidden border-slate-100 dark:border-dark-border hover:border-pink-200 dark:hover:border-pink-400 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 dark:bg-pink-950 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-20 -mt-20"></div>

            <div className="p-8 md:p-10 relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-12">
                <div className="relative overflow-hidden w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ease-out shadow-md border bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/30 text-pink-600 border-pink-200 dark:border-pink-800/60 shadow-pink-100/50 group-hover:border-pink-500 group-hover:shadow-pink-400/40">
                  <span className="absolute inset-0 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out bg-pink-500/75 backdrop-blur-sm rounded-2xl" />
                  <NotePencil size={36} className="relative z-10 group-hover:text-white transition-colors duration-300" />
                </div>
                {dashboardData && dashboardData.aipCompletion.total > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-pink-500 text-white shadow-sm">
                    {dashboardData.aipCompletion.completed}/{dashboardData.aipCompletion.total} Programs
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-3 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:text-pink-600">AIP Form</h3>
                <p className="font-medium text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg mb-6 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  Annual Implementation Plan <br />
                  <span className="text-slate-400 dark:text-slate-500 text-sm md:text-base font-normal">
                    {dashboardData && dashboardData.aipCompletion.completed < dashboardData.aipCompletion.total
                      ? `${dashboardData.aipCompletion.total - dashboardData.aipCompletion.completed} program${dashboardData.aipCompletion.total - dashboardData.aipCompletion.completed !== 1 ? 's' : ''} still need planning for FY ${new Date().getFullYear()}.`
                      : 'Plan strategic objectives, target outputs, and allocate budget for the fiscal year.'
                    }
                  </span>
                </p>

                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm uppercase tracking-widest">
                    {aipStatus === 'review' ? 'View Submission' : aipStatus === 'draft' ? 'Continue Plan' : 'Start Planning'}
                  </span>
                  <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-300 ease-out flex items-center">
                    <div className="w-5 h-px bg-pink-400/60 dark:bg-pink-500/50 rounded-full" />
                  </div>
                  <CaretCircleRight size={24} />
                </div>
              </div>
            </div>
          </Link>

          {/* PIR Card */}
          {hasAIP ? (
            <div className="group block bg-white dark:bg-dark-surface rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] overflow-hidden border-slate-100 dark:border-dark-border hover:border-blue-200 dark:hover:border-blue-400 relative">
              <Link to="/pir" className="absolute inset-0 z-10"></Link>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-950 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-20 -mt-20"></div>

              <div className="p-8 md:p-10 relative z-0 flex flex-col h-full">
                <div className="flex justify-between items-start mb-12">
                  <div className="relative overflow-hidden w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ease-out shadow-md border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 text-blue-600 border-blue-200 dark:border-blue-800/60 shadow-blue-100/50 group-hover:border-blue-500 group-hover:shadow-blue-400/40">
                    <span className="absolute inset-0 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out bg-blue-500/75 backdrop-blur-sm rounded-2xl" />
                    <Table size={36} className="relative z-10 group-hover:text-white transition-colors duration-300" />
                  </div>
                  {dashboardData && (
                    <div className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm mt-8 sm:mt-0 group-hover:border-blue-500 dark:group-hover:border-blue-500 transition-colors duration-300 ${
                      dashboardData.pirSubmitted.total === 0
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 border-blue-200 dark:border-blue-700/60'
                        : dashboardData.pirSubmitted.submitted >= dashboardData.pirSubmitted.total
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/60'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700/60'
                    }`}>
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out bg-blue-500/75 backdrop-blur-sm rounded-full" />
                      <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                        {dashboardData.pirSubmitted.total === 0
                          ? `No Q${dashboardData.currentQuarter} Activities`
                          : `Q${dashboardData.currentQuarter}: ${dashboardData.pirSubmitted.submitted}/${dashboardData.pirSubmitted.total} Filed`
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-3 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:text-blue-600">PIR Form</h3>
                  <p className="font-medium text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg mb-6 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    Program Implementation Review <br />
                    <span className="text-slate-400 dark:text-slate-500 text-sm md:text-base font-normal">
                      {dashboardData && dashboardData.pirSubmitted.total > 0 && dashboardData.pirSubmitted.submitted < dashboardData.pirSubmitted.total
                        ? `${dashboardData.pirSubmitted.total - dashboardData.pirSubmitted.submitted} quarterly review${dashboardData.pirSubmitted.total - dashboardData.pirSubmitted.submitted !== 1 ? 's' : ''} pending for Q${dashboardData.currentQuarter}.`
                        : dashboardData && dashboardData.pirSubmitted.total === 0
                          ? `No activities scheduled this quarter. Check back next quarter.`
                          : 'Report physical accomplishments and financial utilization per quarter.'
                      }
                    </span>
                  </p>

                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform duration-300">
                    <span className="text-sm uppercase tracking-widest">
                      {dashboardData && dashboardData.pirSubmitted.submitted > 0 ? 'View Reviews' : 'Start Review'}
                    </span>
                    <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-300 ease-out flex items-center">
                      <div className="w-5 h-px bg-blue-400/60 dark:bg-blue-500/50 rounded-full" />
                    </div>
                    <CaretCircleRight size={24} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="block bg-slate-50/50 dark:bg-dark-surface/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-dark-border relative overflow-hidden group">
              <div className="p-8 md:p-10 flex flex-col h-full opacity-60 grayscale transition-opacity group-hover:opacity-80">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 bg-white dark:bg-dark-border text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-dark-border shadow-sm">
                    <Table size={36} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border shadow-sm mt-8 sm:mt-0">
                    <Lock size={14} />
                    Locked
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-3">PIR Form</h3>
                  <p className="font-medium text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg mb-6">
                    Program Implementation Review <br />
                    <span className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal">Complete and submit your AIP first to unlock quarterly performance reviews.</span>
                  </p>

                  <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                    <AlertTriangle size={18} />
                    AIP Submission Required
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


      </main>

      <Footer />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const formOrb = location.pathname === '/pir' ? 'blue' : 'pink';

  return (
    <>
      {['/aip', '/pir'].includes(location.pathname) && (
        <FormBackground orb={formOrb} />
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/changelog" element={<PageTransition><Changelog /></PageTransition>} />
          <Route path="/docs" element={<PageTransition><SystemDocs /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />

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

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRouteGuard><AdminOverview /></AdminRouteGuard>} />
          <Route path="/admin/submissions" element={<AdminRouteGuard><AdminSubmissions /></AdminRouteGuard>} />
          <Route path="/admin/users" element={<AdminRouteGuard><AdminUsers /></AdminRouteGuard>} />
          <Route path="/admin/schools" element={<AdminRouteGuard><AdminSchools /></AdminRouteGuard>} />
          <Route path="/admin/programs" element={<AdminRouteGuard><AdminPrograms /></AdminRouteGuard>} />
          <Route path="/admin/deadlines" element={<AdminRouteGuard><AdminDeadlines /></AdminRouteGuard>} />
          <Route path="/admin/reports" element={<AdminRouteGuard><AdminReports /></AdminRouteGuard>} />
          <Route path="/admin/settings" element={<AdminRouteGuard><AdminSettings /></AdminRouteGuard>} />

          {/* Error Pages */}
          <Route path="/403" element={<PageTransition><ErrorPage type="403" /></PageTransition>} />
          <Route path="/500" element={<PageTransition><ErrorPage type="500" /></PageTransition>} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  const { settings } = useAccessibility();

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'never'}>
      <Router>
        <AnimatedRoutes />
        <AccessibilityPanel />
      </Router>
    </MotionConfig>
  );
}

export default App;
