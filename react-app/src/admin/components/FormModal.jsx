import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from '@phosphor-icons/react';

export const FormModal = ({ open, title, subtitle, icon: Icon, children, onSave, onCancel, loading = false, saveLabel = 'Save', wide = false, saveDisabled = false }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Enter' && !loading && !saveDisabled) onSave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, loading, saveDisabled, onSave]);

  return (
    <AnimatePresence>
      {open && (
        <div key="form-modal" className="fixed inset-0 z-50">
          {/* Backdrop on its own layer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
          {/* Scrollable overlay so long forms + open dropdowns don't get clipped */}
          <div className="relative z-10 flex items-start justify-center min-h-full p-3 py-4 sm:p-6 sm:py-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`pointer-events-auto relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_-8px_rgba(0,0,0,0.5)] w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} flex flex-col max-h-[85vh]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-5 border-b border-slate-100 dark:border-dark-border shrink-0 rounded-t-2xl bg-white dark:bg-dark-surface">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                    <Icon size={18} weight="fill" className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-none">{title}</h3>
                  {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button onClick={onCancel} className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors -mr-1">
                <XCircle size={22} weight="fill" />
              </button>
            </div>

            {/* Body — scrollable for long content */}
            <div className="px-6 py-5 overflow-y-auto min-h-0">
              {children}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-base shrink-0 rounded-b-2xl">
              <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={loading || saveDisabled}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Saving…' : saveLabel}
              </button>
            </div>
          </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FormModal;
