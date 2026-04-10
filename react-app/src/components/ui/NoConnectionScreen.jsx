import { useState, useEffect } from 'react';
import { WifiSlash, ArrowClockwise } from '@phosphor-icons/react';
import { useAppLogo } from '../../context/BrandingContext.jsx';

const NoConnectionScreen = ({ children }) => {
  const appLogo = useAppLogo();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setJustRestored(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setJustRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await fetch('/favicon.ico', { cache: 'no-store', mode: 'no-cors' });
      setJustRestored(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      // still offline
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <>
      {children}

      {!isOnline && (
        <div
          className="fixed inset-0 z-[200] bg-slate-50 dark:bg-dark-base flex flex-col items-center justify-center p-6 overflow-hidden font-sans text-slate-900 dark:text-slate-100 select-none group/screen nc-overlay"
        >
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 dark:from-blue-950/20 via-white dark:via-dark-base to-indigo-50/60 dark:to-indigo-950/20 z-0" />

          {/* SDO Facade background — tease on hover */}
          <div
            className="absolute inset-0 z-[1] opacity-10 transition-all duration-1000 ease-in-out group-hover/screen:opacity-20 grayscale group-hover/screen:grayscale-0 pointer-events-none"
            style={{
              backgroundImage: `url('/SDO_Facade.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: 'scale(1.02)',
            }}
          />

          {/* Aurora orbs */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[2]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[2]" style={{ animationDelay: '1.5s' }} />

          {/* Grid overlay */}
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_130%)] pointer-events-none z-[3] opacity-30" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full px-4">

            {/* Logo */}
            <div className="mb-10 nc-slide-down" style={{ animationDelay: '0.15s' }}>
              <img src={appLogo} alt="AIP-PIR Logo" className="h-24 md:h-28 w-auto drop-shadow-2xl" />
            </div>

            {/* Headline */}
            <div className="mb-8 nc-slide-up" style={{ animationDelay: '0.25s' }}>
              <div className="text-5xl md:text-6xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-slate-100 via-slate-600 dark:via-slate-300 to-slate-900 dark:to-slate-100">
                No Connection
              </div>
            </div>

            {/* Card */}
            <div
              className="bg-white/40 dark:bg-dark-surface/60 backdrop-blur-xl border border-white/40 dark:border-dark-border p-10 md:p-12 rounded-[3.5rem] shadow-2xl shadow-blue-200/20 dark:shadow-blue-900/20 w-full mb-10 relative overflow-hidden group nc-slide-up"
              style={{ animationDelay: '0.35s' }}
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl" />

              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-white dark:bg-dark-surface rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-dark-border group-hover:scale-110 transition-transform duration-500">
                  {justRestored ? (
                    <div className="w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14 text-green-500">
                        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                        <circle
                          cx="28" cy="28" r="26"
                          stroke="currentColor" strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="163"
                          className="nc-check-circle"
                          style={{ transformOrigin: 'center', rotate: '-90deg' }}
                        />
                        <path
                          d="M18 28l7 7 13-14"
                          stroke="currentColor" strokeWidth="3.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          strokeDasharray="40"
                          className="nc-check-path"
                        />
                      </svg>
                    </div>
                  ) : (
                    <WifiSlash size={56} className="text-blue-600" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase mb-4">
                {justRestored ? 'Connection Restored' : 'You\'re Offline'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed">
                {justRestored
                  ? 'Your connection has been restored. Reloading…'
                  : 'Unable to reach the server. Please check your network connection and try again.'}
              </p>
            </div>

            {/* Retry button */}
            {!justRestored && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-black/30 disabled:opacity-60 disabled:cursor-not-allowed nc-slide-up"
                style={{ animationDelay: '0.45s' }}
              >
                <ArrowClockwise
                  size={20}
                  weight="bold"
                  className={isRetrying ? 'animate-spin' : ''}
                />
                {isRetrying ? 'Checking…' : 'Try Again'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NoConnectionScreen;
