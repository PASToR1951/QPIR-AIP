import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XCircle } from '@phosphor-icons/react';
import { useAnchoredPosition } from './onboardingTour/useAnchoredPosition.js';

export default function OnboardingHint({
  hintId,
  target,
  title,
  description,
  relatedTaskLabel,
  onDismiss,
}) {
  const position = useAnchoredPosition({ target, enabled: Boolean(target) });

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onDismiss?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDismiss]);

  if (!position) return null;

  const titleId = `onboarding-hint-title-${hintId}`;
  const descId = `onboarding-hint-desc-${hintId}`;

  return ReactDOM.createPortal(
    <div
      role="tooltip"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-live="polite"
      className="fixed z-[102] rounded-2xl border border-slate-200 dark:border-dark-border bg-white/96 dark:bg-dark-surface/96 p-4 shadow-xl backdrop-blur"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        First Action Hint
      </p>
      <h4
        id={titleId}
        className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100"
      >
        {title}
      </h4>
      <p
        id={descId}
        className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
      >
        {description}
      </p>
      {relatedTaskLabel && (
        <p className="mt-3 text-xs font-bold text-slate-400 dark:text-slate-500">
          Related checklist task: {relatedTaskLabel}
        </p>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss hint"
        className="mt-3 inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl px-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
      >
        <XCircle size={14} />
        Dismiss
      </button>
    </div>,
    document.body
  );
}
