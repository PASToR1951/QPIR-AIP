import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Warning, Trash, XCircle } from '@phosphor-icons/react';

export const ConfirmModal = ({
  open,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  requireConfirmText = null, // if set, user must type this exact string to enable confirm
}) => {
  const isDanger = variant === 'danger';
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const confirmBlocked = requireConfirmText !== null && typed !== requireConfirmText;

  return (
    <AnimatePresence>
      {open && (
        <div key="confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_-8px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <button onClick={onCancel} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <XCircle size={22} weight="fill" />
              </button>

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDanger ? 'bg-rose-100 dark:bg-rose-950/40' : 'bg-indigo-100 dark:bg-indigo-950/40'}`}>
                {isDanger
                  ? <Trash size={24} className="text-rose-600 dark:text-rose-400" />
                  : <Warning size={24} className="text-indigo-600 dark:text-indigo-400" />}
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>

              {requireConfirmText !== null && (
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Type the code below to confirm
                  </p>
                  <div className="flex items-center justify-center px-4 py-2.5 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 select-all">
                    <span className="font-mono text-lg font-black tracking-[0.25em] text-rose-600 dark:text-rose-400">
                      {requireConfirmText}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={typed}
                    onChange={e => setTyped(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all"
                    placeholder="Enter code exactly as shown"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-end">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading || confirmBlocked}
                  className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-40 shadow-sm ${isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {loading ? 'Processing…' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
