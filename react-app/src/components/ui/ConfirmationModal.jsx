import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WarningCircle as AlertCircle, CheckCircle as CheckCircle2, XCircle } from '@phosphor-icons/react';

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning", // warning, success, info
    icon,
    hideCancelButton = false,
    extraAction = null // { text, onClick }
}) => {
    const icons = {
        warning: <AlertCircle className="w-12 h-12 text-amber-500" />,
        success: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
        info: <AlertCircle className="w-12 h-12 text-blue-500" />
    };

    const confirmColors = {
        warning: "bg-slate-900 hover:bg-slate-800 shadow-slate-200",
        success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        info: "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 md:p-12 max-w-md sm:max-w-lg md:max-w-xl w-full shadow-2xl border border-slate-100 dark:border-dark-border relative overflow-hidden"
                    >
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-50 dark:bg-dark-base rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-border rounded-full transition-colors"
                        >
                            <XCircle size={22} weight="fill" />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="mb-6">
                                {icon || icons[type]}
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
                                {title}
                            </h3>
                            
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10 whitespace-pre-line">
                                {message}
                            </p>
                            
                            <div className="flex flex-row gap-3 w-full">
                                {!hideCancelButton && (
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-border hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-all active:scale-95"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                {extraAction && (
                                    <button
                                        onClick={extraAction.onClick}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-dark-border hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-all active:scale-95"
                                    >
                                        {extraAction.text}
                                    </button>
                                )}
                                <button
                                    onClick={() => { onConfirm(); }}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg ${confirmColors[type]}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
