import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  CaretDown,
  CaretUp,
  CheckCircle,
  Lifebuoy,
  ListChecks,
  XCircle,
} from '@phosphor-icons/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';
import { useViewportSize } from './onboardingTour/useViewportSize.js';

function SegmentedProgress({ completed, total, theme, compact = false }) {
  if (total === 0) return null;

  return (
    <div className={`flex w-full ${compact ? 'gap-1' : 'gap-1'}`}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`flex-1 rounded-full transition-all duration-300 ${
            compact ? 'h-1' : 'h-1.5'
          } ${
            index < completed
              ? `${theme.tourProgress}`
              : 'bg-slate-200 dark:bg-dark-border'
          }`}
        />
      ))}
    </div>
  );
}

function ChecklistTaskButton({ task, index, done, isNext, theme, onClick }) {
  const stepNumber = `${index + 1}`.padStart(2, '0');

  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition-all ${
        done
          ? 'cursor-pointer border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/15 dark:hover:border-emerald-600/60'
          : isNext
            ? 'border-slate-300 bg-white shadow-sm hover:shadow-md dark:border-slate-500 dark:bg-dark-surface'
            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-700 dark:bg-dark-base/50 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold ${
            done
              ? 'border-emerald-200 bg-emerald-100 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300'
              : isNext
                ? `border-transparent ${theme.tourIconShell}`
                : 'border-slate-200 bg-white text-slate-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-400'
          }`}
        >
          {done ? <CheckCircle size={14} weight="fill" /> : stepNumber}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={`text-sm font-medium ${
                done
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {task.label}
            </p>
            {isNext && !done && (
              <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${theme.tab}`}>
                Next
              </span>
            )}
          </div>

          <p
            className={`mt-0.5 text-xs leading-relaxed ${
              done
                ? 'text-emerald-600/70 dark:text-emerald-300/60'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {task.description}
          </p>
        </div>
      </div>
    </button>
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
  sidebarOffset = false,
  hidePill = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAccessibility();
  const viewport = useViewportSize();
  const isMobile = viewport.width < 640;
  const themeName = resolveRouteThemeName(location.pathname);
  const theme = THEMES[themeName];
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    if (isMobile) return undefined;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, onClose, isMobile]);

  if (hidden) return null;

  const handleTaskClick = (task) => {
    const isDone = completedIds.includes(task.id);
    if (!isDone && task.route && location.pathname !== task.route) {
      navigate(task.route);
    }
    onTaskClick?.(task);
  };

  const remaining = tasks.length - completedCount;
  const nextTask = tasks.find((task) => !completedIds.includes(task.id)) ?? null;
  const shellClasses = open
    ? 'w-full rounded-2xl border border-slate-300 shadow-xl dark:border-slate-600'
    : 'w-fit max-w-full rounded-xl border border-slate-300 shadow-lg hover:shadow-xl dark:border-slate-600';

  if (!open && hidePill) return null;

  return (
    <div ref={containerRef} className={`fixed bottom-5 z-[103] ${open ? 'w-[calc(100vw-2rem)] max-w-sm sm:w-80' : 'w-auto max-w-[calc(100vw-5rem)] sm:max-w-sm'} ${sidebarOffset ? 'left-5 lg:left-[248px]' : 'left-5'}`}>
      <Motion.div
        layout={!settings.reduceMotion}
        initial={false}
        transition={settings.reduceMotion ? { duration: 0.1 } : {
          layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
        }}
        className={`origin-bottom-left overflow-hidden bg-white text-left dark:bg-dark-surface ${shellClasses}`}
      >
        <AnimatePresence initial={false} mode="wait">
          {!open && !hidePill && (
            <Motion.button
              key="pill"
              type="button"
              onClick={onToggle}
              initial={settings.reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={settings.reduceMotion ? { duration: 0.1 } : {
                opacity: { duration: 0.14, ease: 'easeInOut' },
                scale: { duration: 0.16, ease: 'easeInOut' },
              }}
              className="w-full text-left"
            >
              <div className="flex items-center gap-2.5 px-2.5 py-2 sm:px-3.5 sm:py-2.5">
                <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${theme.tourIconShell}`}>
                  <ListChecks size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Onboarding
                  </p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {isComplete ? "You're all set" : `${completedCount} of ${tasks.length} done`}
                  </p>
                  <div className="mt-1.5">
                    <SegmentedProgress
                      completed={completedCount}
                      total={tasks.length}
                      theme={theme}
                      compact
                    />
                  </div>
                </div>

                <CaretUp size={13} className="ml-auto shrink-0 text-slate-400 dark:text-slate-500" />
              </div>
            </Motion.button>
          )}

          {open && (
            <Motion.div
              key="panel"
              initial={settings.reduceMotion ? false : { opacity: 0, scale: 0.985 }}
              animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
              transition={settings.reduceMotion ? { duration: 0.1 } : {
                opacity: { duration: 0.16, ease: 'easeInOut' },
                scale: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
              }}
              drag={isMobile && !settings.reduceMotion ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) {
                  onClose?.();
                }
              }}
              className="w-full touch-pan-y"
            >
              <button
                type="button"
                onClick={onToggle}
                aria-label="Collapse checklist"
                className="flex min-h-11 w-full items-center justify-center border-b border-slate-200 py-2 dark:border-slate-700 sm:hidden"
              >
                <span className="h-1 w-8 rounded-full bg-slate-300 dark:bg-slate-600" />
              </button>

              <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme.tourIconShell}`}>
                    <ListChecks size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${theme.tourLabel}`}>
                      Onboarding
                    </p>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {isComplete ? "You're all set!" : 'Finish your first actions'}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={onToggle}
                    className="hidden sm:inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-dark-base hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Collapse checklist"
                  >
                    <CaretDown size={14} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {isComplete ? 'All done' : `${remaining} remaining`}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {completedCount}/{tasks.length}
                    </span>
                  </div>
                  <SegmentedProgress
                    completed={completedCount}
                    total={tasks.length}
                    theme={theme}
                  />
                </div>

                {/* Task list or completion */}
                {isComplete ? (
                  <div className="mt-4 rounded-xl border border-emerald-100 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/15 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                          All done
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-300/70">
                          Page tours stay available in Help whenever you need a refresher.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onDismiss}
                      className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-700/50 bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 dark:border-emerald-700/50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      <CheckCircle size={15} weight="fill" />
                      Got it
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-1.5">
                    {tasks.map((task, index) => (
                      <ChecklistTaskButton
                        key={task.id}
                        task={task}
                        index={index}
                        done={completedIds.includes(task.id)}
                        isNext={nextTask?.id === task.id}
                        theme={theme}
                        onClick={handleTaskClick}
                      />
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Page tours available in Help anytime.
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${theme.tourLabel}`}>
                    <Lifebuoy size={11} />
                    Help
                  </span>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.div>
    </div>
  );
}
