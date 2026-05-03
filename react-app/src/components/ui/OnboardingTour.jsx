import React from 'react';
import ReactDOM from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';
import { isElementVisible, getTargetElement } from './onboardingTour/dom.js';
import { TourCardContent, MeasuredTourCard } from './onboardingTour/TourCardContent.jsx';
import { useOnboardingTourState } from './onboardingTour/useOnboardingTourState.js';

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingTour({
  open,
  title = 'Guided Tour',
  steps = [],
  storageKey,
  stepStorageKey,
  onClose,
}) {
  const location = useLocation();
  const { settings } = useAccessibility();
  const reduceMotion = settings.reduceMotion;
  const themeName = resolveRouteThemeName(location.pathname);
  const t = THEMES[themeName];
  const {
    activeStep,
    cardRef,
    cardTop,
    cardUnlocked,
    cardWidth,
    cardLeft,
    finishTour,
    handleBack,
    handleNext,
    handleSkipStep,
    highlightHeight,
    highlightLeft,
    highlightTop,
    highlightWidth,
    isInViewport,
    isLastStep,
    isTargetVisible,
    measureCardRef,
    measureCardWidth,
    shouldMountMeasureCard,
    shouldShowCard,
    stepIndex,
    stepResolved,
    waitingMessage,
  } = useOnboardingTourState({
    open,
    steps,
    storageKey,
    stepStorageKey,
    onClose,
    reduceMotion,
  });

  // ── Motion config ───────────────────────────────────────────────────────────

  const spotlightTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

  const cardTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.16, 1, 0.3, 1] };

  // ── Early exit ──────────────────────────────────────────────────────────────

  if (!open || !activeStep || !cardUnlocked || !stepResolved) return null;

  // If the step declares a prerequisiteTarget, the tour card is fully suppressed
  // until that element is visible in the DOM. This prevents tours from bleeding
  // into sub-states of the same route where the target cannot yet exist
  // (e.g. the AIP program-selector stage before a form is loaded).
  if (activeStep.prerequisiteTarget) {
    const prereqEl = getTargetElement(activeStep.prerequisiteTarget);
    if (!isElementVisible(prereqEl)) return null;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return ReactDOM.createPortal(
    <div className="pointer-events-none fixed inset-0 z-[120] print:hidden">

      {shouldMountMeasureCard && (
        <MeasuredTourCard cardRef={measureCardRef} width={measureCardWidth}>
          <TourCardContent
            activeStep={activeStep}
            title={title}
            steps={steps}
            stepIndex={stepIndex}
            t={t}
            isTargetVisible={isTargetVisible}
            waitingMessage={waitingMessage}
            reduceMotion={reduceMotion}
            isLastStep={isLastStep}
            handleBack={handleBack}
            handleNext={handleNext}
            handleSkipStep={handleSkipStep}
            finishTour={finishTour}
          />
        </MeasuredTourCard>
      )}

      {shouldShowCard && isInViewport && (
          <Motion.div
            className={`pointer-events-none rounded-[1.75rem] border-2 ${t.tourSpotlight}`}
            style={{
              position: 'absolute',
              boxShadow: '0 0 0 9999px rgba(15,23,42,0.62)',
            }}
            animate={{ top: highlightTop, left: highlightLeft, width: highlightWidth, height: highlightHeight }}
            transition={spotlightTransition}
          />
      )}

      {/* Tour card */}
      <AnimatePresence>
        {shouldShowCard && (
          <Motion.div
            key="tour-card"
            tabIndex={-1}
            ref={cardRef}
            role="dialog"
            aria-labelledby="tour-step-title"
            aria-describedby="tour-step-desc"
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={cardTransition}
            style={{
              position: 'absolute',
              top: cardTop,
              left: cardLeft,
              width: cardWidth,
            }}
            className="pointer-events-auto relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl outline-none dark:border-dark-border dark:bg-dark-surface"
          >
            <TourCardContent
              activeStep={activeStep}
              title={title}
              steps={steps}
              stepIndex={stepIndex}
              t={t}
              isTargetVisible={isTargetVisible}
              waitingMessage={waitingMessage}
              reduceMotion={reduceMotion}
              isLastStep={isLastStep}
              handleBack={handleBack}
              handleNext={handleNext}
              handleSkipStep={handleSkipStep}
              finishTour={finishTour}
            />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
