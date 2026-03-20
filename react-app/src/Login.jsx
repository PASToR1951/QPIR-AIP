import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, ArrowRight, Eye, EyeOff, MapPin, Mail, Facebook, Phone } from 'lucide-react';
import { Input } from './components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Animation Refs
  const cardRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Auto-append domain if not present
    const finalEmail = email.includes('@') ? email : `${email}@deped.gov.ph`;

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email: finalEmail,
        password,
      });

      const { token, user } = response.data;

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard/home based on role
      navigate('/');
    } catch (err) {
      // Shake animation on error via CSS
      if (cardRef.current) {
        cardRef.current.classList.add('login-shake');
        setTimeout(() => cardRef.current?.classList.remove('login-shake'), 300);
      }
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-dark-base min-h-[100svh] flex flex-col items-center justify-center relative font-sans overflow-x-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url('/SDO_Facade.webp')` }}
      ></div>

      {/* Aceternity Grid Background overlay */}
      <div className="absolute inset-0 bg-slate-900/10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-10"></div>

      {/* Glowing Orbs (Animated with Anime.js) */}
      <div ref={orb1Ref} className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/30 dark:opacity-30 rounded-full blur-3xl opacity-40 pointer-events-none z-0 login-orb-float-1"></div>
      <div ref={orb2Ref} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/30 dark:opacity-30 rounded-full blur-3xl opacity-40 pointer-events-none z-0 login-orb-float-2"></div>

      {/* Main Content Area */}
      <div className="relative z-30 container mx-auto px-6 flex flex-col items-center justify-center flex-1 w-full py-8 md:py-12 md:pb-32">
        <div ref={cardRef} className="bg-[#fafafa]/90 dark:bg-dark-surface/90 border border-slate-200 dark:border-dark-border rounded-[2rem] p-8 md:p-12 shadow-2xl text-center max-w-md w-full mx-auto ring-1 ring-slate-900/5 dark:ring-dark-border/30 backdrop-blur-md login-card-entrance">

          <div className="mb-8 flex justify-center items-center gap-6">
            <img src="/AIP-PIR_logo.svg" alt="AIP-PIR Logo" className="h-24 w-auto drop-shadow-sm" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100 pb-2">
            AIP-PIR System
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm px-4">
            Tracking of Education Programs: Program Implementation Review System.
          </p>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm font-semibold text-center bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-3 rounded-xl flex items-center justify-center gap-2">
                <AlertCircle size={16} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <Input
                theme="indigo"
                label="Email Address"
                id="email-address"
                name="email"
                type="text"
                autoComplete="email"
                required
                placeholder="email@deped.gov.ph"
                className="lowercase"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
              />

              <Input
                theme="indigo"
                label="Password"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-indigo-600 focus:text-indigo-600 flex items-center justify-center p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} strokeWidth={2.5} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Pill Style Footer */}
      <footer className="md:absolute md:bottom-6 w-full z-40 p-4">
        <div className="container mx-auto max-w-6xl bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl border border-slate-200 dark:border-dark-border rounded-[2.5rem] md:rounded-full shadow-xl shadow-slate-200/50 py-6 md:py-3 px-6 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-slate-500 dark:text-slate-400 text-xs">

            {/* 1. Logos */}
            <div className="flex items-center justify-center gap-3 md:gap-4 group/logos">
              <a href="https://www.deped.gov.ph/transparency/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/transparency-seal.webp" alt="Transparency Seal" className="h-8 md:h-10 w-auto hover:opacity-100 transition-all duration-300" />
              </a>
              <div className="h-6 md:h-8 w-px bg-slate-300 dark:bg-dark-border"></div>
              <div className="flex items-center gap-2 md:gap-3">
                <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                  <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-8 md:h-10 w-auto drop-shadow-sm transition-all duration-300" />
                </a>
                <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                  <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-8 md:h-10 w-auto drop-shadow-sm transition-all duration-300" />
                </a>
                <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                  <img src="/Division_Logo.webp" alt="Division Logo" className="h-8 md:h-10 w-auto drop-shadow-sm transition-all duration-300" />
                </a>
              </div>
            </div>

            {/* 2. Middle Info (Address & Copyright) */}
            <div className="flex flex-col items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center">
              <div className="flex flex-wrap justify-center items-center gap-2">
                <span className="flex items-center gap-1"><MapPin size={10} className="text-slate-300" /> Osmeña Avenue, City of Guihulngan, Negros Oriental</span>
                <span className="hidden lg:inline text-slate-300">•</span>
                <span className="flex items-center gap-1"><Phone size={10} className="text-slate-300" /> (035) 410-4069 • (035) 410-4066 • 0956-964-7346</span>
              </div>
              <div className="text-slate-400 font-normal tracking-tight text-[9px]">
                © {new Date().getFullYear()} DepEd Division of Guihulngan City. All rights reserved.
              </div>
            </div>

            {/* 3. Social Media Pilled Buttons */}
            <div className="flex items-center justify-center gap-3">
              <a href="mailto:guihulngan.city@deped.gov.ph" className="flex items-center gap-2 px-4 py-2 bg-pink-500 border border-pink-500 rounded-full text-[10px] font-bold text-white hover:bg-pink-600 hover:border-pink-600 transition-all shadow-sm">
                <Mail size={14} />
                <span className="hidden lg:inline">Email Us</span>
              </a>
              <a href="https://www.facebook.com/DepedGuihulnganCity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-full text-[10px] font-bold text-white hover:bg-blue-700 hover:border-blue-700 transition-all shadow-sm">
                <Facebook size={14} />
                <span className="hidden lg:inline">Facebook</span>
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}