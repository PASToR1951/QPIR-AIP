import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTargetNames(target) {
  if (Array.isArray(target)) return target.filter(Boolean);
  return target ? [target] : [];
}

function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getTargetElement(target) {
  for (const name of getTargetNames(target)) {
    const matches = [...document.querySelectorAll(`[data-tour="${name}"]`)];
    const visibleMatch = matches.find(isElementVisible);
    if (visibleMatch) return visibleMatch;
  }

  return null;
}

function getRectSnapshot(element) {
  if (!element || !isElementVisible(element)) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

function resolveTargetSnapshot(target) {
  const element = getTargetElement(target);
  return {
    element,
    rect: getRectSnapshot(element),
  };
}

function areRectsEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return !a && !b;

  return ['top', 'left', 'width', 'height', 'bottom', 'right']
    .every((key) => Math.abs(a[key] - b[key]) < 0.5);
}

function clampToViewport(position, size, viewportSize, margin) {
  return clamp(position, margin, Math.max(margin, viewportSize - size - margin));
}

function getRectOverlapArea(a, b) {
  const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return overlapWidth * overlapHeight;
}

function getPlacementOrder(placement, targetRect, viewW, viewH) {
  const normalizedPlacement = ['top', 'bottom', 'left', 'right'].includes(placement)
    ? placement
    : 'bottom';
  const oppositePlacement = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }[normalizedPlacement];

  if (normalizedPlacement === 'top' || normalizedPlacement === 'bottom') {
    const sidePlacements = viewW - targetRect.right >= targetRect.left
      ? ['right', 'left']
      : ['left', 'right'];
    return [normalizedPlacement, oppositePlacement, ...sidePlacements];
  }

  const verticalPlacements = viewH - targetRect.bottom >= targetRect.top
    ? ['bottom', 'top']
    : ['top', 'bottom'];
  return [normalizedPlacement, oppositePlacement, ...verticalPlacements];
}

function buildCardCandidate(targetRect, placement, cardW, cardH, viewW, viewH) {
  const MARGIN = 16;
  const GAP = 16;
  const centeredLeft = targetRect.left + targetRect.width / 2 - cardW / 2;
  const centeredTop = targetRect.top + targetRect.height / 2 - cardH / 2;

  let preferredTop = centeredTop;
  let preferredLeft = centeredLeft;

  if (placement === 'top') {
    preferredTop = targetRect.top - cardH - GAP;
  } else if (placement === 'bottom') {
    preferredTop = targetRect.bottom + GAP;
  } else if (placement === 'left') {
    preferredLeft = targetRect.left - cardW - GAP;
  } else if (placement === 'right') {
    preferredLeft = targetRect.right + GAP;
  }

  const top = clampToViewport(preferredTop, cardH, viewH, MARGIN);
  const left = clampToViewport(preferredLeft, cardW, viewW, MARGIN);
  const rect = {
    top,
    left,
    right: left + cardW,
    bottom: top + cardH,
  };

  return {
    placement,
    top,
    left,
    width: cardW,
    overlapArea: getRectOverlapArea(rect, targetRect),
    clampOffset: Math.abs(preferredTop - top) + Math.abs(preferredLeft - left),
  };
}

/**
 * Calculates the tour card position by trying the requested placement first,
 * then nearby fallbacks, and choosing the viewport-safe candidate with the
 * least overlap against the highlighted target.
 */
function getCardPosition(targetRect, placement, cardH, viewW, viewH) {
  const MARGIN = 16;
  const cardW = Math.min(360, viewW - MARGIN * 2);
  const candidates = getPlacementOrder(placement, targetRect, viewW, viewH)
    .map((candidatePlacement, priority) => ({
      priority,
      ...buildCardCandidate(targetRect, candidatePlacement, cardW, cardH, viewW, viewH),
    }));

  const bestCandidate = candidates.reduce((best, candidate) => {
    if (!best) return candidate;
    if (candidate.overlapArea !== best.overlapArea) {
      return candidate.overlapArea < best.overlapArea ? candidate : best;
    }
    if (candidate.clampOffset !== best.clampOffset) {
      return candidate.clampOffset < best.clampOffset ? candidate : best;
    }
    return candidate.priority < best.priority ? candidate : best;
  }, null);

  return {
    top: bestCandidate?.top ?? MARGIN,
    left: bestCandidate?.left ?? MARGIN,
    width: bestCandidate?.width ?? cardW,
  };
}

function getDetachedCardPosition(cardH, viewW, viewH) {
  const MARGIN = 16;
  const cardW = Math.min(360, viewW - MARGIN * 2);
  const left = viewW < 640
    ? clamp((viewW - cardW) / 2, MARGIN, viewW - cardW - MARGIN)
    : viewW - cardW - MARGIN;

  return {
    top: clamp(MARGIN, MARGIN, viewH - cardH - MARGIN),
    left,
    width: cardW,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingTour({
  open,
  title = 'Guided Tour',
  steps = [],
  storageKey,
  onClose,
}) {
  const location = useLocation();
  const { settings } = useAccessibility();
  const reduceMotion = settings.reduceMotion;
  const themeName = resolveRouteThemeName(location.pathname);
  const t = THEMES[themeName];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [cardUnlocked, setCardUnlocked] = useState(false);
  const [stepResolved, setStepResolved] = useState(false);
  const [showDetachedFallback, setShowDetachedFallback] = useState(false);
  const [cardH, setCardH] = useState(0);
  const [measuredStepKey, setMeasuredStepKey] = useState('');
  const cardRef = useRef(null);
  const measureCardRef = useRef(null);
  const lastScrolledStepKeyRef = useRef('');
  const unlockTimerRef = useRef(null);
  const prevOpenRef = useRef(false);

  // ── Derived state ───────────────────────────────────────────────────────────

  const stepIndex = useMemo(
    () => clamp(currentStepIndex, 0, Math.max(steps.length - 1, 0)),
    [currentStepIndex, steps.length]
  );

  const activeStep = useMemo(() => {
    if (!open || steps.length === 0) return null;
    return steps[stepIndex] ?? null;
  }, [open, stepIndex, steps]);

  const stepKey = useMemo(() => {
    if (!activeStep) return '';
    return `${stepIndex}:${getTargetNames(activeStep.target).join('|')}`;
  }, [activeStep, stepIndex]);

  const isLastStep = stepIndex === steps.length - 1;
  const isTargetVisible = Boolean(targetRect);
  const hasResolvedTarget = Boolean(targetElement && targetRect);

  // True only when the element is both CSS-visible AND currently within the viewport.
  // Spotlight and card anchoring only activate when this is true; elements that are
  // found in the DOM but scrolled off-screen use the detached fallback position instead.
  const isInViewport = useMemo(() => {
    if (!targetRect) return false;
    return (
      targetRect.top < window.innerHeight &&
      targetRect.bottom > 0 &&
      targetRect.left < window.innerWidth &&
      targetRect.right > 0
    );
  }, [targetRect]);

  // ── Readiness gate ───────────────────────────────────────────────────────────
  // Hold off rendering the card on step 0 until the target element is visible,
  // with a 3.5 s fallback so the "not visible" hint is a last resort, not the
  // first thing the user sees.

  useEffect(() => {
    let resetTimer = 0;

    if (open && !prevOpenRef.current) {
      prevOpenRef.current = true;
      resetTimer = window.setTimeout(() => setCardUnlocked(false), 0);
      unlockTimerRef.current = window.setTimeout(() => setCardUnlocked(true), 3500);
    }
    if (!open && prevOpenRef.current) {
      prevOpenRef.current = false;
      resetTimer = window.setTimeout(() => setCardUnlocked(false), 0);
      window.clearTimeout(unlockTimerRef.current);
    }

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(unlockTimerRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!(open && stepIndex === 0 && isInViewport && !cardUnlocked)) return undefined;

    window.clearTimeout(unlockTimerRef.current);
    const unlockNowTimer = window.setTimeout(() => setCardUnlocked(true), 0);
    return () => window.clearTimeout(unlockNowTimer);
  }, [open, stepIndex, isInViewport, cardUnlocked]);

  const waitingMessage = activeStep?.missingTargetHint
    ?? 'This section is not visible yet. Use the page behind this card to open it, then continue the tour.';

  const primaryActionLabel = isTargetVisible
    ? (isLastStep ? 'Done' : 'Next →')
    : (isLastStep ? 'Finish' : 'Skip step');
  const shouldUseDetachedFallback = !isInViewport && (!hasResolvedTarget || showDetachedFallback);
  const canPlaceCard = isInViewport || shouldUseDetachedFallback;
  const cardIsMeasured = measuredStepKey === stepKey && cardH > 0;
  const shouldMountMeasureCard = open && Boolean(activeStep) && cardUnlocked && stepResolved;
  const shouldShowCard = shouldMountMeasureCard && canPlaceCard && cardIsMeasured;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const finishTour = useCallback(
    (reason) => {
      if (storageKey) localStorage.setItem(storageKey, reason);
      onClose?.(reason);
    },
    [storageKey, onClose]
  );

  const goToNextStep = useCallback(() => {
    if (isLastStep) {
      finishTour('completed');
      return;
    }

    lastScrolledStepKeyRef.current = '';
    setStepResolved(false);
    setShowDetachedFallback(false);
    setMeasuredStepKey('');
    setCardH(0);
    setTargetElement(null);
    setTargetRect(null);
    setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }, [finishTour, isLastStep, steps.length]);

  const handleNext = useCallback(() => {
    if (!isTargetVisible) return;
    goToNextStep();
  }, [goToNextStep, isTargetVisible]);

  const handleSkipStep = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  const handleBack = useCallback(() => {
    lastScrolledStepKeyRef.current = '';
    setStepResolved(false);
    setShowDetachedFallback(false);
    setMeasuredStepKey('');
    setCardH(0);
    setTargetElement(null);
    setTargetRect(null);
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const refreshTarget = useCallback(() => {
    if (!open || !activeStep) {
      setStepResolved(false);
      setShowDetachedFallback(false);
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    const { element: nextElement, rect: nextRect } = resolveTargetSnapshot(activeStep.target);

    setTargetElement(nextElement);
    setTargetRect((prev) => (areRectsEqual(prev, nextRect) ? prev : nextRect));
    setStepResolved(true);
  }, [activeStep, open]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let syncTimer = 0;

    if (!open || !activeStep || !stepResolved) {
      syncTimer = window.setTimeout(() => setShowDetachedFallback(false), 0);
      return () => window.clearTimeout(syncTimer);
    }

    if (!hasResolvedTarget) {
      syncTimer = window.setTimeout(() => setShowDetachedFallback(true), 0);
      return () => window.clearTimeout(syncTimer);
    }

    if (isInViewport) {
      syncTimer = window.setTimeout(() => setShowDetachedFallback(false), 0);
      return () => window.clearTimeout(syncTimer);
    }

    syncTimer = window.setTimeout(() => setShowDetachedFallback(false), 0);
    const fallbackTimer = window.setTimeout(() => {
      setShowDetachedFallback(true);
    }, 1200);

    return () => {
      window.clearTimeout(syncTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [open, activeStep, stepResolved, hasResolvedTarget, isInViewport, stepKey]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || !activeStep) return undefined;

    const handleKey = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;

      if (e.key === 'Escape') finishTour('skipped');
      else if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      else if (e.key === 'ArrowLeft') handleBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, activeStep, finishTour, handleNext, handleBack]);

  // Body scroll lock — prevent the page from scrolling behind the tour overlay
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Focus trap — cycle Tab within the card; focus primary button on mount
  useEffect(() => {
    if (!shouldShowCard || !cardRef.current) return undefined;
    const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])';
    const elements = [...cardRef.current.querySelectorAll(FOCUSABLE)];
    if (!elements.length) return undefined;

    elements[elements.length - 1]?.focus();

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const idx = elements.indexOf(document.activeElement);
      elements[
        e.shiftKey
          ? (idx - 1 + elements.length) % elements.length
          : (idx + 1) % elements.length
      ]?.focus();
    };
    cardRef.current.addEventListener('keydown', trap);
    const el = cardRef.current;
    return () => el.removeEventListener('keydown', trap);
  }, [shouldShowCard, stepIndex]);

  useEffect(() => {
    if (!open || !activeStep) return undefined;

    let frameId = 0;
    const scheduleRefresh = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(refreshTarget);
    };

    scheduleRefresh();

    const mutationObserver = new MutationObserver(scheduleRefresh);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'data-tour'],
    });

    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('scroll', scheduleRefresh, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('scroll', scheduleRefresh, true);
    };
  }, [open, activeStep, refreshTarget]);

  useEffect(() => {
    if (!open || !targetElement || typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver(() => refreshTarget());
    resizeObserver.observe(targetElement);

    return () => resizeObserver.disconnect();
  }, [open, targetElement, refreshTarget]);

  // Scroll the latest visible target into view once per step
  useLayoutEffect(() => {
    if (!open || !activeStep || !targetElement || !targetRect) return;
    if (lastScrolledStepKeyRef.current === stepKey) return;

    lastScrolledStepKeyRef.current = stepKey;
    targetElement.scrollIntoView({
      block: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [activeStep, open, reduceMotion, stepKey, targetElement, targetRect]);

  // Measure the card's actual rendered height so position is exact.
  // useLayoutEffect fires before the browser paints, so a setCardH call here
  // causes a synchronous re-render — the browser only ever paints the correctly
  // positioned version.
  useLayoutEffect(() => {
    if (!measureCardRef.current || !shouldMountMeasureCard) return;
    const h = measureCardRef.current.getBoundingClientRect().height;
    if (h > 0) {
      if (Math.abs(cardH - h) > 0.5) setCardH(h);
      if (measuredStepKey !== stepKey) setMeasuredStepKey(stepKey);
    }
  }, [shouldMountMeasureCard, cardH, measuredStepKey, stepKey]);

  // ── Layout calculations ─────────────────────────────────────────────────────

  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const measureCardWidth = Math.min(360, viewW - 32);

  const highlightTop = isInViewport ? Math.max(targetRect.top - 8, 8) : 0;
  const highlightLeft = isInViewport ? Math.max(targetRect.left - 8, 8) : 0;
  const highlightWidth = isInViewport ? Math.min(targetRect.width + 16, viewW - 16) : 0;
  const highlightHeight = isInViewport ? Math.min(targetRect.height + 16, viewH - 16) : 0;

  const resolvedCardH = cardH || (isInViewport ? 240 : 280);
  const { top: cardTop, left: cardLeft, width: cardWidth } = isInViewport
    ? getCardPosition(targetRect, activeStep.placement, resolvedCardH, viewW, viewH)
    : getDetachedCardPosition(resolvedCardH, viewW, viewH);

  // ── Motion config ───────────────────────────────────────────────────────────

  const spotlightTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

  const cardTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.16, 1, 0.3, 1] };

  const stepTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: 'easeInOut' };

  const progressTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: 'easeOut' };

  const renderStepBody = (animated) => {
    const StepWrapper = animated ? Motion.div : 'div';
    const stepWrapperProps = animated
      ? {
          key: stepIndex,
          initial: reduceMotion ? false : { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          exit: reduceMotion ? {} : { opacity: 0, y: -6 },
          transition: stepTransition,
        }
      : {};

    return (
      <StepWrapper {...stepWrapperProps}>
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

  const renderTourCardInner = (animated) => (
    <>
      <div className="pointer-events-none absolute inset-0" style={t.tourCardAccentStyle} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-white/15 to-transparent dark:from-white/[0.03] dark:via-transparent dark:to-transparent" />

      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-[1.75rem] bg-slate-100 dark:bg-dark-base">
        {animated ? (
          <Motion.div
            className={`h-full ${t.tourProgress}`}
            initial={{ width: 0 }}
            animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            transition={progressTransition}
          />
        ) : (
          <div
            className={`h-full ${t.tourProgress}`}
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        )}
      </div>

      {animated && (
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {`Step ${stepIndex + 1} of ${steps.length}: ${activeStep.title}${isTargetVisible ? '' : '. Waiting for this section to appear.'}`}
        </span>
      )}

      <div className="relative z-10 px-5 pt-6 pb-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.tourLabel}`}>
            {title}
          </p>
          <div className="flex items-center gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <div
                key={i}
                className={[
                  'rounded-full transition-all duration-200',
                  i === stepIndex
                    ? `w-4 h-1.5 ${t.tourActiveDot}`
                    : 'w-1.5 h-1.5 bg-slate-200 dark:bg-dark-border',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {animated ? (
          <AnimatePresence mode="wait">
            {renderStepBody(true)}
          </AnimatePresence>
        ) : (
          renderStepBody(false)
        )}

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
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -left-[10000px] top-0 invisible"
          style={{ width: measureCardWidth }}
        >
          <div
            ref={measureCardRef}
            className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl outline-none dark:border-dark-border dark:bg-dark-surface"
          >
            {renderTourCardInner(false)}
          </div>
        </div>
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
            {renderTourCardInner(true)}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
