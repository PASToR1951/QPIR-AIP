import { Component, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ArrowClockwise as RefreshCcw, ArrowLeft, Warning } from '@phosphor-icons/react';
import Login from './Login';
import { BrandingContext } from './context/BrandingContext.jsx';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

// Framer-motion + all authenticated routes live in this lazy module.
// This keeps framer-motion (124KB) off the Login critical path.
const AnimatedContent = lazy(() => import('./AnimatedContent'));

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-dark-base">
    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-pink-500 animate-spin" />
  </div>
);

function AppRoutes() {
  const location = useLocation();

  // Login renders immediately — zero framer-motion dependency
  if (location.pathname === '/login') {
    return (
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Everything else lazy-loads the animated shell (includes framer-motion)
  return (
    <Suspense fallback={<Spinner />}>
      <AnimatedContent />
    </Suspense>
  );
}

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900 dark:text-slate-100 group/screen select-none">

          {/* Base Gradient Layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 dark:from-pink-950/20 via-white dark:via-dark-base to-blue-50/50 dark:to-blue-950/20 z-0"></div>

          {/* SDO Facade Background Asset - Tease Reveal */}
          <div
            className="absolute inset-0 z-10 opacity-10 transition-all duration-1000 ease-in-out group-hover/screen:opacity-25 grayscale group-hover/screen:grayscale-0 pointer-events-none"
            style={{
              backgroundImage: `url('/SDO_Facade.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: 'scale(1.02)'
            }}
          ></div>

          {/* Aurora Orbs */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[5]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[5]" style={{ animationDelay: '2s' }}></div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_130%)] pointer-events-none z-[6] opacity-30"></div>

          <div className="relative z-20 flex flex-col items-center text-center max-w-2xl px-4">
            {/* Branding */}
            <div className="relative mb-10">
              <BrandingContext.Consumer>
                {({ appLogo }) => (
                  <img src={appLogo} alt="AIP-PIR Logo" className="h-28 md:h-36 w-auto drop-shadow-2xl" />
                )}
              </BrandingContext.Consumer>
            </div>

            {/* Status indicator */}
            <div className="mb-8">
              <div className="text-6xl md:text-7xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-slate-100 via-slate-700 dark:via-slate-300 to-slate-900 dark:to-slate-100">APP ERROR</div>
            </div>

            {/* Content Card */}
            <div className="bg-white/40 dark:bg-dark-surface/60 backdrop-blur-xl border border-white/40 dark:border-dark-border p-10 md:p-12 rounded-[3.5rem] shadow-2xl shadow-pink-200/20 max-w-xl w-full mb-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl"></div>

              <div className="flex justify-center mb-8">
                <div className="p-6 bg-white dark:bg-dark-surface rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-dark-border group-hover:scale-110 transition-transform duration-500">
                  <Warning size={56} className="text-pink-600" />
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase mb-4">
                Something Went <span className="text-pink-600">Wrong</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed">
                An unexpected error occurred within the portal. This may be a temporary issue — please reload the page or return to where you came from.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto justify-center"
              >
                <RefreshCcw size={20} />
                Reload Page
              </button>

              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-3 bg-white dark:bg-dark-surface border-2 border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:border-slate-900 dark:hover:border-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all active:scale-95 w-full sm:w-auto justify-center shadow-lg shadow-slate-100"
              >
                <ArrowLeft size={20} weight="bold" />
                Return Back
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  return (
    <Router>
      <ErrorBoundary>
        {recaptchaSiteKey ? (
          <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey} useRecaptchaNet>
            <AppRoutes />
          </GoogleReCaptchaProvider>
        ) : (
          <AppRoutes />
        )}
      </ErrorBoundary>
    </Router>
  );
}

export default App;
