import React from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Flask } from '@phosphor-icons/react';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';

export default function PracticeIntroCard({ open, tasks, onEnter, onDismiss }) {
  const { settings } = useAccessibility();

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={settings.reduceMotion ? { duration: 0.1 } : { duration: 0.18 }}
          className="fixed inset-0 z-[202] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
        >
          <div
            className="absolute inset-0"
            onClick={onDismiss}
            aria-hidden="true"
          />

          <Motion.div
            initial={settings.reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            transition={settings.reduceMotion ? { duration: 0.1 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/96 shadow-2xl backdrop-blur dark:border-dark-border dark:bg-dark-surface/96"
          >
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
                  <Flask size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                    Practice Mode
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    Try things safely before going live
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Practice Mode lets you walk through real workflows using mock data. Nothing affects actual records, submissions, or other users.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(tasks ?? []).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                      <CheckCircle size={16} weight="fill" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {task.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {task.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-dark-border">
                <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                  No real data is affected. You can exit Practice Mode at any time from the banner at the top of the page.
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-dark-border dark:bg-dark-base dark:text-slate-300 dark:hover:bg-dark-border/60 sm:w-auto sm:rounded-xl sm:py-2.5"
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  onClick={onEnter}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 sm:w-auto sm:rounded-xl sm:py-2.5"
                >
                  Enter Practice Mode
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
