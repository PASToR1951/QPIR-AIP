import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "warning", // warning, success, info
    icon
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden"
                    >
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="mb-6">
                                {icon || icons[type]}
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                                {title}
                            </h3>
                            
                            <p className="text-slate-500 font-medium leading-relaxed mb-10">
                                {message}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button 
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    {cancelText}
                                </button>
                                <button 
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
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
