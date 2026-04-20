import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DownloadSimple, XCircle } from '@phosphor-icons/react';

export function ExportLogsModal({ open, onClose, onExport }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 8 || trimmed.length > 500) {
      setError('Export reason must be between 8 and 500 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onExport(trimmed);
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'Failed to export admin logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close export modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.4)] dark:border-dark-border dark:bg-dark-surface"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-dark-border">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <DownloadSimple size={20} weight="fill" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Export Admin Logs</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    The CSV will follow the filters currently active on this page.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-border dark:hover:text-slate-200"
              >
                <XCircle size={24} weight="fill" />
              </button>
            </div>

            <div className="px-6 py-5">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Reason For Export
                </span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={5}
                  placeholder="Example: Reviewing failed login activity for this week before a security briefing."
                  className="min-h-[9rem] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-slate-100 dark:placeholder-slate-500"
                />
              </label>

              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reasons are recorded in the audit trail.
                </p>
                <span className={`text-xs font-bold ${reason.trim().length < 8 || reason.trim().length > 500 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`}>
                  {reason.trim().length}/500
                </span>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-dark-border dark:bg-dark-base">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <DownloadSimple size={16} />
                    Download CSV
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ExportLogsModal;
