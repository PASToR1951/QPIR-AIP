import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getTargetNames } from './dom.js';
import { getCardPosition, getDetachedCardPosition } from './layout.js';
import { useTourCardUnlock } from './useTourCardUnlock.js';
import { useTourEnvironment } from './useTourEnvironment.js';
import { useTourTargetState } from './useTourTargetState.js';

export function useOnboardingTourState({
  open,
  steps,
  storageKey,
  onClose,
  reduceMotion,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cardH, setCardH] = useState(0);
  const [measuredStepKey, setMeasuredStepKey] = useState('');
  const cardRef = useRef(null);
  const measureCardRef = useRef(null);

  const stepIndex = useMemo(
    () => Math.min(Math.max(currentStepIndex, 0), Math.max(steps.length - 1, 0)),
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
  const waitingMessage = activeStep?.missingTargetHint
    ?? 'This section is not visible yet. Use the page behind this card to open it, then continue the tour.';

  const finishTour = useCallback((reason) => {
    if (storageKey) localStorage.setItem(storageKey, reason);
    onClose?.(reason);
  }, [storageKey, onClose]);

  const {
    hasResolvedTarget,
    isInViewport,
    resetTargetState,
    showDetachedFallback,
    stepResolved,
    targetRect,
  } = useTourTargetState({
    open,
    activeStep,
    stepKey,
    reduceMotion,
  });

  const isTargetVisible = Boolean(targetRect);

  const resetForStepChange = useCallback(() => {
    setMeasuredStepKey('');
    setCardH(0);
    resetTargetState();
  }, [resetTargetState]);

  const goToNextStep = useCallback(() => {
    if (isLastStep) {
      finishTour('completed');
      return;
    }

    resetForStepChange();
    setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }, [finishTour, isLastStep, resetForStepChange, steps.length]);

  const handleNext = useCallback(() => {
    if (!isTargetVisible) return;
    goToNextStep();
  }, [goToNextStep, isTargetVisible]);

  const handleSkipStep = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  const handleBack = useCallback(() => {
    resetForStepChange();
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }, [resetForStepChange]);

  const cardUnlocked = useTourCardUnlock({
    open,
    stepIndex,
    isInViewport,
  });

  const shouldUseDetachedFallback = !isInViewport && (!hasResolvedTarget || showDetachedFallback);
  const canPlaceCard = isInViewport || shouldUseDetachedFallback;
  const shouldMountMeasureCard = open && Boolean(activeStep) && cardUnlocked && stepResolved;
  const cardIsMeasured = measuredStepKey === stepKey && cardH > 0;
  const shouldShowCard = shouldMountMeasureCard && canPlaceCard && cardIsMeasured;

  useTourEnvironment({
    open,
    activeStep,
    finishTour,
    handleNext,
    handleBack,
    cardRef,
    shouldShowCard,
    stepIndex,
  });

  useLayoutEffect(() => {
    if (!measureCardRef.current || !shouldMountMeasureCard) return;
    const height = measureCardRef.current.getBoundingClientRect().height;
    if (height > 0) {
      if (Math.abs(cardH - height) > 0.5) setCardH(height);
      if (measuredStepKey !== stepKey) setMeasuredStepKey(stepKey);
    }
  }, [shouldMountMeasureCard, cardH, measuredStepKey, stepKey]);

  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const measureCardWidth = Math.min(360, viewW - 32);

  const highlightTop = isInViewport ? Math.max(targetRect.top - 8, 8) : 0;
  const highlightLeft = isInViewport ? Math.max(targetRect.left - 8, 8) : 0;
  const highlightWidth = isInViewport ? Math.min(targetRect.width + 16, viewW - 16) : 0;
  const highlightHeight = isInViewport ? Math.min(targetRect.height + 16, viewH - 16) : 0;

  const resolvedCardH = cardH || (isInViewport ? 240 : 280);
  const { top: cardTop, left: cardLeft, width: cardWidth } = isInViewport
    ? getCardPosition(targetRect, activeStep?.placement, resolvedCardH, viewW, viewH)
    : getDetachedCardPosition(resolvedCardH, viewW, viewH);

  return {
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
    isTargetVisible: Boolean(targetRect),
    measureCardRef,
    measureCardWidth,
    shouldMountMeasureCard,
    shouldShowCard,
    stepIndex,
    stepResolved,
    steps,
    waitingMessage,
  };
}
