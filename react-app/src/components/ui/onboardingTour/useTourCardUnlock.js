import { useEffect, useRef, useState } from 'react';

export function useTourCardUnlock({ open, stepIndex, isInViewport }) {
  const [cardUnlocked, setCardUnlocked] = useState(false);
  const unlockTimerRef = useRef(null);
  const prevOpenRef = useRef(false);

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

  return cardUnlocked;
}
