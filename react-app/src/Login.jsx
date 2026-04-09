import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { WarningCircle as AlertCircle, SpinnerGap as Loader2, Eye, EyeSlash as EyeOff, MapPinIcon as MapPin, EnvelopeIcon as Mail, FacebookLogoIcon as Facebook, PhoneIcon as Phone } from '@phosphor-icons/react';
import { Input } from './components/ui/Input';
import { auth } from './lib/auth';
import { getOAuthErrorMessage, LOGIN_COPY, SIGN_IN_FAILED_TITLE } from './lib/authCopy.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Prefetch Dashboard chunk during idle time so it's ready after login
  useEffect(() => {
    const id = requestIdleCallback(() => import('./Dashboard'), { timeout: 3000 });
    return () => cancelIdleCallback(id);
  }, []);

  // Display error messages redirected from OAuth callbacks
  useEffect(() => {
    const msg = searchParams.get('message');
    const errorCode = searchParams.get('error');
    if (msg) {
      setError(decodeURIComponent(msg));
    } else if (errorCode) {
      setError(getOAuthErrorMessage(errorCode));
    }
  }, [searchParams]);

  const cardRef     = useRef(null);

  const shakeCard = () => {
    if (!cardRef.current) return;
    cardRef.current.classList.remove('login-shake');
    cardRef.current.offsetHeight; // force reflow to restart animation
    cardRef.current.classList.add('login-shake');
    cardRef.current.addEventListener('animationend', () => {
      cardRef.current?.classList.remove('login-shake');
    }, { once: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const finalEmail = email.includes('@') ? email : `${email}@deped.gov.ph`;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email: finalEmail,
        password,
      }, { withCredentials: true });

      const user = await auth.refreshSession();
      navigate(auth.isAdminPanelRole(user.role) ? '/admin' : '/');
    } catch (err) {
      shakeCard();
      setError(
        err.message === 'SESSION_REFRESH_FAILED'
          ? LOGIN_COPY.sessionRefreshError
          : err.response?.data?.error || LOGIN_COPY.invalidCredentials
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Shared privacy notice — rendered in both tabs
  const privacyNotice = (
    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center px-2">
      By signing in, you agree to the portal&apos;s{' '}
      <Link to="/privacy" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
        Privacy Notice
      </Link>
      {' '}under the Data Privacy Act of 2012.
    </p>
  );

  return (
    <div className="bg-slate-50 dark:bg-dark-base min-h-[100svh] flex flex-col items-center justify-center relative font-sans overflow-x-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url('/SDO_Facade.webp')` }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-slate-900/10 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-10" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/30 dark:opacity-30 rounded-full blur-2xl opacity-40 pointer-events-none z-0 login-orb-float-1" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/30 dark:opacity-30 rounded-full blur-2xl opacity-40 pointer-events-none z-0 login-orb-float-2" />

      {/* Main Content */}
      <div className="relative z-30 container mx-auto px-6 flex flex-col items-center justify-center flex-1 w-full py-8 md:pb-32">
        <div
          ref={cardRef}
          className="bg-[#fafafa]/90 dark:bg-dark-surface/90 border border-slate-200 dark:border-dark-border rounded-[2rem] p-6 md:p-8 shadow-2xl text-center max-w-md w-full mx-auto ring-1 ring-slate-900/5 dark:ring-dark-border/30 backdrop-blur-md login-card-entrance"
        >
          {/* Logo + Title */}
          <div className="mb-3 flex justify-center login-stagger-child" style={{'--stagger-i': 0}}>
            <img src="/AIP-PIR-logo.webp" alt="AIP-PIR Logo" className="h-16 w-auto drop-shadow-sm" fetchPriority="high" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100 login-stagger-child" style={{'--stagger-i': 1}}>
            AIP-PIR System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 mb-5 px-4 login-stagger-child" style={{'--stagger-i': 2}}>
            Tracking of Education Programs: Program Implementation Review System.
          </p>

          {/* Sign-in options */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 login-stagger-child" style={{'--stagger-i': 3}}>
            DepEd Google is recommended for most users. If your account uses direct portal access, you can sign in with Email &amp; Password below.
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-red-200 dark:border-red-900/60 shadow-sm shadow-red-100/50 dark:shadow-none">
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 px-4 py-3">
                <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-500 dark:text-red-400">
                  <AlertCircle size={15} weight="fill" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 mb-0.5">{SIGN_IN_FAILED_TITLE}</p>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium leading-snug">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="flex-shrink-0 mt-0.5 text-red-300 dark:text-red-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  aria-label="Dismiss error"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-5 -mx-1 login-stagger-child" style={{'--stagger-i': 4}}>
            <div className="space-y-3 p-1">
              <a
                href={`${import.meta.env.VITE_API_URL}/api/auth/oauth/google`}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#0F3460] bg-white dark:bg-[#1A1A2E] text-slate-700 dark:text-gray-200 text-sm font-semibold transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-[#0F3460]/60"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with DepEd Google
              </a>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Use this first if your DepEd Google account is active.
              </p>
            </div>

            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-slate-200 dark:bg-dark-border" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                or use Email &amp; Password
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-dark-border" />
            </div>

            <form className="space-y-4 p-1" onSubmit={handleLogin}>
              <div className="space-y-3">
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
                  type={showPassword ? 'text' : 'password'}
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
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Use the form below only if your account was set up for direct portal sign-in.
              </p>
              {privacyNotice}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Signing in...
                  </>
                ) : (
                  'Sign in with Email & Password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Pill Footer */}
      <footer className="md:absolute md:bottom-6 w-full z-40 p-4 login-footer-entrance">
        <div className="footer-pill container mx-auto max-w-6xl bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl border border-slate-200 dark:border-dark-border rounded-[2.5rem] md:rounded-full shadow-xl shadow-slate-200/50 py-6 md:py-3 px-6 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-slate-500 dark:text-slate-400 text-xs">

            <div className="footer-item flex items-center gap-2 md:gap-3" style={{'--footer-i': 0}}>
              <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-8 md:h-10 w-auto drop-shadow-sm transition-all duration-300" fetchPriority="low" />
              </a>
              <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-8 md:h-10 w-auto drop-shadow-sm transition-all duration-300" fetchPriority="low" />
              </a>
              <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-8 md:h-10 w-auto drop-shadow-sm transition-all duration-300" fetchPriority="low" />
              </a>
            </div>

            <div className="footer-item flex flex-col items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center" style={{'--footer-i': 1}}>
              <div className="flex flex-wrap justify-center items-center gap-2">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Osme%C3%B1a+Avenue+City+of+Guihulngan+Negros+Oriental"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors underline decoration-dotted underline-offset-2"
                >
                  <MapPin size={12} className="text-slate-300" /> Osmeña Avenue, City of Guihulngan, Negros Oriental
                </a>
                <span className="hidden lg:inline text-slate-300">•</span>
                <span className="flex items-center gap-1"><Phone size={12} className="text-slate-300" /> (035) 410-4069 • (035) 410-4066 • 0956-964-7346</span>
              </div>
              <div className="text-slate-400 font-normal tracking-tight text-[9px]">
                © {new Date().getFullYear()} DepEd Division of Guihulngan City. All rights reserved.
              </div>
            </div>

            <div className="footer-item flex items-center justify-center gap-3" style={{'--footer-i': 2}}>
              <a href="mailto:guihulngan.city@deped.gov.ph" className="flex items-center gap-2 px-4 py-2 bg-pink-500 border border-pink-500 rounded-full text-[10px] font-bold text-white hover:bg-pink-600 hover:border-pink-600 transition-all shadow-sm">
                <Mail size={16} />
                <span className="hidden lg:inline">Email Us</span>
              </a>
              <a href="https://www.facebook.com/DepedGuihulnganCity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-full text-[10px] font-bold text-white hover:bg-blue-700 hover:border-blue-700 transition-all shadow-sm">
                <Facebook size={16} />
                <span className="hidden lg:inline">Facebook</span>
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
