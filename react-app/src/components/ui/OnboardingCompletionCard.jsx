import React, { useEffect } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ArrowRight, Flask, Trophy, Sparkle } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';

export default function OnboardingCompletionCard({
  open,
  canPractice,
  onGetStarted,
  onTryPractice,
}) {
  const { settings } = useAccessibility();

  const containerVariants = settings.reduceMotion ? {} : {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = settings.reduceMotion ? {} : {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    if (open && !settings.reduceMotion) {
      const duration = 2500;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(confettiInterval);
        }

        const particleCount = 40 * (timeLeft / duration);
        
        confetti({
          particleCount,
          angle: 60,
          spread: 55,
          origin: { x: -0.1, y: 0.7 },
          colors: ['#34d399', '#fcd34d', '#2dd4bf', '#fb923c']
        });
        
        confetti({
          particleCount,
          angle: 120,
          spread: 55,
          origin: { x: 1.1, y: 0.7 },
          colors: ['#34d399', '#fcd34d', '#2dd4bf', '#fb923c']
        });
      }, 250);

      return () => clearInterval(confettiInterval);
    }
  }, [open, settings.reduceMotion]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={settings.reduceMotion ? { duration: 0.1 } : { duration: 0.3 }}
          className="fixed inset-0 z-[105] flex items-end justify-center bg-slate-900/40 p-4 pt-10 backdrop-blur-md sm:items-center sm:p-4"
        >
          <div
            className="absolute inset-0"
            onClick={onGetStarted}
            aria-hidden="true"
          />

          <Motion.div
            initial={settings.reduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
            transition={settings.reduceMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80"
          >
            {/* Background dynamic glow elements */}
            <div className="pointer-events-none absolute -left-20 -top-20 z-0 h-48 w-48 rounded-full bg-emerald-400/30 blur-[64px] dark:bg-emerald-500/20" />
            <div className="pointer-events-none absolute -right-20 top-20 z-0 h-48 w-48 rounded-full bg-teal-400/20 blur-[64px] dark:bg-teal-500/20" />
            <div className="pointer-events-none absolute -bottom-20 left-20 z-0 h-48 w-48 rounded-full bg-amber-400/10 blur-[64px] dark:bg-amber-500/10" />

            <div className="relative z-10 p-8 sm:p-10">
              <Motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col items-center text-center"
              >
                {/* Trophy Graphic */}
                <Motion.div variants={itemVariants} className="relative mb-8">
                  {!settings.reduceMotion && (
                    <>
                      <Motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                        className="absolute -inset-10 rounded-full border border-dashed border-emerald-500/30 dark:border-emerald-400/20"
                      />
                      <Motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute -inset-6 rounded-full border border-emerald-500/20 dark:border-emerald-400/10"
                      />
                      <Motion.div 
                        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -inset-2 rounded-full bg-emerald-400/50 blur-2xl dark:bg-emerald-500/30"
                      />
                    </>
                  )}
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-white/60 dark:ring-slate-900/50">
                    <Trophy size={40} weight="duotone" />
                    
                    {/* Sparkles */}
                    {!settings.reduceMotion && (
                      <>
                        <Motion.div 
                          animate={{ y: [0, -6, 0], opacity: [0, 1, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
                          className="absolute -right-3 -top-3 text-amber-300 drop-shadow-md"
                        >
                          <Sparkle size={20} weight="fill" />
                        </Motion.div>
                        <Motion.div 
                          animate={{ y: [0, 4, 0], opacity: [0, 1, 0] }}
                          transition={{ duration: 3, repeat: Infinity, delay: 1.2, ease: "easeInOut" }}
                          className="absolute -bottom-2 -left-4 text-emerald-100 drop-shadow-md"
                        >
                          <Sparkle size={16} weight="fill" />
                        </Motion.div>
                      </>
                    )}
                  </div>
                </Motion.div>

                <Motion.div variants={itemVariants}>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    Onboarding Complete
                  </p>
                  <h2 className="mb-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    You're all set!
                  </h2>
                  <p className="mb-8 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    You've mastered the basics. The checklist is always available in the Help menu if you need a refresher.
                  </p>
                </Motion.div>

                {canPractice && (
                  <Motion.div variants={itemVariants} className="w-full">
                    <div className="group relative mb-8 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 dark:border-amber-500/20 dark:from-amber-950/40 dark:to-orange-950/20">
                      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-400/20 blur-[20px] transition-transform duration-500 group-hover:scale-150 dark:bg-amber-500/10" />
                      <div className="relative flex items-start gap-4 text-left">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                          <Flask size={24} weight="duotone" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Ready for a dry run?
                          </h3>
                          <p className="mt-1 mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            Try our guided practice flow using mock data to build confidence before going live.
                          </p>
                          <button
                            type="button"
                            onClick={onTryPractice}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-amber-700 shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:shadow dark:bg-white/10 dark:text-amber-300 dark:ring-white/10 dark:hover:bg-white/20"
                          >
                            Try practice mode
                            <ArrowRight size={12} weight="bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Motion.div>
                )}

                <Motion.div variants={itemVariants} className="w-full">
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:hover:shadow-white/10"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Continue
                      <ArrowRight size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </button>
                </Motion.div>
              </Motion.div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
