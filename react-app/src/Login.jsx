import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { WarningCircle as AlertCircle, SpinnerGap as Loader2, Eye, EyeSlash as EyeOff, EnvelopeIcon as Mail, ArrowLeft } from '@phosphor-icons/react';
import { Input } from './components/ui/Input';
import { auth } from './lib/auth';
import { getOAuthErrorMessage, LOGIN_COPY, SIGN_IN_FAILED_TITLE } from './lib/authCopy.js';

const GOOGLE_VIEW = 'google';
const MANUAL_VIEW = 'manual';
const LOGIN_VIEW_TRANSITION_MS = 380;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('a11y-reduce-motion')
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginView, setLoginView] = useState(GOOGLE_VIEW);
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
      setLoginView(MANUAL_VIEW);
    } else if (errorCode) {
      setError(getOAuthErrorMessage(errorCode));
      setLoginView(MANUAL_VIEW);
    }
  }, [searchParams]);

  const cardRef = useRef(null);
  const panelShellRef = useRef(null);
  const googlePanelRef = useRef(null);
  const manualPanelRef = useRef(null);
  const emailInputRef = useRef(null);
  const loginViewRef = useRef(loginView);

  useEffect(() => {
    loginViewRef.current = loginView;
  }, [loginView]);

  const syncPanelHeight = (view = loginViewRef.current) => {
    const shell = panelShellRef.current;
    const panel = view === MANUAL_VIEW ? manualPanelRef.current : googlePanelRef.current;
    if (!shell || !panel) return;
    shell.style.height = `${panel.offsetHeight}px`;
  };

  useLayoutEffect(() => {
    syncPanelHeight(loginView);
  }, [loginView]);

  useEffect(() => {
    const googlePanel = googlePanelRef.current;
    const manualPanel = manualPanelRef.current;
    if (!googlePanel || !manualPanel) return undefined;

    syncPanelHeight(loginViewRef.current);

    const handleResize = () => syncPanelHeight(loginViewRef.current);
    let resizeObserver;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncPanelHeight(loginViewRef.current));
      resizeObserver.observe(googlePanel);
      resizeObserver.observe(manualPanel);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (loginView !== MANUAL_VIEW) return undefined;

    const focusDelay = prefersReducedMotion() ? 0 : LOGIN_VIEW_TRANSITION_MS;
    const timeoutId = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, focusDelay);

    return () => window.clearTimeout(timeoutId);
  }, [loginView]);

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

  const openManualView = () => setLoginView(MANUAL_VIEW);
  const returnToGoogleView = () => setLoginView(GOOGLE_VIEW);

  // Shared privacy notice below both login views
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
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.14]"
        style={{ backgroundImage: `url('/SDO_Facade.webp')` }}
      />

      {/* Soft overlay */}
      <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/65 backdrop-blur-[2px] pointer-events-none z-10" />

      {/* Main Content */}
      <div className="relative z-30 container mx-auto px-6 flex flex-col items-center justify-center flex-1 w-full py-8 md:pb-32">
        <div
          ref={cardRef}
          className="relative bg-[#fafafa]/90 dark:bg-dark-surface/90 border border-slate-200 dark:border-dark-border rounded-[2rem] p-6 md:p-8 shadow-2xl text-center max-w-md w-full mx-auto ring-1 ring-slate-900/5 dark:ring-dark-border/30 backdrop-blur-md login-card-entrance"
        >
          {loginView === MANUAL_VIEW && (
            <button
              type="button"
              onClick={returnToGoogleView}
              className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-dark-border bg-white/90 dark:bg-dark-base/80 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <ArrowLeft size={14} weight="bold" />
              Back
            </button>
          )}

          {/* Logo + Title */}
          <div className="mb-3 flex justify-center login-stagger-child" style={{'--stagger-i': 0}}>
            <img src="/AIP-PIR-logo.webp" alt="AIP-PIR Logo" className="h-16 w-auto drop-shadow-sm" fetchPriority="high" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100 login-stagger-child" style={{'--stagger-i': 1}}>
            AIP-PIR System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 mb-5 px-4 login-stagger-child" style={{'--stagger-i': 2}}>
            Schools Division of Guihulngan City, DepEd NIR.
          </p>

          {/* Sign-in options */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 login-stagger-child" style={{'--stagger-i': 3}}>
            {loginView === MANUAL_VIEW
              ? 'Use manual sign-in only for direct portal accounts.'
              : 'Sign in with your DepEd Google account.'}
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
            <div ref={panelShellRef} className="login-panel-shell">
              <div className={`login-panel-track ${loginView === MANUAL_VIEW ? 'login-panel-track--manual' : ''}`}>
                <section
                  ref={googlePanelRef}
                  className="login-panel"
                  data-active={loginView === GOOGLE_VIEW}
                  aria-hidden={loginView !== GOOGLE_VIEW}
                >
                  <div className="login-panel-content space-y-4 p-1">
                    <a
                      href={`${import.meta.env.VITE_API_URL}/api/auth/oauth/google`}
                      tabIndex={loginView === GOOGLE_VIEW ? 0 : -1}
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
                    <button
                      type="button"
                      onClick={openManualView}
                      tabIndex={loginView === GOOGLE_VIEW ? 0 : -1}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      Can&apos;t access your DepEd Google email? Sign in manually.
                    </button>
                  </div>
                </section>

                <section
                  ref={manualPanelRef}
                  className="login-panel"
                  data-active={loginView === MANUAL_VIEW}
                  aria-hidden={loginView !== MANUAL_VIEW}
                >
                  <div className="login-panel-content p-1">
                    <div className="rounded-2xl border border-slate-200/80 dark:border-dark-border bg-slate-50/80 dark:bg-dark-base/50 p-4 shadow-sm text-left">
                      <div className="mb-4">
                        <div className="min-w-0">
                          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Manual Sign-in
                          </h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Use this only if SDO IT set up a direct portal account for you.
                          </p>
                        </div>
                      </div>

                      <form className="space-y-4" onSubmit={handleLogin}>
                        <div className="space-y-3">
                          <Input
                            ref={emailInputRef}
                            theme="indigo"
                            label="Email Address"
                            id="email-address"
                            name="email"
                            type="text"
                            autoComplete="email"
                            required
                            disabled={loginView !== MANUAL_VIEW}
                            tabIndex={loginView === MANUAL_VIEW ? 0 : -1}
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
                            disabled={loginView !== MANUAL_VIEW}
                            tabIndex={loginView === MANUAL_VIEW ? 0 : -1}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            endIcon={
                              <button
                                type="button"
                                disabled={loginView !== MANUAL_VIEW}
                                tabIndex={loginView === MANUAL_VIEW ? 0 : -1}
                                onClick={() => setShowPassword(!showPassword)}
                                className="focus:outline-none hover:text-indigo-600 focus:text-indigo-600 flex items-center justify-center p-1 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            }
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loginView !== MANUAL_VIEW || isLoading}
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
                </section>
              </div>
            </div>
            {privacyNotice}
          </div>
        </div>
      </div>

      <footer className="w-full z-40 px-4 pb-5 pt-2">
        <div className="mx-auto max-w-3xl rounded-2xl md:rounded-full border border-slate-200/80 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md px-4 py-3 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-7 w-auto" fetchPriority="low" />
              <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-7 w-auto" fetchPriority="low" />
              <img src="/Division_Logo.webp" alt="Division Logo" className="h-7 w-auto" fetchPriority="low" />
            </div>
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">•</span>
            <a
              href="mailto:guihulngan.city@deped.gov.ph"
              className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Mail size={14} />
              Need help signing in? Contact SDO IT
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
