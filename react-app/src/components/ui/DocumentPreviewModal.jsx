import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { XCircle, Printer, Eye, FileText, CaretRight as ChevronRight, DownloadSimple } from '@phosphor-icons/react';

export const DocumentPreviewModal = ({
    isOpen,
    onClose,
    title = "Document Preview",
    subtitle = "Review your document",
    filename,
    landscape = false,
    onDownloadPdf,
    children
}) => {
    const handlePrint = () => {
        const prev = document.title;
        if (filename) document.title = filename;

        let injected = null;
        if (landscape) {
            injected = document.createElement('style');
            injected.id = '__pir-landscape-print__';
            injected.textContent = '@media print { @page { size: 13in 8.5in; margin: 1cm; } }';
            document.head.appendChild(injected);
        }

        window.print();

        window.addEventListener('afterprint', () => {
            document.title = prev;
            if (injected) injected.remove();
        }, { once: true });
    };
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('document-preview-printing');
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('document-preview-printing');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('document-preview-printing');
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

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="document-preview-print-root fixed inset-0 z-[9999] flex flex-col print:static print:block print:p-0 print:z-auto">
                    <style>{`
                        @media print {
                            body.document-preview-printing > *:not(.document-preview-print-root) {
                                display: none !important;
                            }
                            body.document-preview-printing {
                                margin: 0 !important;
                                background: white !important;
                            }
                            .document-preview-print-root {
                                display: block !important;
                                position: static !important;
                                inset: auto !important;
                                width: 100% !important;
                                height: auto !important;
                                overflow: visible !important;
                                background: white !important;
                            }
                        }
                    `}</style>
                    {/* Backdrop */}
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 dark:bg-dark-base/80 backdrop-blur-md print:hidden"
                    />

                    {/* Modal Content */}
                    <Motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-screen h-[100dvh] flex flex-col bg-slate-50 dark:bg-dark-base shadow-2xl overflow-hidden pointer-events-auto print:static print:max-w-none print:w-full print:h-auto print:flex-none print:rounded-none print:shadow-none print:bg-white print:border-0 print:overflow-visible"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Bar (Non-Printable) */}
                        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-slate-200 dark:border-dark-border shrink-0 z-10 print:hidden">
                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                <div className="hidden sm:flex p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-sm shadow-indigo-100/50 shrink-0">
                                    <FileText size={22} />
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-tight truncate">{title}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 flex flex-wrap items-center gap-1.5">
                                        {subtitle} 
                                        <ChevronRight size={12} className="text-slate-300 shrink-0" />
                                        <span className="text-indigo-600">Document View</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                {onDownloadPdf && (
                                    <button
                                        onClick={onDownloadPdf}
                                        className="flex min-w-0 items-center justify-center gap-2 px-3 py-2.5 sm:px-5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-dark-base transition-all active:scale-95"
                                    >
                                        <DownloadSimple size={18} />
                                        <span className="hidden sm:inline">Download PDF</span>
                                        <span className="sm:hidden">PDF</span>
                                    </button>
                                )}
                                <button
                                    onClick={handlePrint}
                                    className="flex min-w-0 items-center justify-center gap-2 px-3 py-2.5 sm:px-5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                                >
                                    <Printer size={18} />
                                    <span className="hidden sm:inline">Print Document</span>
                                    <span className="sm:hidden">Print</span>
                                </button>
                                <div className="w-px h-6 bg-slate-200 dark:bg-dark-border mx-1"></div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-slate-100 dark:bg-dark-border text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-border rounded-lg transition-all active:scale-95 shrink-0"
                                    title="Close Preview"
                                >
                                    <XCircle size={22} weight="fill" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Preview Area */}
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3 sm:p-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-dark-border scrollbar-track-transparent print:overflow-visible print:p-0 print:flex-none print:h-auto">
                            <div className={`${landscape ? 'min-w-[330.2mm] max-w-[330.2mm]' : 'max-w-[215.9mm]'} mx-auto print:max-w-none`}>
                                <div className={`bg-white text-black shadow-xl ring-1 ring-slate-900/5 rounded-sm p-4 sm:p-6 md:p-10 lg:p-12 print:p-0 print:shadow-none print:m-0 print:ring-0 ${landscape ? 'min-h-[215.9mm]' : 'min-h-[330.2mm]'} print:min-h-0`}>
                                    {children}
                                </div>

                                {/* Tips / Help (Non-Printable) */}
                                <div className="mt-8 flex flex-col items-center gap-4 pb-12 print:hidden">
                                    <div className="bg-indigo-50/50 dark:bg-dark-surface border border-indigo-100/50 dark:border-dark-border p-6 rounded-3xl text-center max-w-sm">
                                        <div className="w-10 h-10 bg-white dark:bg-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-dark-border shadow-sm">
                                            <Eye size={22} className="text-indigo-600" />
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-1">Document Preview</h4>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Review the submitted document here. Use the print action only when you need a paper copy or PDF.
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                                        Esc key to close • Control + P to print
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
