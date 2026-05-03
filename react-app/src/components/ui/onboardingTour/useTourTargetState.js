import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { areRectsEqual, resolveTargetSnapshot } from './dom.js';

export function useTourTargetState({
  open,
  activeStep,
  stepKey,
  reduceMotion,
  viewport,
}) {
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [stepResolved, setStepResolved] = useState(false);
  const [showDetachedFallback, setShowDetachedFallback] = useState(false);
  const lastScrolledStepKeyRef = useRef('');

  const isInViewport = useMemo(() => {
    if (!targetRect) return false;
    const visTop = viewport?.offsetTop ?? 0;
    const visLeft = viewport?.offsetLeft ?? 0;
    const visBottom = visTop + (viewport?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 0));
    const visRight = visLeft + (viewport?.width ?? (typeof window !== 'undefined' ? window.innerWidth : 0));
    return (
      targetRect.top < visBottom &&
      targetRect.bottom > visTop &&
      targetRect.left < visRight &&
      targetRect.right > visLeft
    );
  }, [targetRect, viewport?.offsetTop, viewport?.offsetLeft, viewport?.height, viewport?.width]);

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
    if (!open || !activeStep || !targetElement || !targetRect) return undefined;
    if (lastScrolledStepKeyRef.current === stepKey) return undefined;

    lastScrolledStepKeyRef.current = stepKey;

    const safeTop = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--tour-safe-top')
      .trim() || '16px';
    const previousScrollMarginTop = targetElement.style.scrollMarginTop;
    // eslint-disable-next-line react-hooks/immutability -- intentional DOM mutation, restored on cleanup
    targetElement.style.scrollMarginTop = safeTop;

    targetElement.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });

    return () => {
      targetElement.style.scrollMarginTop = previousScrollMarginTop;
    };
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
