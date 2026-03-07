import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Reusable Aceternity-style Input Component
const Input = ({ label, className = "", ...props }) => (
    <div className="flex flex-col gap-1.5 w-full group text-left">
        {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-indigo-600 transition-colors">{label}</label>}
        <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-500"></div>
            <input 
                className={`relative w-full bg-white border border-slate-200 focus:border-transparent focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)] ${className}`}
                {...props}
            />
        </div>
    </div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard/home based on role
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url('/SDO_Facade.webp')` }}
      ></div>

      {/* Aceternity Grid Background overlay */}
      <div className="absolute inset-0 bg-slate-900/10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-10"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/30 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-30 container mx-auto px-6 flex flex-col items-center justify-center min-h-screen py-12 pb-24">
        <div className="bg-white/90 border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-2xl text-center max-w-md w-full mx-auto ring-1 ring-slate-900/5 backdrop-blur-md mb-8">
          
          <div className="mb-8 flex justify-center items-center gap-6">
            <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-[84px] w-auto drop-shadow-sm" />
            <div className="h-16 w-px bg-slate-200 rounded-full"></div>
            <img src="/Division_Logo.webp" alt="Division Logo" className="h-20 w-auto drop-shadow-sm" />
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tighter text-slate-900 pb-2">
            QPIR-AIP System
          </h2>
          <p className="text-slate-500 font-medium mb-8 text-sm px-4">
            Sign in to access your dashboard
          </p>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="text-red-600 text-sm font-semibold text-center bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              <Input
                label="Email Address"
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="e.g. 120233@deped.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Full-width Footer Bar */}
      <footer className="absolute bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 py-4 z-40">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs font-medium gap-4 sm:gap-2">
          <div className="flex items-center gap-3">
            <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-8 w-auto opacity-80" />
            <img src="/Division_Logo.webp" alt="Division Logo" className="h-8 w-auto opacity-80" />
            <div className="hidden sm:block h-6 w-px bg-slate-300 mx-2"></div>
            <div>
              <span className="font-bold text-slate-700">Department of Education</span> • Negros Island Region • Division of Guihulngan City
            </div>
          </div>
          <div className="text-slate-400">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}