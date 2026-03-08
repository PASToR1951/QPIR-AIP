import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900 group/screen">
      
      {/* 1. Base Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-blue-50/50 z-0"></div>

      {/* 2. SDO Facade Background Asset - Tease Reveal */}
      <div 
        className="absolute inset-0 z-10 opacity-10 transition-all duration-1000 ease-in-out group-hover/screen:opacity-25 grayscale group-hover/screen:grayscale-0 pointer-events-none"
        style={{ 
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(1.02)'
        }}
      ></div>
      
      {/* 3. Blended Aurora Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[5]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-[5]" style={{ animationDelay: '2s' }}></div>

      {/* 4. Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_130%)] pointer-events-none z-[6] opacity-30"></div>

      <div className="relative z-20 flex flex-col items-center text-center max-w-2xl px-4">
        {/* Branding */}
        <div className="relative mb-10">
            <img src="/Division_Logo.webp" alt="Division Logo" className="h-28 md:h-36 w-auto drop-shadow-2xl" />
        </div>

        {/* Status indicator */}
        <div className="mb-8">
           <div className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">NOT FOUND</div>
        </div>

        {/* Content Card */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 p-10 md:p-12 rounded-[3.5rem] shadow-2xl shadow-pink-200/20 max-w-xl w-full mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase mb-4">
                Resource <span className="text-pink-600">Unavailable</span>
            </h2>
            <p className="text-slate-500 text-base font-medium leading-relaxed">
                The requested resource is currently unavailable or has been relocated within the portal infrastructure.
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <Link 
                to="/" 
                className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:bg-pink-600 transition-all active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto justify-center"
            >
                <Home size={18} strokeWidth={2.5} />
                Back to Dashboard
            </Link>
            
            <button 
                onClick={() => navigate(-1)}
                className="group flex items-center gap-3 bg-white border-2 border-slate-200 text-slate-600 px-10 py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:border-slate-900 hover:text-slate-900 transition-all active:scale-95 w-full sm:w-auto justify-center shadow-lg shadow-slate-100"
            >
                <ArrowLeft size={18} strokeWidth={2.5} />
                Return Back
            </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
