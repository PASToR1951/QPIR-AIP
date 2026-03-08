import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* SDO Facade Background Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-50 pointer-events-none"
        style={{ 
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%)'
        }}
      ></div>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-4">
        {/* Animated Icon Container */}
        <div className="relative mb-12 group">
          <div className="absolute -inset-8 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-spin-slow"></div>
          <div className="relative bg-white border border-slate-200 w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200/50 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
             <div className="flex flex-col items-center">
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-20 md:h-24 w-auto transform group-hover:scale-110 transition-transform duration-700 animate-bounce-slow" />
                <div className="absolute -top-2 -right-2 bg-pink-600 text-white p-1.5 rounded-xl shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                    <AlertCircle size={18} strokeWidth={2.5} />
                </div>
             </div>
          </div>
        </div>

        {/* Error Code & Message */}
        <div className="space-y-4 mb-12">
            <h1 className="text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-700 to-slate-400 select-none opacity-10 absolute left-1/2 -translate-x-1/2 -top-16 -z-10">404</h1>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                Lost in <span className="text-blue-600">Space?</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
                The page you are looking for has been moved, evaporated, or never existed in the first place.
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <Link 
                to="/" 
                className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all hover:shadow-2xl active:scale-95 shadow-lg shadow-slate-200 w-full sm:w-auto justify-center"
            >
                <Home size={18} strokeWidth={2.5} className="group-hover:-translate-y-0.5 transition-transform" />
                Back to Dashboard
            </Link>
            
            <button 
                onClick={() => window.history.back()}
                className="group flex items-center gap-3 bg-white border-2 border-slate-100 text-slate-600 px-8 py-4 rounded-3xl font-black text-sm tracking-widest uppercase hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 w-full sm:w-auto justify-center"
            >
                <ArrowLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
                Go Back
            </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 4s ease-in-out infinite;
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
