import React from 'react';

export function PIRReviewActionModal({
  actionError,
  actionLoading,
  feedback,
  modal,
  onClose,
  onSubmit,
  program,
  quarter,
  school,
  setFeedback,
}) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-dark-border dark:bg-dark-surface">
        <h2 className="mb-1 text-base font-black text-slate-800 dark:text-slate-100">
          {modal === 'approve' ? 'Approve PIR' : 'Return PIR'}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{program} — {school} — {quarter}</p>
        <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
          {modal === 'return' ? 'Feedback / Reason for return (required)' : 'Remarks (optional)'}
        </label>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={4}
          placeholder={modal === 'approve' ? 'Add optional remarks…' : 'Explain what needs to be corrected…'}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-dark-border dark:bg-dark-base dark:text-slate-200 dark:focus:ring-indigo-700"
        />
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">This text will also be saved to the PIR remarks.</p>
        {actionError && <p className="mt-2 text-xs text-red-500">{actionError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-border/30"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={actionLoading || (modal === 'return' && !feedback.trim())}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 ${modal === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {actionLoading ? 'Processing…' : modal === 'approve' ? 'Approve' : 'Return PIR'}
          </button>
        </div>
      </div>
    </div>
  );
}
