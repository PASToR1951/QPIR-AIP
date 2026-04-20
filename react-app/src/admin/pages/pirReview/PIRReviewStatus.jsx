import React from 'react';
import { ArrowBendUpLeft, Check } from '@phosphor-icons/react';
import { Spinner } from '../../components/Spinner.jsx';

export function PIRReviewStatus({ done, doneAction, loadError, loading, navigate }) {
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3 p-12 text-center">
        <p className="text-sm text-red-500">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-dark-border dark:text-slate-300 dark:hover:bg-dark-border/70"
        >
          Retry
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${doneAction === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
          {doneAction === 'Approved'
            ? <Check size={28} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
            : <ArrowBendUpLeft size={28} className="text-amber-600 dark:text-amber-400" />}
        </div>
        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
          {doneAction === 'Approved' ? 'PIR approved successfully.' : 'PIR returned to submitter.'}
        </p>
        <button
          onClick={() => navigate('/admin/submissions', { replace: true })}
          className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
        >
          Back to Submissions
        </button>
      </div>
    );
  }

  return null;
}
