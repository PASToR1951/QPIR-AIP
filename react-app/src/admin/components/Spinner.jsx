import React from 'react';

const SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

const VARIANTS = {
  default: 'border-slate-300 dark:border-slate-600 border-t-indigo-500',
  white:   'border-white/30 border-t-white',
  subtle:  'border-slate-400/40 border-t-slate-500',
};

export function Spinner({ size = 'md', variant = 'default', className = '' }) {
  return (
    <div
      className={`rounded-full border-2 animate-spin ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    />
  );
}
