import React from 'react';
import { Warning, CheckCircle } from '@phosphor-icons/react';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';
import { FormModal } from '../../components/FormModal.jsx';

export function SubmissionModals({ actions, onStatusUpdate, toast }) {
  return (
    <>
      {/* Approve Confirm */}
      <ConfirmModal
        open={!!actions.approveItem}
        title="Approve Submission"
        message={`Approve ${actions.approveItem?.type} for ${actions.approveItem?.school} – ${actions.approveItem?.program}?`}
        variant="info" confirmLabel="Approve"
        onConfirm={() => onStatusUpdate(actions.approveItem.id, actions.approveItem.type, 'Approved')}
        onCancel={() => actions.setApproveItem(null)}
        loading={actions.actionLoading}
      />

      {/* Return Modal */}
      <FormModal
        open={!!actions.returnItem && actions.canChangeSubmissionStatus(actions.returnItem)}
        title="Return for Revision"
        onSave={() => onStatusUpdate(actions.returnItem.id, actions.returnItem.type, 'Returned', actions.returnFeedback)}
        onCancel={() => { actions.setReturnItem(null); actions.setReturnFeedback(''); actions.setReturnFeedbackError(''); }}
        loading={actions.actionLoading} saveLabel="Return">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Returning <strong>{actions.returnItem?.type}</strong> from <strong>{actions.returnItem?.school}</strong> for <strong>{actions.returnItem?.program}</strong>.
        </p>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          Feedback / Reason <span className="text-rose-500">(required)</span>
        </label>
        <textarea
          value={actions.returnFeedback}
          onChange={e => { actions.setReturnFeedback(e.target.value); if (actions.returnFeedbackError) actions.setReturnFeedbackError(''); }}
          rows={4} placeholder="Explain what needs to be revised…"
          aria-invalid={!!actions.returnFeedbackError} aria-describedby="return-feedback-help"
          className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border rounded-xl resize-none text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none ${actions.returnFeedbackError ? 'border-rose-300 dark:border-rose-800 focus:border-rose-400' : 'border-slate-200 dark:border-dark-border focus:border-indigo-400'}`}
        />
        <p id="return-feedback-help" className={`mt-1.5 text-xs font-medium ${actions.returnFeedbackError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
          {actions.returnFeedbackError || 'A short reason is required so the submitter knows what to revise.'}
        </p>
      </FormModal>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} weight="fill" className="text-emerald-500" /> : <Warning size={18} weight="fill" className="text-rose-500" />}
          {toast.msg}
        </div>
      )}
    </>
  );
}
