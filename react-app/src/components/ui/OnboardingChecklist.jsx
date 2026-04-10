import React, { useEffect } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { CheckCircle, CaretDown, CaretUp, Lifebuoy, ListChecks, XCircle } from '@phosphor-icons/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';

function ProgressRing({ completed, total, theme }) {
  const safeTotal = Math.max(total, 1);
  const circumference = 2 * Math.PI * 17;
  const progress = circumference - (completed / safeTotal) * circumference;

  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <svg className="h-11 w-11 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r="17"
          className="fill-none stroke-slate-200 dark:stroke-dark-border"
          strokeWidth="4"
        />
        <circle
          cx="20"
          cy="20"
          r="17"
          className={`fill-none stroke-current ${theme.tourLabel}`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-black text-slate-700 dark:text-slate-200">
        {completed}/{total}
      </span>
    </div>
  );
}

export default function OnboardingChecklist({
  open,
  hidden,
  tasks,
  completedIds,
  completedCount,
  isComplete,
  onToggle,
  onDismiss,
  onTaskClick,
  onClose,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAccessibility();
  const themeName = resolveRouteThemeName(location.pathname);
  const theme = THEMES[themeName];

  useEffect(() => {
    if (!isComplete || settings.reduceMotion || !open) return undefined;
    const timer = window.setTimeout(() => onClose?.(), 5000);
    return () => window.clearTimeout(timer);
  }, [isComplete, onClose, open, settings.reduceMotion]);

  if (hidden) return null;

  const handleTaskClick = (task) => {
    if (task.route && location.pathname !== task.route) {
      navigate(task.route);
    }
    onTaskClick?.(task);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[103] w-[calc(100vw-2rem)] max-w-sm sm:w-96">
      {!open && (
        <button
          type="button"
          onClick={onToggle}
          className={`ml-auto flex items-center gap-3 rounded-full border border-slate-200 dark:border-dark-border bg-white/95 dark:bg-dark-surface/95 px-4 py-3 shadow-xl ${theme.btnClosed}`}
        >
          <ProgressRing completed={completedCount} total={tasks.length} theme={theme} />
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Onboarding
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isComplete ? 'You’re all set' : 'Continue checklist'}
            </p>
          </div>
          <CaretUp size={16} className="text-slate-400 dark:text-slate-500" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <Motion.div
            initial={settings.reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: settings.reduceMotion ? 0.12 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 dark:border-dark-border bg-white/96 dark:bg-dark-surface/96 shadow-2xl backdrop-blur"
          >
            <div className={`h-1.5 bg-gradient-to-r ${theme.strip}`} />
            <button
              type="button"
              onClick={onToggle}
              className="sm:hidden flex w-full items-center justify-center gap-2 border-b border-slate-100 dark:border-dark-border py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500"
            >
              <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
              Checklist
            </button>

            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <ProgressRing completed={completedCount} total={tasks.length} theme={theme} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${theme.tourLabel}`}>
                    Onboarding Checklist
                  </p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {isComplete ? 'You’re all set!' : 'Finish your first actions'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {isComplete
                      ? `${completedCount}/${tasks.length} tasks done. You can revisit page tours anytime from Help.`
                      : `${tasks.length - completedCount} task${tasks.length - completedCount !== 1 ? 's' : ''} left.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className="hidden sm:inline-flex rounded-xl p-2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Collapse checklist"
                >
                  <CaretDown size={18} />
                </button>
              </div>

              {isComplete ? (
                <div className="mt-5 rounded-[1.5rem] border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={22} className="mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                        Checklist complete
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-700/90 dark:text-emerald-300/80">
                        You’ve completed the core onboarding actions. Use Help for quick tours whenever you need a refresher.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onDismiss}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/70 dark:border-emerald-700/60 bg-white/80 dark:bg-dark-surface/70 px-4 py-2.5 text-sm font-black text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-white dark:hover:bg-dark-surface"
                  >
                    <XCircle size={18} />
                    Dismiss
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {tasks.map((task) => {
                    const done = completedIds.includes(task.id);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => !done && handleTaskClick(task)}
                        className={`flex w-full items-start gap-3 rounded-[1.35rem] border px-4 py-3 text-left transition-colors ${
                          done
                            ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-400'
                        }`}>
                          {done ? <CheckCircle size={18} /> : <ListChecks size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-black ${done ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                            {task.label}
                          </p>
                          <p className={`mt-1 text-sm leading-relaxed ${done ? 'text-emerald-700/90 dark:text-emerald-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            {task.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-dark-border">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Help keeps your page tours available any time.
                </p>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${theme.tourLabel}`}>
                  <Lifebuoy size={14} />
                  Help
                </span>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
