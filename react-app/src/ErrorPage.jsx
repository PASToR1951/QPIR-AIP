import { Link, useNavigate } from 'react-router-dom';
import { House as Home, ArrowLeft, WifiSlash as WifiOff, ArrowClockwise as RefreshCcw, LockKey as Lock } from '@phosphor-icons/react';
import { useAppLogo } from './context/BrandingContext.jsx';

const ErrorPage = ({ type = "500", title, message, onRetry }) => {
  const appLogo = useAppLogo();
  const navigate = useNavigate();

  const errorConfigs = {
    "403": {
      icon: <Lock size={56} className="text-pink-600" />,
      title: title || "Access Restricted",
      message: message || "You do not have the necessary administrative privileges to view this resource. Please contact the SDO IT department if you believe this is an error.",
      actionLabel: "Return to Dashboard",
      actionIcon: <Home size={20} />,
      actionLink: "/"
    },
    "500": {
      icon: <WifiOff size={56} className="text-blue-600" />,
      title: title || "Server Connection Unavailable",
      message: message || "We are currently experiencing technical difficulties or the server is temporarily offline. Please try again shortly.",
      actionLabel: "Try Again",
      actionIcon: <RefreshCcw size={20} />,
      onClick: onRetry || (() => window.location.reload())
    }
  };

  const config = errorConfigs[type] || errorConfigs["500"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900 dark:text-slate-100 group/screen select-none">
      
      {/* 1. Base Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 dark:from-pink-950/20 via-white dark:via-dark-base to-blue-50/50 dark:to-blue-950/20 z-0"></div>

      {/* 2. SDO Facade Background Asset - Tease Reveal Logic */}
      <div 
        className="absolute inset-0 z-10 opacity-10 transition-all duration-1000 ease-in-out group-hover/screen:opacity-25 grayscale group-hover/screen:grayscale-0 pointer-events-none"
        style={{ 
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(1.02)'
        }}
      ></div>
      
      <div className="absolute inset-0 z-10 opacity-0 group-hover/screen:opacity-10 transition-all duration-1000 pointer-events-none"
        style={{ 
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)'
        }}
      ></div>
      
      {/* 3. Blended Aurora Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[5]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[5]" style={{ animationDelay: '2s' }}></div>

      {/* 4. Grid Pattern Overlay */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_130%)] pointer-events-none z-[6] opacity-30"></div>

      <div className="relative z-20 flex flex-col items-center text-center max-w-2xl px-4">
        {/* Branding */}
        <div className="relative mb-10">
            <img src={appLogo} alt="AIP-PIR Logo" className="h-28 md:h-36 w-auto drop-shadow-2xl" />
        </div>

        {/* Status indicator */}
        <div className="mb-8">
           <div className="text-6xl md:text-7xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-slate-100 via-slate-700 dark:via-slate-300 to-slate-900 dark:to-slate-100">{type} ERROR</div>
        </div>

        {/* Content Card */}
        <div className="bg-white/40 dark:bg-dark-surface/60 backdrop-blur-xl border border-white/40 dark:border-dark-border p-10 md:p-12 rounded-[3.5rem] shadow-2xl shadow-pink-200/20 max-w-xl w-full mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="flex justify-center mb-8">
                <div className="p-6 bg-white dark:bg-dark-surface rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-dark-border group-hover:scale-110 transition-transform duration-500">
                    {config.icon}
                </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase mb-4">
                {config.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed">
                {config.message}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            {config.onClick ? (
                <button 
                  onClick={config.onClick}
                  className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto justify-center"
                >
                  {config.actionIcon}
                  {config.actionLabel}
                </button>
            ) : (
                <Link 
                    to={config.actionLink} 
                    className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:bg-pink-600 transition-all active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto justify-center"
                >
                    {config.actionIcon}
                    {config.actionLabel}
                </Link>
            )}
            
            <button 
                onClick={() => navigate(-1)}
                className="group flex items-center gap-3 bg-white dark:bg-dark-surface border-2 border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:border-slate-900 dark:hover:border-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all active:scale-95 w-full sm:w-auto justify-center shadow-lg shadow-slate-100"
            >
                <ArrowLeft size={20} weight="bold" />
                Return Back
            </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
