import React from 'react';

export function IconHoverLabelButton({ label, icon, onClick, disabled = false, title, variant = 'default', className = '' }) {
  const tone = disabled
    ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
    : variant === 'danger'
      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
      : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={`group inline-flex items-center gap-1 overflow-hidden rounded-lg px-2 py-1 text-xs font-bold transition-all duration-200 ease-out sm:text-sm ${tone} ${className}`}
    >
      <span className="max-w-14 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-200 ease-out sm:max-w-0 sm:opacity-0 sm:group-hover:max-w-14 sm:group-hover:opacity-100 sm:group-focus-visible:max-w-14 sm:group-focus-visible:opacity-100">
        {label}
      </span>
      <span className="flex shrink-0 items-center">{icon}</span>
    </button>
  );
}
