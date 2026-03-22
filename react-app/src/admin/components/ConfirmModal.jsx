import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Warning, Trash, X } from '@phosphor-icons/react';

export const ConfirmModal = ({ open, title, message, variant = 'danger', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, loading = false }) => {
  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={20} />
            </button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDanger ? 'bg-rose-100 dark:bg-rose-950/40' : 'bg-indigo-100 dark:bg-indigo-950/40'}`}>
              {isDanger ? <Trash size={24} className="text-rose-600 dark:text-rose-400" /> : <Warning size={24} className="text-indigo-600 dark:text-indigo-400" />}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-60 ${isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {loading ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
