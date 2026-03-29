import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Printer, DownloadSimple as Download, Eye, FileText, CaretRight as ChevronRight } from '@phosphor-icons/react';

export const DocumentPreviewModal = ({
    isOpen,
    onClose,
    title = "Document Preview",
    subtitle = "Review and print your document",
    filename,
    children
}) => {
    const handlePrint = () => {
        const prev = document.title;
        if (filename) document.title = filename;
        window.print();
        window.addEventListener('afterprint', () => { document.title = prev; }, { once: true });
    };
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8 print:static print:block print:p-0 print:z-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 dark:bg-dark-base/80 backdrop-blur-md cursor-zoom-out print:hidden"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-5xl h-full flex flex-col bg-slate-50 dark:bg-dark-base rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden pointer-events-auto print:static print:max-w-none print:w-full print:h-auto print:flex-none print:rounded-none print:shadow-none print:bg-white print:border-0 print:overflow-visible"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Bar (Non-Printable) */}
                        <div className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border shrink-0 z-10 print:hidden">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50 shadow-sm shadow-indigo-100/50">
                                    <FileText size={22} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">{title}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                        {subtitle} 
                                        <ChevronRight size={12} className="text-slate-300" />
                                        <span className="text-indigo-600">Form Preview</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                                >
                                    <Printer size={18} />
                                    Print Document
                                </button>
                                <div className="w-px h-6 bg-slate-200 dark:bg-dark-border mx-1"></div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-slate-100 dark:bg-dark-border text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-border rounded-xl transition-all active:scale-95"
                                    title="Close Preview"
                                >
                                    <XCircle size={22} weight="fill" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Preview Area */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-12 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-dark-border scrollbar-track-transparent print:overflow-visible print:p-0 print:flex-none print:h-auto">
                            <div className="max-w-[210mm] mx-auto print:max-w-none">
                                <div className="bg-white text-black shadow-xl ring-1 ring-slate-900/5 rounded-sm p-8 md:p-12 print:p-0 print:shadow-none print:m-0 print:ring-0 min-h-[297mm] print:min-h-0">
                                    {children}
                                </div>

                                {/* Tips / Help (Non-Printable) */}
                                <div className="mt-8 flex flex-col items-center gap-4 pb-12 print:hidden">
                                    <div className="bg-indigo-50/50 dark:bg-dark-surface border border-indigo-100/50 dark:border-dark-border p-6 rounded-3xl text-center max-w-sm">
                                        <div className="w-10 h-10 bg-white dark:bg-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-dark-border shadow-sm">
                                            <Eye size={22} className="text-indigo-600" />
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-1">Print Preview Mode</h4>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                            This layout matches the final printed document. Use the button above to export to PDF or print directly.
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                                        Esc key to close • Control + P to print
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
