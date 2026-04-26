import React from 'react';
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
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-dark-border">
            {REVIEW_VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = reviewView === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onReviewViewChange(option.key)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${active
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-dark-surface dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showDetails && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {school !== 'Division' && (
                <SchoolAvatar
                  clusterNumber={clusterNumber}
                  schoolLogo={schoolLogo}
                  clusterLogo={clusterLogo}
                  name={school}
                  size={44}
                  className="shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">PIR Details</p>
                <h1 className="truncate text-xl font-black leading-tight text-slate-800 dark:text-slate-100">{program}</h1>
                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{school} · {quarter}</p>
              </div>
            </div>
            <StatusBadge status={status} size="xs" />
          </div>
        </div>
      )}
    </>
  );
}
