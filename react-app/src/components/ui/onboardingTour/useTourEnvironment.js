import { useEffect, useRef } from 'react';

export function useTourEnvironment({
  open,
  activeStep,
  finishTour,
  handleNext,
  handleBack,
  cardRef,
  shouldShowCard,
  stepIndex,
}) {
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocusedRef.current = document.activeElement;
    return () => {
      const target = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (!target || !document.body.contains(target)) return;
      if (typeof target.focus !== 'function') return;
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
    };
  }, [open]);
  useEffect(() => {
    if (!open || !activeStep) return undefined;

    const handleKey = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;

      if (event.key === 'Escape') finishTour('skipped');
      else if (event.key === 'ArrowRight' || event.key === 'Enter') handleNext();
      else if (event.key === 'ArrowLeft') handleBack();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, activeStep, finishTour, handleNext, handleBack]);

  useEffect(() => {
    if (!open) return undefined;

    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!shouldShowCard || !cardRef.current) return undefined;

    const focusable = 'button, [href], [tabindex]:not([tabindex="-1"])';
    const elements = [...cardRef.current.querySelectorAll(focusable)];
    if (!elements.length) return undefined;

    elements[elements.length - 1]?.focus();

    const trap = (event) => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      const index = elements.indexOf(document.activeElement);
      elements[
        event.shiftKey
          ? (index - 1 + elements.length) % elements.length
          : (index + 1) % elements.length
      ]?.focus();
    };

    cardRef.current.addEventListener('keydown', trap);
    const currentCard = cardRef.current;
    return () => currentCard.removeEventListener('keydown', trap);
  }, [shouldShowCard, stepIndex, cardRef]);
}
