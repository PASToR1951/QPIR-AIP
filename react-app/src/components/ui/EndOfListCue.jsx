import React from 'react';
import { END_OF_LIST_THRESHOLD, shouldShowEndOfListCue } from './endOfListCue';

function formatCount(count, countLabel) {
  if (!countLabel) return null;
  if (typeof countLabel === 'function') return `${count} ${countLabel(count)}`;
  return `${count} ${countLabel}${count === 1 ? '' : 's'}`;
}

export function EndOfListCue({
  count,
  message = 'End of list',
  threshold = END_OF_LIST_THRESHOLD,
  countLabel,
  showCount = false,
  className = '',
}) {
  if (!shouldShowEndOfListCue(count, threshold)) return null;

  const countText = showCount ? formatCount(count, countLabel) : null;

  return (
    <div className={`flex items-center justify-center gap-3 text-center ${className}`}>
      <span aria-hidden="true" className="h-px w-10 max-w-[20vw] bg-slate-200 dark:bg-dark-border" />
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {message}
        {countText ? <span className="font-bold normal-case tracking-normal"> · {countText}</span> : null}
      </span>
      <span aria-hidden="true" className="h-px w-10 max-w-[20vw] bg-slate-200 dark:bg-dark-border" />
    </div>
  );
}

export default EndOfListCue;
