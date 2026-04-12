import React from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ArrowRight, Flask, Trophy } from '@phosphor-icons/react';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';

export default function OnboardingCompletionCard({
  open,
  canPractice,
  onGetStarted,
  onTryPractice,
}) {
  const { settings } = useAccessibility();

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={settings.reduceMotion ? { duration: 0.1 } : { duration: 0.18 }}
          className="fixed inset-0 z-[105] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
        >
          <div
            className="absolute inset-0"
            onClick={onGetStarted}
            aria-hidden="true"
          />

          <Motion.div
            initial={settings.reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
            animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={settings.reduceMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/96 shadow-2xl backdrop-blur dark:border-dark-border dark:bg-dark-surface/96"
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />

            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <Trophy size={28} />
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Onboarding complete
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  You know your way around
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  You have completed all the onboarding tasks. The checklist is available in the Help menu whenever you want to revisit it.
                </p>
              </div>

              {canPractice && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                      <Flask size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Ready for a dry run?
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Try a guided practice flow with mock data before using the live workflow.
                      </p>
                      <button
                        type="button"
                        onClick={onTryPractice}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-700 transition-colors hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                      >
                        Try practice mode
                        <ArrowRight size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-dark-border">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 sm:rounded-xl sm:py-2.5"
                >
                  Get started
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
