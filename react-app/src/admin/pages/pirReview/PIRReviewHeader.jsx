import React from 'react';
import { ArrowLeft, ArrowBendUpLeft, Check } from '@phosphor-icons/react';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function PIRReviewHeader({
  canAct,
  clusterLogo,
  clusterNumber,
  isObserver,
  navigate,
  onOpenApprove,
  onOpenReturn,
  program,
  quarter,
  school,
  schoolLogo,
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
        <div className="flex items-center gap-2">
          {canAct && (
            <button
              onClick={onOpenReturn}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 px-4 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-950/20"
            >
              <ArrowBendUpLeft size={13} /> Return
            </button>
          )}
          {canAct && (
            <button
              onClick={onOpenApprove}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <Check size={13} weight="bold" /> Approve
            </button>
          )}
          {!canAct && !isObserver && (
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Action complete
            </span>
          )}
        </div>
      </div>

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
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">PIR Review</p>
              <h1 className="truncate text-xl font-black leading-tight text-slate-800 dark:text-slate-100">{program}</h1>
              <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{school} · {quarter}</p>
            </div>
          </div>
          <StatusBadge status={status} size="xs" />
        </div>
      </div>
    </>
  );
}
