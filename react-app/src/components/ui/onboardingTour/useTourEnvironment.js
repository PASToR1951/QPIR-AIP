import { useEffect } from 'react';

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
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
