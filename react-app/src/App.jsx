import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useAccessibility } from './context/AccessibilityContext';
import axios from 'axios';
import {
  LogOut,
  LayoutDashboard,
  FileText,
  BarChart3,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Headset,
  Layers,
  Sparkles,
  ChevronRight,
  Tag
} from 'lucide-react';
import Login from './Login';
import AIPForm from './AIPForm';
import PIRForm from './PIRForm';
import NotFound from './NotFound';
import ErrorPage from './ErrorPage';
import Changelog from './components/Changelog';
import SystemDocs from './components/SystemDocs';
import FAQ from './components/FAQ';
import { DashboardHeader } from './components/ui/DashboardHeader';
import Footer from './components/ui/Footer';
import PageTransition from './components/ui/PageTransition';
import PageLoader from './components/ui/PageLoader';
import FormBackground from './components/ui/FormBackground';
import AccessibilityPanel from './components/ui/AccessibilityPanel';

// Simple Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// PIR Route Guard - Checks if AIP is completed before allowing access
const PIRRouteGuard = ({ children }) => {
  const [hasAIP, setHasAIP] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isDivisionPersonnel = user?.role === 'Division Personnel';
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
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50">
        <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
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
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
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
            const draftRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/drafts/AIP/${user.id}`);
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

  // Build stats from live data
  const calculateDaysLeft = (isoDate) => {
    const deadline = new Date(isoDate);
    const now = new Date();
    return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const formatDeadlineShort = (isoDate) => {
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const stats = dashboardData
    ? [
      {
        label: 'Active Programs',
        value: String(dashboardData.activePrograms),
        icon: <Layers className="w-7 h-7 text-pink-500" />,
        color: 'pink'
      },
      {
        label: 'AIP Completion',
        value: `${dashboardData.aipCompletion.percentage}%`,
        icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
        symbol: '◈',
        subtext: `${dashboardData.aipCompletion.completed} of ${dashboardData.aipCompletion.total} Programs Complete`,
        color: 'emerald'
      },
      {
        label: 'PIR Submitted',
        value: `${dashboardData.pirSubmitted.submitted}/${dashboardData.pirSubmitted.total}`,
        icon: <BarChart3 className="w-7 h-7 text-amber-500" />,
        symbol: `Q${dashboardData.currentQuarter}`,
        subtext: `${dashboardData.pirSubmitted.submitted}/${dashboardData.pirSubmitted.total} PIRs This Quarter`,
        color: 'amber'
      },
      {
        label: 'Days to Deadline',
        value: `${calculateDaysLeft(dashboardData.deadline)} Days`,
        icon: <Clock className="w-7 h-7 text-rose-500" />,
        symbol: '◷',
        subtext: `Q${dashboardData.currentQuarter} Deadline · ${formatDeadlineShort(dashboardData.deadline)}`,
        color: 'rose'
      },
    ]
    : [];

  const currentQuarterLabel = dashboardData ? `Q${dashboardData.currentQuarter} In Progress` : '—';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative select-none">
      {/* Subtle Background Asset Overlay */}
      <div
        className="absolute inset-x-0 top-0 h-[60vh] z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          maskImage: 'linear-gradient(to bottom, black, transparent)'
        }}
      ></div>

      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-6xl mx-auto mt-6 px-4 pb-12 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm overflow-hidden group">
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
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Summary</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2">
                Welcome back, <br />
                <span className="text-pink-600">{user?.school_name || user?.name || 'User'}</span>
              </h1>

              <p className="text-slate-500 font-medium max-w-md text-sm md:text-base leading-relaxed mb-8">
                You are currently managing the planning and review cycle for <span className="text-slate-900 font-bold">FY 2026</span>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-auto">
                <div className={`border p-4 rounded-2xl flex items-center gap-4 group/item transition-all ${aipStatus === 'review' ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200 hover:shadow-sm' :
                  aipStatus === 'draft' ? 'bg-blue-50/50 border-blue-100 hover:border-blue-200 hover:shadow-sm' :
                    'bg-slate-50 border-slate-100 hover:border-pink-200 hover:shadow-sm'
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${aipStatus === 'review' ? 'bg-emerald-100 text-emerald-600 group-hover/item:bg-emerald-200' :
                    aipStatus === 'draft' ? 'bg-blue-100 text-blue-600 group-hover/item:bg-blue-200' :
                      'bg-slate-200 text-slate-400 group-hover/item:bg-pink-100 group-hover/item:text-pink-600'
                    }`}>
                    <FileText size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover/item:text-slate-500 transition-colors">Annual Implementation Plan</div>
                    <div className={`text-sm font-black transition-colors ${aipStatus === 'review' ? 'text-emerald-700 group-hover/item:text-emerald-800' :
                      aipStatus === 'draft' ? 'text-blue-700 group-hover/item:text-blue-800' :
                        'text-slate-500 group-hover/item:text-pink-700'
                      }`}>
                      {aipStatus === 'review' ? 'Awaiting Review' :
                        aipStatus === 'draft' ? 'Draft in Progress' : 'No Submission Found'}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 group/item hover:border-blue-200 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <BarChart3 size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Current Review</div>
                    <div className="text-sm font-black text-slate-800">
                      {dashboardLoading ? <span className="inline-block w-20 h-3 bg-slate-200 rounded animate-pulse" /> : currentQuarterLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {dashboardLoading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-pulse">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  <div className="w-16 h-6 bg-slate-200 rounded" />
                  <div className="w-24 h-3 bg-slate-100 rounded" />
                </div>
              </div>
            ))
            : stats.map((stat) => (
              <div key={stat.label} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="text-3xl mb-3 group-hover:scale-125 transition-transform duration-500">{stat.icon}</div>
                  <div className="text-3xl font-black text-slate-800 leading-none mb-1.5">{stat.value}</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">{stat.label}</div>
                  {stat.symbol && (
                    <div className={`inline-flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-1.5 overflow-hidden transition-all duration-300 ease-out rounded-full border px-2 py-1 max-w-[32px] group-hover:max-w-[280px] ${stat.color === 'emerald' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      stat.color === 'amber' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                        stat.color === 'rose' ? 'text-rose-600 bg-rose-50 border-rose-200' :
                          'text-pink-700 bg-pink-50 border-pink-200'
                      }`}>
                      <span className="shrink-0 text-xs font-black leading-none">{stat.symbol}</span>
                      <span className="whitespace-nowrap text-xs font-black uppercase tracking-tight max-w-0 group-hover:max-w-[260px] overflow-hidden transition-[max-width] duration-300 ease-out delay-100">
                        {stat.subtext}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>

        {/* Modules Section */}
        <div className="flex items-center justify-between mb-8 px-2 mt-4">
          <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-4">
            Workspace Hub
            <span className="flex-1 h-px bg-slate-200"></span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* AIP Card */}
          <Link to="/aip" className="group block bg-white rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] overflow-hidden border-slate-100 hover:border-pink-200 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-20 -mt-20"></div>

            <div className="p-8 md:p-10 relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-12">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-md border bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 border-pink-200 shadow-pink-100/50 group-hover:from-pink-500 group-hover:to-pink-600 group-hover:text-white group-hover:shadow-pink-300">
                  <FileText size={32} strokeWidth={2.5} />
                </div>
                {aipStatus === 'review' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                    <CheckCircle2 size={12} strokeWidth={3} /> Submitted
                  </div>
                )}
                {aipStatus === 'draft' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 text-[10px] font-black uppercase tracking-widest border border-pink-200 shadow-sm">
                    <Clock size={12} strokeWidth={3} /> In Progress
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3 transition-colors group-hover:text-pink-600">AIP Form</h3>
                <p className="font-medium text-slate-500 leading-relaxed text-base md:text-lg mb-6">
                  Annual Implementation Plan <br />
                  <span className="text-slate-400 text-sm md:text-base font-normal">Plan strategic objectives, target outputs, and allocate budget for the fiscal year.</span>
                </p>

                <div className="flex items-center gap-3 text-pink-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm uppercase tracking-widest">
                    {aipStatus === 'review' ? 'View Submission' : aipStatus === 'draft' ? 'Continue Plan' : 'Start Planning'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <ArrowRight size={16} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* PIR Card */}
          {hasAIP ? (
            <div className="group block bg-white rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] overflow-hidden border-slate-100 hover:border-blue-200 relative">
              <Link to="/pir" className="absolute inset-0 z-10"></Link>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-20 -mt-20"></div>

              <div className="p-8 md:p-10 relative z-0 flex flex-col h-full">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-md border bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200 shadow-blue-100/50 group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white group-hover:shadow-blue-300">
                    <BarChart3 size={32} strokeWidth={2.5} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-200 shadow-sm mt-8 sm:mt-0">
                    <Unlock size={12} strokeWidth={3} />
                    Unlocked
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3 transition-colors group-hover:text-blue-600">PIR Form</h3>
                  <p className="font-medium text-slate-500 leading-relaxed text-base md:text-lg mb-6">
                    Program Implementation Review <br />
                    <span className="text-slate-400 text-sm md:text-base font-normal">Report physical accomplishments and financial utilization per quarter.</span>
                  </p>

                  <div className="flex items-center gap-3 text-blue-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                    <span className="text-sm uppercase tracking-widest">Start Review</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <ArrowRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="block bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 relative overflow-hidden group">
              <div className="p-8 md:p-10 flex flex-col h-full opacity-60 grayscale transition-opacity group-hover:opacity-80">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 bg-white text-slate-400 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                    <BarChart3 size={32} strokeWidth={2.5} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm mt-8 sm:mt-0">
                    <Lock size={12} strokeWidth={3} />
                    Locked
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">PIR Form</h3>
                  <p className="font-medium text-slate-500 leading-relaxed text-base md:text-lg mb-6">
                    Program Implementation Review <br />
                    <span className="text-slate-500 text-sm md:text-base font-normal">Complete and submit your AIP first to unlock quarterly performance reviews.</span>
                  </p>

                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                    <AlertTriangle size={16} strokeWidth={2.5} />
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
