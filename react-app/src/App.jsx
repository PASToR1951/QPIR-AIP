import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="container mx-auto px-4 flex justify-between items-center h-16">
          <div className="font-bold text-xl text-slate-800">QPIR-AIP</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto mt-10 px-4">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/aip" className="block p-6 bg-white rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">AIP Form</h5>
            <p className="font-normal text-slate-700">Create or manage Annual Implementation Plans.</p>
          </a>
          
          <a href="/pir" className="block p-6 bg-white rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">PIR Form</h5>
            <p className="font-normal text-slate-700">Submit Program Implementation Reviews.</p>
          </a>
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
