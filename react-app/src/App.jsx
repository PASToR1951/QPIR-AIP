import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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

// Simple Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function Dashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Mock state: In a real app, these would come from an API
  const [hasAIP, setHasAIP] = useState(false);
  
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
    { label: 'Active Programs', value: '12', icon: <Layers className="w-6 h-6 text-indigo-500" />, color: 'indigo' },
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="container mx-auto px-4 flex justify-between items-center h-16 max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <img src="/DepEd-emblem.webp" alt="DepEd Logo" className="h-8 w-auto" />
            </div>
            <div className="flex flex-col">
                <div className="font-extrabold text-base text-slate-900 tracking-tight leading-none uppercase">Guihulngan City</div>
                <div className="text-[10px] font-bold text-indigo-600 tracking-[0.2em] uppercase mt-1">QPIR-AIP Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2 text-right">
                <span className="text-sm font-black text-slate-900 leading-none">
                  {user?.name || user?.school?.name || user?.email}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-extrabold mt-1.5 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100/50">
                  {user?.role === 'School' ? 'School Account' : user?.role}
                </span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="group flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                <LogOut size={16} strokeWidth={2.5} />
              </div>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto mt-6 px-4 pb-12">
        {/* Welcome Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 relative bg-indigo-600 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-indigo-200 overflow-hidden text-white group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold mb-6 border border-white/20 uppercase tracking-widest">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            Portal Active
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
                            Ready to plan <br/> your impact?
                        </h1>
                        <p className="text-indigo-100 font-medium max-w-md text-sm md:text-lg leading-relaxed opacity-90">
                           Streamlining School Improvement Projects and Implementation Reviews for a better DepEd future.
                        </p>
                    </div>
                </div>
                
                <div className="absolute right-8 bottom-8 hidden md:block opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
                    <LayoutDashboard size={120} />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div>
                   <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Quarterly Progress</h3>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">FY 2026</span>
                   </div>
                   <div className="space-y-4">
                        {quarters.map((q) => (
                            <div key={q.name} className={`flex items-center justify-between p-3 rounded-2xl border ${q.current ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${q.current ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        {q.name}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-800">{q.status}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">Due {q.deadline}</div>
                                    </div>
                                </div>
                                {q.current && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>}
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
            
            {/* Toggle just for demonstration purposes */}
            <button 
                onClick={() => setHasAIP(!hasAIP)}
                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-tight"
            >
                [Dev Toggle AIP]
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* AIP Card */}
          <Link to="/aip" className="group block bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 active:scale-[0.98] overflow-hidden">
            <div className="p-10">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:bg-indigo-600 group-hover:text-white shadow-lg shadow-indigo-100 group-hover:shadow-indigo-200 border border-indigo-100">
                    <FileText size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">AIP Form</h3>
                <p className="font-medium text-slate-500 leading-relaxed text-base">
                  Annual Implementation Plan <br/>
                  <span className="text-slate-400 text-sm">Strategic objectives & activity planning</span>
                </p>
            </div>
            <div className="bg-slate-50 border-t border-slate-100 px-10 py-5 flex items-center justify-between group-hover:bg-indigo-600 transition-colors">
                <span className="text-sm font-bold text-indigo-600 group-hover:text-white transition-colors">Launch Module</span>
                <ArrowRight size={20} strokeWidth={3} className="text-indigo-500 transform group-hover:translate-x-2 transition-transform group-hover:text-white" />
            </div>
          </Link>
          
          {/* PIR Card */}
          {hasAIP ? (
            <Link to="/pir" className="group block bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 active:scale-[0.98] overflow-hidden">
                <div className="p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-emerald-600 group-hover:text-white shadow-lg shadow-emerald-100 group-hover:shadow-emerald-200 border border-emerald-100">
                            <BarChart3 size={32} strokeWidth={2.5} />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                            <Unlock size={10} strokeWidth={3} />
                            Unlocked
                        </div>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">PIR Form</h3>
                    <p className="font-medium text-slate-500 leading-relaxed text-base">
                      Program Implementation Review <br/>
                      <span className="text-slate-400 text-sm">Physical & financial accomplishments</span>
                    </p>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 px-10 py-5 flex items-center justify-between group-hover:bg-emerald-600 transition-colors">
                    <span className="text-sm font-bold text-emerald-600 group-hover:text-white transition-colors">Launch Module</span>
                    <ArrowRight size={20} strokeWidth={3} className="text-emerald-500 transform group-hover:translate-x-2 transition-transform group-hover:text-white" />
                </div>
            </Link>
          ) : (
            <div className="block bg-white rounded-[2rem] border-2 border-dashed border-slate-200 relative overflow-hidden grayscale opacity-70 cursor-not-allowed">
                <div className="p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center border border-slate-200">
                            <BarChart3 size={32} strokeWidth={2.5} />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200">
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
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
                <h3 className="text-2xl font-black mb-2 tracking-tight">Need assistance?</h3>
                <p className="text-slate-400 text-sm font-medium">Our technical support team is available during office hours to help you with any issues regarding the portal.</p>
            </div>
            <div className="flex gap-4">
                <a href="#" className="px-6 py-3 bg-white text-slate-900 font-black rounded-2xl text-sm hover:bg-slate-200 transition-colors active:scale-95 shadow-lg shadow-white/5">
                    User Manual
                </a>
                <a href="#" className="px-6 py-3 bg-slate-800 text-white font-black rounded-2xl text-sm hover:bg-slate-700 transition-colors active:scale-95 border border-slate-700">
                    Contact Helpdesk
                </a>
            </div>
        </div>
      </main>
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
              <PIRForm />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
