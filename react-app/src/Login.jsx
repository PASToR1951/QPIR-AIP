import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAppLogo } from './context/BrandingContext.jsx';
import { WarningCircle as AlertCircle, SpinnerGap as Loader2, Eye, EyeSlash as EyeOff, EnvelopeIcon as Mail, ArrowLeft } from '@phosphor-icons/react';
import { Input } from './components/ui/Input';
import { apiUrl } from './lib/apiBase.js';
import { auth } from './lib/auth';
import { getOAuthErrorMessage, LOGIN_COPY, SIGN_IN_FAILED_TITLE } from './lib/authCopy.js';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const GOOGLE_VIEW = 'google';
const MANUAL_VIEW = 'manual';
const LOGIN_VIEW_TRANSITION_MS = 380;

function roleToDashboard(role) {
  if (auth.isAdminPanelRole(role)) return '/admin';
  if (['CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(role)) return '/ces';
  return '/';
}

function isPrivateIpv4Host(hostname) {
  const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function getGoogleOAuthUnavailableReason() {
  const configuredHost = import.meta.env.VITE_PUBLIC_HOST || '';
  const browserHost = typeof window === 'undefined' ? '' : window.location.hostname;
  const oauthHost = browserHost || configuredHost;

  if (isPrivateIpv4Host(oauthHost)) {
    return 'Google sign-in is unavailable in local-network mode because Google blocks private-IP callback URLs. Use Email & Password for LAN testing.';
  }

  return '';
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('a11y-reduce-motion')
  );
}

export default function Login() {
  const appLogo = useAppLogo();
  const googleOAuthUnavailableReason = getGoogleOAuthUnavailableReason();
  const googleOAuthAvailable = !googleOAuthUnavailableReason;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginView, setLoginView] = useState(googleOAuthAvailable ? GOOGLE_VIEW : MANUAL_VIEW);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Prefetch Dashboard chunk during idle time so it's ready after login
  useEffect(() => {
    const id = requestIdleCallback(() => import('./Dashboard'), { timeout: 3000 });
    return () => cancelIdleCallback(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const redirectAuthenticatedUser = (user) => {
      if (!cancelled && user?.role) {
        navigate(roleToDashboard(user.role), { replace: true });
      }
    };

    const user = auth.getUser();

    if (user?.role && !auth.isExpired()) {
      redirectAuthenticatedUser(user);
      return () => { cancelled = true; };
    }

    if (user?.role && auth.isExpired()) {
      void auth.expireSession();
      return () => { cancelled = true; };
    }

    auth.restoreSession()
      .then(redirectAuthenticatedUser)
      .catch((err) => {
        auth.clearBrowserSession({ clearDrafts: false });
        if (!cancelled && auth.isExplicitLogoutError(err)) {
          setNotice('You signed out of this browser. Please sign in again to continue.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Display error messages redirected from OAuth callbacks
  useEffect(() => {
    const msg = searchParams.get('message');
    const errorCode = searchParams.get('error');
    if (msg) {
      setError(decodeURIComponent(msg));
      setNotice('');
      setLoginView(MANUAL_VIEW);
    } else if (errorCode) {
      setError(getOAuthErrorMessage(errorCode));
      setNotice('');
      setLoginView(MANUAL_VIEW);
    }
  }, [searchParams]);

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
    // Reset first so rapid re-submissions re-trigger the animation
    setIsShaking(false);
    requestAnimationFrame(() => setIsShaking(true));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotice('');

    const finalEmail = email.includes('@') ? email : `${email}@deped.gov.ph`;

    let token = null;
    if (executeRecaptcha) {
      try {
        token = await executeRecaptcha('login');
      } catch {
        shakeCard();
        setError('reCAPTCHA verification failed. Please check your connection.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const { data } = await axios.post(apiUrl('/api/auth/login'), {
        email: finalEmail,
        password,
        recaptchaToken: token,
      }, { withCredentials: true });

      // Use the user data returned by /login directly — no need for a second /me round trip.
      auth.setSession(data.user, data.expiresAt);
      navigate(roleToDashboard(data.user.role), { replace: true });
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
  const returnToGoogleView = () => {
    if (!googleOAuthAvailable) return;
    setLoginView(GOOGLE_VIEW);
  };

  // Shared privacy notice below both login views
  const privacyNotice = (
    <div className="space-y-1 text-center px-2">
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        By signing in, you agree to the portal&apos;s{' '}
        <Link to="/privacy" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Privacy Notice
        </Link>
        {' '}under the Data Privacy Act of 2012.
      </p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
        Protected by reCAPTCHA &mdash; Google{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
        {' '}&amp;{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms of Service</a>
        {' '}apply.
      </p>
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-dark-base min-h-[100svh] flex flex-col items-center justify-center relative font-sans overflow-x-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/SDO_Facade.webp')`,
          opacity: 0.58,
          filter: 'saturate(1.3) contrast(1.08) brightness(1.04)',
        }}
      />

      {/* Vignette — darkens edges, keeps center open */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 30%, rgba(15,23,42,0.38) 100%)',
        }}
      />

      {/* Directional gradient — grounds the bottom, lightens center */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(248,250,252,0.22) 0%, rgba(248,250,252,0.44) 45%, rgba(15,23,42,0.18) 100%)',
        }}
      />

      {/* Grain / noise texture */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
        }}
      />

      {/* Main Content */}
      <div className="relative z-30 container mx-auto px-6 flex flex-col items-center justify-center flex-1 w-full py-8">
        <div
          className={`relative bg-[#fafafa]/90 dark:bg-dark-surface/90 border border-slate-200 dark:border-dark-border rounded-[2rem] p-6 md:p-8 shadow-2xl text-center max-w-md w-full mx-auto ring-1 ring-slate-900/5 dark:ring-dark-border/30 backdrop-blur-md login-card-entrance${isShaking ? ' login-shake' : ''}`}
          onAnimationEnd={(e) => { if (e.animationName === 'login-shake') setIsShaking(false); }}
        >
          <button
            type="button"
            onClick={returnToGoogleView}
            aria-hidden={loginView !== MANUAL_VIEW || !googleOAuthAvailable}
            tabIndex={loginView === MANUAL_VIEW && googleOAuthAvailable ? 0 : -1}
            className={`absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-dark-border bg-white/90 dark:bg-dark-base/80 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-[380ms] ${loginView === MANUAL_VIEW && googleOAuthAvailable
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 -translate-x-2 pointer-events-none'
              }`}
          >
            <ArrowLeft size={14} weight="bold" />
            Back
          </button>

          {/* Logo + Title */}
          <div className="mb-3 flex justify-center login-stagger-child" style={{ '--stagger-i': 0 }}>
            <img src={appLogo} alt="AIP-PIR Logo" className="h-16 w-auto drop-shadow-sm" fetchPriority="high" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100 login-stagger-child" style={{ '--stagger-i': 1 }}>
            AIP-PIR System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 mb-5 px-4 login-stagger-child" style={{ '--stagger-i': 2 }}>
            Schools Division of Guihulngan City, DepEd NIR.
          </p>

          {/* Sign-in options */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 login-stagger-child" style={{ '--stagger-i': 3 }}>
            {!googleOAuthAvailable
              ? 'Google sign-in is unavailable in local-network mode. Use your portal password for testing.'
              : loginView === MANUAL_VIEW
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
          )}

          {notice && !error && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-900/60 shadow-sm shadow-indigo-100/50 dark:shadow-none">
              <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-3">
                <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <AlertCircle size={15} weight="fill" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-0.5">Signed Out</p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium leading-snug">{notice}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotice('')}
                  className="flex-shrink-0 mt-0.5 text-indigo-300 dark:text-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  aria-label="Dismiss notice"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-5 -mx-1 login-stagger-child" style={{ '--stagger-i': 4 }}>
            <div ref={panelShellRef} className="login-panel-shell">
              <div className={`login-panel-track ${loginView === MANUAL_VIEW ? 'login-panel-track--manual' : ''}`}>
                <section
                  ref={googlePanelRef}
                  className="login-panel"
                  data-active={loginView === GOOGLE_VIEW}
                  aria-hidden={loginView !== GOOGLE_VIEW}
                >
                  <div className="login-panel-content space-y-4 p-1">
                    {googleOAuthAvailable ? (
                      <a
                        href={apiUrl('/api/auth/oauth/google')}
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
                    ) : (
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/20 px-4 py-3 text-left shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                          Google Sign-In Unavailable
                        </p>
                        <p className="mt-1 text-sm font-medium leading-snug text-amber-900 dark:text-amber-100">
                          {googleOAuthUnavailableReason}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={openManualView}
                      tabIndex={loginView === GOOGLE_VIEW ? 0 : -1}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      {googleOAuthAvailable
                        ? "Can't access your DepEd Google email? Sign in manually."
                        : 'Continue with Email & Password instead.'}
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
                            'Sign in'
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
              className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 py-2 md:py-0 text-xs md:text-[11px]"
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
