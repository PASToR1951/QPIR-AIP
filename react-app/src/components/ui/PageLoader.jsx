import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const logos = [
  { src: '/AIP-PIR-logo.png', alt: 'AIP-PIR Logo' },
  { src: '/DepEd_Seal.webp', alt: 'DepEd Seal' },
  { src: '/DepEd NIR Logo.webp', alt: 'DepEd NIR Logo' },
  { src: '/Division_Logo.webp', alt: 'Division Logo' }
];

export const PageLoader = ({ message = "Loading..." }) => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    // Preload images
    logos.forEach(logo => {
      const img = new Image();
      img.src = logo.src;
    });

    const interval = setInterval(() => {
      setCurrentLogoIndex((prev) => (prev + 1) % logos.length);
    }, 2500); // Change logo every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-dark-base z-[100] flex flex-col items-center justify-center">
      {/* Grid Background Overlay */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_130%)] pointer-events-none opacity-30"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-400/20 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="h-32 flex items-center justify-center mb-8 relative w-full">
          <AnimatePresence>
            <motion.img
              key={currentLogoIndex}
              src={logos[currentLogoIndex].src}
              alt={logos[currentLogoIndex].alt}
              className="h-24 w-auto drop-shadow-xl absolute object-contain"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </AnimatePresence>
        </div>
        
        {/* Loading Spinner and Text */}
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">
            {message}
            </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;