import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useAccessibility } from '../../context/AccessibilityContext';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTargetElement(target) {
  if (!target) return null;
  return document.querySelector(`[data-tour="${target}"]`);
}

export default function OnboardingTour({
  open,
  title = 'Guided Tour',
  steps = [],
  storageKey,
  onClose,
}) {
  const { settings } = useAccessibility();
  const [requestedStepIndex, setRequestedStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const resolvedStepIndex = useMemo(() => {
    if (!open || steps.length === 0) return -1;
    let nextIndex = requestedStepIndex;
    while (nextIndex < steps.length && !getTargetElement(steps[nextIndex]?.target)) {
      nextIndex += 1;
    }
    return nextIndex < steps.length ? nextIndex : -1;
  }, [open, requestedStepIndex, steps]);

  useEffect(() => {
    if (open && steps.length > 0 && resolvedStepIndex === -1) {
      onClose?.('missing-targets');
    }
  }, [onClose, open, resolvedStepIndex, steps.length]);

  const activeStep = useMemo(
    () => (resolvedStepIndex >= 0 ? steps[resolvedStepIndex] : null),
    [resolvedStepIndex, steps]
  );

  useLayoutEffect(() => {
    if (!open || !activeStep) return undefined;

    const element = getTargetElement(activeStep.target);
    if (!element) return undefined;

    const updateRect = () => {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    };

    element.scrollIntoView({
      block: 'center',
      behavior: settings.reduceMotion ? 'auto' : 'smooth',
    });

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [activeStep, open, settings.reduceMotion]);

  if (!open || !activeStep || !targetRect) return null;

  const highlightStyle = {
    top: Math.max(targetRect.top - 8, 8),
    left: Math.max(targetRect.left - 8, 8),
    width: Math.min(targetRect.width + 16, window.innerWidth - 16),
    height: Math.min(targetRect.height + 16, window.innerHeight - 16),
    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.58)',
  };

  const cardWidth = Math.min(360, window.innerWidth - 32);
  const left = clamp(targetRect.left, 16, window.innerWidth - cardWidth - 16);
  const placeAbove = activeStep.placement === 'top' || activeStep.placement === 'right';
  const cardTop = placeAbove
    ? Math.max(targetRect.top - 176, 16)
    : Math.min(targetRect.bottom + 16, window.innerHeight - 176);

  const finishTour = (reason) => {
    if (storageKey) localStorage.setItem(storageKey, reason);
    onClose?.(reason);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[120] print:hidden">
      <div
        className="absolute rounded-[1.75rem] border-2 border-indigo-400/90 bg-transparent transition-all duration-200"
        style={highlightStyle}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="absolute w-[min(360px,calc(100vw-2rem))] rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl dark:border-dark-border dark:bg-dark-surface"
        style={{
          width: cardWidth,
          top: cardTop,
          left,
          transition: settings.reduceMotion ? 'none' : 'top 180ms ease, left 180ms ease',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
              {title}
            </p>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              {activeStep.title}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-dark-base dark:text-slate-400">
            {resolvedStepIndex + 1} of {steps.length}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {activeStep.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => finishTour('skipped')}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-dark-base dark:hover:text-slate-200"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => {
              if (resolvedStepIndex >= steps.length - 1) {
                finishTour('completed');
                return;
              }
              setRequestedStepIndex(resolvedStepIndex + 1);
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
          >
            {resolvedStepIndex >= steps.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
