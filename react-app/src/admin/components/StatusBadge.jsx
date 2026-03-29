import React from 'react';

const STATUS_STYLES = {
  Submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'Under Review': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'For CES Review': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  'For SDS Review': 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  Approved: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  Returned: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  AIP: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
  PIR: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  School: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
  'Division Personnel': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  Admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  Reviewer: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  'CES-SGOD': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  'CES-ASDS': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
  'CES-CID': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  SDS: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  return (
    <span className={`inline-flex items-center font-bold rounded-lg ${sizeClass} ${style}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
