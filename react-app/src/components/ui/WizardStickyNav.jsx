import React from 'react';

const THEME_CLASSES = {
  pink: 'bg-pink-600 hover:bg-pink-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
};

export default function WizardStickyNav({
  show = false,
  theme = 'pink',
  onPrevious,
  onNext,
  previousDisabled = false,
  nextLabel = 'Continue',
  showNext = true,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/95 print:hidden">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={previousDisabled}
          className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-base dark:text-slate-300"
        >
          Back
        </button>
        {showNext && (
          <button
            type="button"
            onClick={onNext}
            className={`min-h-[48px] flex-1 rounded-2xl px-4 py-3 text-sm font-bold text-white transition-colors ${THEME_CLASSES[theme] ?? THEME_CLASSES.pink}`}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}
