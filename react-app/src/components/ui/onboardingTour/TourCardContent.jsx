import React from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';

export function TourCardContent({
  activeStep,
  title,
  steps,
  stepIndex,
  t,
  isTargetVisible,
  waitingMessage,
  reduceMotion,
  isLastStep,
  handleBack,
  handleNext,
  handleSkipStep,
  finishTour,
}) {
  const primaryActionLabel = isTargetVisible
    ? (isLastStep ? 'Done' : 'Next →')
    : (isLastStep ? 'Finish' : 'Skip step');

  const stepTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: 'easeInOut' };

  const progressTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: 'easeOut' };

  const renderStepBody = (animated) => {
    const StepWrapper = animated ? Motion.div : 'div';
    const stepAnimProps = animated
      ? {
          initial: reduceMotion ? false : { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          exit: reduceMotion ? {} : { opacity: 0, y: -6 },
          transition: stepTransition,
        }
      : {};

    return (
      <StepWrapper key={animated ? stepIndex : undefined} {...stepAnimProps}>
        {activeStep.icon && (
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${t.tourIconShell}`}>
            {activeStep.icon}
          </div>
        )}

        <h3
          id="tour-step-title"
          className="text-[1.05rem] font-black tracking-tight text-slate-900 dark:text-slate-100"
        >
          {activeStep.title}
        </h3>

        <p
          id="tour-step-desc"
          className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        >
          {activeStep.description}
        </p>

        {!isTargetVisible && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {waitingMessage}
          </div>
        )}
      </StepWrapper>
    );
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={t.tourCardAccentStyle} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-white/15 to-transparent dark:from-white/[0.03] dark:via-transparent dark:to-transparent" />

      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-[1.75rem] bg-slate-100 dark:bg-dark-base">
        <Motion.div
          className={`h-full ${t.tourProgress}`}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          transition={progressTransition}
        />
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {`Step ${stepIndex + 1} of ${steps.length}: ${activeStep.title}${isTargetVisible ? '' : '. Waiting for this section to appear.'}`}
      </span>

      <div className="relative z-10 px-5 pt-6 pb-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.tourLabel}`}>
            {title}
          </p>
          <div className="flex items-center gap-1" aria-hidden="true">
            {steps.map((_, index) => (
              <div
                key={index}
                className={[
                  'rounded-full transition-all duration-200',
                  index === stepIndex
                    ? `w-4 h-1.5 ${t.tourActiveDot}`
                    : 'w-1.5 h-1.5 bg-slate-200 dark:bg-dark-border',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {renderStepBody(true)}
        </AnimatePresence>

        <div className="mt-5 flex items-center gap-2">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go to previous step"
              className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-dark-base dark:hover:text-slate-200"
            >
              ← Back
            </button>
          ) : (
            <div className="w-[68px] shrink-0" aria-hidden="true" />
          )}

          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => finishTour('skipped')}
              aria-label="Skip tour"
              className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-base dark:hover:text-slate-200"
            >
              Skip
            </button>
          </div>

          <button
            type="button"
            onClick={isTargetVisible ? handleNext : handleSkipStep}
            aria-label={isTargetVisible ? (isLastStep ? 'Finish tour' : 'Next step') : 'Skip this step'}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all focus-visible:outline focus-visible:outline-2 ${t.focusRing} ${t.tourPrimary}`}
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export function MeasuredTourCard({ cardRef, width, children }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -left-[10000px] top-0 invisible"
      style={{ width }}
    >
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl outline-none dark:border-dark-border dark:bg-dark-surface"
      >
        {children}
      </div>
    </div>
  );
}
