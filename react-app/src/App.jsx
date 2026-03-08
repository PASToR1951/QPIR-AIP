import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';
import Login from './Login';
import AIPForm from './AIPForm';
import PIRForm from './PIRForm';
import NotFound from './NotFound';
import ErrorPage from './ErrorPage';
import { DashboardHeader } from './components/ui/DashboardHeader';
import Footer from './components/ui/Footer';

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
  const [hasAIP, setHasAIP] = useState(null); // null means loading
  const [aipStatus, setAipStatus] = useState('none'); // none, draft, review, approved
  const [isLoading, setIsLoading] = useState(true);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const checkStatus = async () => {
      if (user?.school_id) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schools/${user.school_id}/aip-status`);
          const dbExists = response.data.hasAIP;

          if (dbExists) {
            setAipStatus('review');
            setHasAIP(true);
          } else {
            // Check for draft via API
            try {
              const draftRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/drafts/AIP/${user.id}`);
              if (draftRes.data.hasDraft) {
                setAipStatus('draft');
              } else {
                setAipStatus('none');
              }
            } catch (e) {
              setAipStatus('none');
            }
            setHasAIP(false);
          }
        } catch (error) {
          console.error('Failed to verify AIP status:', error);
          setHasAIP(false);
          setAipStatus('none');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setHasAIP(false);
        setAipStatus('none');
      }
    };
    checkStatus();
  }, [user?.school_id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Verifying Prerequisites...</p>
        </div>
      </div>
    );
  }

  if (!hasAIP && localStorage.getItem('dev_pir_unlocked') !== 'true') {
    // Redirect to dashboard if AIP is not completed
    return <Navigate to="/" replace />;
  }

  return children;
};

function Dashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [hasAIP, setHasAIP] = useState(false);
  const [aipStatus, setAipStatus] = useState('none');

  useEffect(() => {
    const fetchStatus = async () => {
      if (user?.school_id) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schools/${user.school_id}/aip-status`);
          const dbExists = response.data.hasAIP;

          if (dbExists) {
            setAipStatus('review');
            setHasAIP(true);
          } else {
            try {
              const draftRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/drafts/AIP/${user.id}`);
              if (draftRes.data.hasDraft) {
                setAipStatus('draft');
              } else {
                setAipStatus('none');
              }
            } catch (e) {
              setAipStatus('none');
            }
            setHasAIP(false);
          }
        } catch (error) {
          console.error('Failed to fetch AIP status:', error);
          setHasAIP(false);
          setAipStatus('none');
        }
      }
    };
    fetchStatus();
  }, [user?.school_id]);

  // Countdown Logic
  const calculateDaysLeft = (targetDate) => {
    const deadline = new Date(targetDate);
    // Using the current system time provided: March 7, 2026
    const now = new Date('2026-03-07T20:34:40');
    const difference = deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = calculateDaysLeft('2026-03-31');

  // Mock data for relevant information
  const stats = [
    { label: 'Active Programs', value: '12', icon: <Layers className="w-6 h-6 text-pink-500" />, color: 'pink' },
    { label: 'AIP Completion', value: hasAIP ? '100%' : '0%', icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />, color: 'emerald' },
    { label: 'PIR Submitted', value: '0/4', icon: <BarChart3 className="w-6 h-6 text-amber-500" />, color: 'amber' },
    {
      label: 'Days to Deadline',
      value: `${daysLeft} Days`,
      icon: <Clock className="w-6 h-6 text-rose-500" />,
      subtext: 'Q1 Submission • Mar 31',
      color: 'rose'
    },
  ];

  const quarters = [
    { name: 'Q1', status: 'In Progress', deadline: 'Mar 31, 2026', current: true },
    { name: 'Q2', status: 'Locked', deadline: 'Jun 30, 2026', current: false },
    { name: 'Q3', status: 'Locked', deadline: 'Sep 30, 2026', current: false },
    { name: 'Q4', status: 'Locked', deadline: 'Dec 31, 2026', current: false },
  ];

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 relative bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm overflow-hidden group">
            {/* Card Background Facade */}
            <div
              className="absolute inset-0 opacity-70 grayscale pointer-events-none transition-all duration-700 group-hover:opacity-85 group-hover:grayscale-0"
              style={{
                backgroundImage: `url('/SDO_Facade.webp')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'radial-gradient(circle at top right, black, transparent 80%)'
              }}
            ></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Summary</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2">
                Welcome back, <br />
                <span className="text-pink-600">{user?.school_name || user?.name || 'User'}</span>
              </h1>

              <p className="text-slate-500 font-medium max-w-md text-sm md:text-base leading-relaxed mb-8">
                You are currently managing the planning and review cycle for <span className="text-slate-900 font-bold">FY 2026</span>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
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
                    <div className="text-sm font-black text-slate-800">Q1 In Progress</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Quarterly Progress</h3>
                <span className="text-xs font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">FY 2026</span>
              </div>
              <div className="space-y-4">
                {quarters.map((q) => (
                  <div key={q.name} className={`flex items-center justify-between p-3 rounded-2xl border ${q.current ? 'bg-pink-50 border-pink-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${q.current ? 'bg-pink-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {q.name}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{q.status}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Due {q.deadline}</div>
                      </div>
                    </div>
                    {q.current && <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping"></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`text-2xl mb-2 group-hover:scale-125 transition-transform duration-500`}>{stat.icon}</div>
                <div className="text-2xl font-black text-slate-800 leading-none mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</div>
                {stat.subtext && (
                  <div className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-tighter">
                    {stat.subtext}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modules Section */}
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <span className="w-8 h-px bg-slate-200"></span>
            Main Modules
            <span className="w-8 h-px bg-slate-200"></span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* AIP Card */}
          <Link to="/aip" className={`group block bg-white rounded-[2rem] border-2 shadow-sm hover:shadow-2xl transition-all duration-500 active:scale-[0.98] overflow-hidden border-slate-100 hover:border-pink-200`}>
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-lg border bg-pink-50 text-pink-600 border-pink-100 shadow-pink-100 group-hover:bg-pink-600 group-hover:text-white group-hover:shadow-pink-200`}>
                  <FileText size={32} strokeWidth={2.5} />
                </div>
                {aipStatus === 'review' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                    Submitted
                  </div>
                )}
                {aipStatus === 'draft' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black uppercase tracking-widest border border-pink-200 shadow-sm">
                    In Progress
                  </div>
                )}
              </div>
              <h3 className={`text-3xl font-black tracking-tight text-slate-900 mb-4 transition-colors group-hover:text-pink-600`}>AIP Form</h3>
              <p className="font-medium text-slate-500 leading-relaxed text-base">
                Annual Implementation Plan <br />
                <span className="text-slate-400 text-sm">Strategic objectives & activity planning</span>
              </p>
            </div>
            <div className={`bg-slate-50 border-t border-slate-100 px-10 py-5 flex items-center justify-between transition-colors group-hover:bg-pink-600`}>
              <span className={`text-sm font-bold transition-colors group-hover:text-white text-pink-600`}>
                {aipStatus === 'review' ? 'View Submission' : aipStatus === 'draft' ? 'Continue Plan' : 'Launch Module'}
              </span>
              <ArrowRight size={20} strokeWidth={3} className={`transform group-hover:translate-x-2 transition-transform group-hover:text-white text-pink-500`} />
            </div>
          </Link>

          {/* PIR Card */}
          {hasAIP || localStorage.getItem('dev_pir_unlocked') === 'true' ? (
            <div className="relative group block bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 overflow-hidden">
              {import.meta.env.DEV && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    localStorage.removeItem('dev_pir_unlocked');
                    window.location.reload();
                  }}
                  className="absolute top-4 right-4 z-20 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                >
                  Dev: Lock PIR
                </button>
              )}
              <Link to="/pir" className="block p-10 h-full w-full active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-blue-600 group-hover:text-white shadow-lg shadow-blue-100 group-hover:shadow-blue-200 border border-blue-100">
                    <BarChart3 size={32} strokeWidth={2.5} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-200 shadow-sm mt-8 sm:mt-0">
                    <Unlock size={10} strokeWidth={3} />
                    Unlocked
                  </div>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">PIR Form</h3>
                <p className="font-medium text-slate-500 leading-relaxed text-base">
                  Program Implementation Review <br />
                  <span className="text-slate-400 text-sm">Physical & financial accomplishments</span>
                </p>
              </Link>
              <Link to="/pir" className="block bg-slate-50 border-t border-slate-100 px-10 py-5 flex items-center justify-between group-hover:bg-blue-600 transition-colors">
                <span className="text-sm font-bold text-blue-600 group-hover:text-white transition-colors">Launch Module</span>
                <ArrowRight size={20} strokeWidth={3} className="text-blue-500 transform group-hover:translate-x-2 transition-transform group-hover:text-white" />
              </Link>
            </div>
          ) : (
            <div className="block bg-white rounded-[2rem] border-2 border-dashed border-slate-200 relative overflow-hidden grayscale opacity-70">
              {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    localStorage.setItem('dev_pir_unlocked', 'true');
                    window.location.reload();
                  }}
                  className="absolute top-4 right-4 z-20 text-[10px] font-bold px-2 py-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                >
                  Dev: Unlock PIR
                </button>
              )}
              <div className="p-10 cursor-not-allowed">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center border border-slate-200">
                    <BarChart3 size={32} strokeWidth={2.5} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 mt-8 sm:mt-0">
                    <Lock size={10} strokeWidth={3} />
                    Locked
                  </div>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-slate-300 mb-4">PIR Form</h3>
                <p className="font-medium text-slate-300 leading-relaxed text-base">Complete and submit your AIP first to unlock quarterly reviews.</p>
              </div>
              <div className="bg-slate-50 border-t border-slate-100 px-10 py-5">
                <p className="text-xs font-bold text-amber-500 flex items-center gap-2">
                  <AlertTriangle size={14} strokeWidth={2.5} />
                  Prerequisite: AIP Submission
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 mb-12 text-center md:text-left relative overflow-hidden group">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-700 group-hover:opacity-[0.08] mix-blend-overlay grayscale"
            style={{
              backgroundImage: `url('/SDO_Facade.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          <div className="max-w-md relative z-10">
            <h3 className="text-2xl font-black mb-2 tracking-tight">Need assistance?</h3>
            <p className="text-slate-400 text-sm font-medium">Our technical support team is available during office hours to help you with any issues regarding the portal.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10">
            <a href="#" className="px-6 py-3 bg-white text-slate-900 font-black rounded-2xl text-sm hover:bg-slate-200 transition-colors active:scale-95 shadow-lg shadow-white/5 text-center">
              User Manual
            </a>
            <a href="#" className="px-6 py-3 bg-slate-800 text-white font-black rounded-2xl text-sm hover:bg-slate-700 transition-colors active:scale-95 border border-slate-700 text-center">
              Contact Helpdesk
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aip"
          element={
            <ProtectedRoute>
              <AIPForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pir"
          element={
            <ProtectedRoute>
              <PIRRouteGuard>
                <PIRForm />
              </PIRRouteGuard>
            </ProtectedRoute>
          }
        />

        {/* Error Pages */}
        <Route path="/403" element={<ErrorPage type="403" />} />
        <Route path="/500" element={<ErrorPage type="500" />} />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
