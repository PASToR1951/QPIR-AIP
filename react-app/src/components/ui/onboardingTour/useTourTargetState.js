import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { areRectsEqual, resolveTargetSnapshot } from './dom.js';

export function useTourTargetState({
  open,
  activeStep,
  stepKey,
  reduceMotion,
}) {
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [stepResolved, setStepResolved] = useState(false);
  const [showDetachedFallback, setShowDetachedFallback] = useState(false);
  const lastScrolledStepKeyRef = useRef('');

  const isInViewport = useMemo(() => {
    if (!targetRect) return false;
    return (
      targetRect.top < window.innerHeight &&
      targetRect.bottom > 0 &&
      targetRect.left < window.innerWidth &&
      targetRect.right > 0
    );
  }, [targetRect]);

  const hasResolvedTarget = Boolean(targetElement && targetRect);

  const resetTargetState = useCallback(() => {
    lastScrolledStepKeyRef.current = '';
    setStepResolved(false);
    setShowDetachedFallback(false);
    setTargetElement(null);
    setTargetRect(null);
  }, []);

  const refreshTarget = useCallback(() => {
    if (!open || !activeStep) {
      resetTargetState();
      return;
    }

    const { element: nextElement, rect: nextRect } = resolveTargetSnapshot(activeStep.target);

    setTargetElement(nextElement);
    setTargetRect((previousRect) => (areRectsEqual(previousRect, nextRect) ? previousRect : nextRect));
    setStepResolved(true);
  }, [activeStep, open, resetTargetState]);

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

  useLayoutEffect(() => {
    if (!open || !activeStep || !targetElement || !targetRect) return;
    if (lastScrolledStepKeyRef.current === stepKey) return;

    lastScrolledStepKeyRef.current = stepKey;
    targetElement.scrollIntoView({
      block: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [activeStep, open, reduceMotion, stepKey, targetElement, targetRect]);

  return {
    hasResolvedTarget,
    isInViewport,
    refreshTarget,
    resetTargetState,
    showDetachedFallback,
    stepResolved,
    targetElement,
    targetRect,
  };
}
