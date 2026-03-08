import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-pink-50/30 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
      {/* SDO Facade Background Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{ 
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) brightness(1.2) contrast(0.8)'
        }}
      ></div>
      
      {/* Pink Tint Layer */}
      <div className="absolute inset-0 bg-pink-600/10 mix-blend-multiply pointer-events-none z-[1]"></div>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#fce7f3_1px,transparent_1px),linear-gradient(to_bottom,#fce7f3_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none z-[2]"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-4">
        {/* Frameless Color Logo */}
        <div className="relative mb-8">
            <img src="/Division_Logo.webp" alt="Division Logo" className="h-24 md:h-32 w-auto" />
        </div>

        {/* Message */}
        <div className="space-y-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">
                Resource <span className="text-pink-600">Not Available</span>
            </h2>
            <p className="text-slate-400 text-base font-medium max-w-sm mx-auto leading-relaxed">
                The requested resource is currently unavailable or has been relocated within the portal.
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <Link 
                to="/" 
                className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 w-full sm:w-auto justify-center"
            >
                <Home size={18} strokeWidth={2.5} />
                Back to Dashboard
            </Link>
            
            <button 
                onClick={() => window.history.back()}
                className="group flex items-center gap-3 bg-white border-2 border-slate-100 text-slate-600 px-8 py-4 rounded-3xl font-black text-sm tracking-widest uppercase hover:border-pink-200 hover:text-pink-600 transition-all active:scale-95 w-full sm:w-auto justify-center"
            >
                <ArrowLeft size={18} strokeWidth={2.5} />
                Go Back
            </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
