import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';

export const FormModal = ({ open, title, children, onSave, onCancel, loading = false, saveLabel = 'Save', wide = false }) => {
  if (!open) return null;

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
            className={`relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-border shrink-0">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{title}</h3>
              <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-dark-border shrink-0">
              <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={loading}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? 'Saving…' : saveLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FormModal;
