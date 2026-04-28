import React from 'react';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, FileText, ListDashes } from '@phosphor-icons/react';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const REVIEW_VIEW_OPTIONS = [
  { key: 'summary', label: 'Simple View', icon: ListDashes },
  { key: 'full-form', label: 'Full Form View', icon: FileText },
];

export function PIRReviewHeader({
  clusterLogo,
  clusterNumber,
  navigate,
  onReviewViewChange,
  program,
  quarter,
  reviewView = 'summary',
  school,
  schoolLogo,
  showDetails = true,
  status,
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/admin/submissions')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={14} /> Back to Submissions
        </button>

        {onReviewViewChange && (
          <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 backdrop-blur-sm dark:bg-dark-border/80">
            {REVIEW_VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = reviewView === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onReviewViewChange(option.key)}
                  className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${active
                      ? 'text-slate-800 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                  {active && (
                    <Motion.div
                      layoutId="reviewViewPill"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-dark-surface"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon size={14} />
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showDetails && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-md dark:border-dark-border dark:bg-dark-surface">
          <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl dark:from-indigo-500/20 dark:to-purple-500/20"></div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {school !== 'Division' && (
                <SchoolAvatar
                  clusterNumber={clusterNumber}
                  schoolLogo={schoolLogo}
                  clusterLogo={clusterLogo}
                  name={school}
                  size={44}
                  className="shrink-0 rounded-xl shadow-sm"
                />
              )}
              <div className="min-w-0">
                <p className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
                  PIR Details
                </p>
                <h1 className="truncate text-2xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">{program}</h1>
                <p className="mt-1 flex items-center gap-2 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                  {school} <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span> {quarter}
                </p>
              </div>
            </div>
            <StatusBadge status={status} size="xs" />
          </div>
        </div>
      )}
    </>
  );
}
