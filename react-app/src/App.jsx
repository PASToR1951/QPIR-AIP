import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
  
  // Mock state: Determines if user has submitted an AIP.
  // Set to false to disable PIR button. (In a real app, fetch from backend)
  const [hasAIP, setHasAIP] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="container mx-auto px-4 flex justify-between items-center h-16 max-w-5xl">
          <div className="flex items-center gap-3">
            <img src="/DepEd-emblem.svg" alt="DepEd" className="h-8 w-auto" />
            <div className="font-bold text-lg text-slate-800 tracking-tight">QPIR-AIP Portal</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700 leading-none">{user?.email}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">{user?.role}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="text-sm text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 font-bold px-4 py-2 rounded-xl transition-colors active:scale-95 shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto mt-8 px-4 pb-12">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-sm mb-8 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-[0.03] pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>
            <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome back!</h1>
                <p className="text-slate-500 font-medium max-w-2xl text-sm md:text-base leading-relaxed">
                  Manage your Annual Implementation Plans (AIP) and submit your Quarterly Program Implementation Reviews (PIR) accurately and securely.
                </p>
            </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Available Modules</h2>
            
            {/* Toggle just for demonstration purposes */}
            <button 
                onClick={() => setHasAIP(!hasAIP)}
                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
            >
                [Dev Toggle AIP: {hasAIP ? 'Yes' : 'No'}]
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AIP Card */}
          <Link to="/aip" className="group block bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all active:scale-[0.98] overflow-hidden">
            <div className="p-8">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-indigo-600 group-hover:text-white shadow-sm border border-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">AIP Form</h3>
                <p className="font-medium text-slate-500 text-sm leading-relaxed">Create, update, or view your Annual Implementation Plan. <strong className="text-slate-700">This must be completed before submitting a PIR.</strong></p>
            </div>
            <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex items-center justify-between group-hover:bg-indigo-50/80 transition-colors">
                <span className="text-sm font-bold text-indigo-600">Open Module</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 transform group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </Link>
          
          {/* PIR Card */}
          {hasAIP ? (
            <Link to="/pir" className="group block bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all active:scale-[0.98] overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-emerald-600 group-hover:text-white shadow-sm border border-emerald-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                            Unlocked
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">PIR Form</h3>
                    <p className="font-medium text-slate-500 text-sm leading-relaxed">Submit your Program Implementation Review to report on physical and financial accomplishments.</p>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex items-center justify-between group-hover:bg-emerald-50/80 transition-colors">
                    <span className="text-sm font-bold text-emerald-600">Open Module</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 transform group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
            </Link>
          ) : (
            <div className="block bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 relative overflow-hidden opacity-80 cursor-not-allowed">
                <div className="absolute inset-0 bg-slate-100/50 z-10 pointer-events-none mix-blend-multiply"></div>
                <div className="p-8 relative z-0">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center grayscale">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Locked
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-400 mb-2">PIR Form</h3>
                    <p className="font-medium text-slate-400 text-sm leading-relaxed">Submit your Program Implementation Review to report on physical and financial accomplishments.</p>
                </div>
                <div className="bg-slate-100 border-t border-slate-200 px-8 py-4 relative z-0">
                    <p className="text-sm font-bold text-amber-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                        Submit an AIP first to unlock
                    </p>
                </div>
            </div>
          )}

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
