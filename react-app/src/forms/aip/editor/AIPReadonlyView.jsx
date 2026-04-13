import React, { useCallback, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { LockKey, PencilSimple, Printer, Trash, DownloadSimple, CheckCircle, Warning, X } from '@phosphor-icons/react';
import { FormHeader } from '../../../components/ui/FormHeader';
import AIPDocumentPreview from './AIPDocumentPreview.jsx';
import { generateAIPPdf } from '../../../lib/formPdfExport.js';

export default React.memo(function AIPReadonlyView({
    profile,
    submission,
    aipData,
    onBack,
    onEdit,
    onRequestEdit,
    onCancelEditRequest,
    isRequestingEdit,
    hasRequestedEdit,
    editRequestCount,
    onDelete,
    onPrint,
    isSaving,
    isSaved,
    lastSavedTime,
    lastAutoSavedTime,
}) {
    const handlePrint = useCallback(() => {
        const prev = document.title;
        const safeSipTitle = aipData.sipTitle ? `_${aipData.sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : '';
        document.title = `AIP_${aipData.year}${safeSipTitle}`;

        const style = document.createElement('style');
        style.id = '__aip-landscape-print__';
        style.textContent = '@media print { @page { size: 13in 8.5in; margin: 1cm; } }';
        document.head.appendChild(style);

        window.print();

        window.addEventListener('afterprint', () => {
            document.title = prev;
            style.remove();
        }, { once: true });
    }, [aipData.year, aipData.sipTitle]);

    const handleDownloadPdf = useCallback(() => {
        generateAIPPdf(aipData);
    }, [aipData]);

    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleConfirmRequestEdit = useCallback(() => {
        setConfirmOpen(false);
        onRequestEdit();
    }, [onRequestEdit]);

    return (
        <>
            <FormHeader
                title="Annual Implementation Plan"
                programName={profile.depedProgram}
                onBack={onBack}
                isSaving={isSaving}
                isSaved={isSaved}
                lastSavedTime={lastSavedTime}
                lastAutoSavedTime={lastAutoSavedTime}
                theme="pink"
            />
            <div className="min-h-screen bg-slate-50 font-sans print:bg-white dark:bg-dark-base">
                <div className="mx-auto max-w-[350mm] px-4 pb-4 pt-4 print:hidden sm:pt-8">
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:px-5">
                        <LockKey size={16} className="shrink-0 text-emerald-600" weight="duotone" />
                        <span className="flex-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                            This form has been submitted{submission.aipStatus && submission.aipStatus !== 'Approved' ? ` — currently ${submission.aipStatus.toLowerCase()}` : ' and is read-only'}.
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            {submission.aipStatus === 'Approved' && !hasRequestedEdit && editRequestCount < 3 && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmOpen(true)}
                                    disabled={isRequestingEdit}
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800"
                                >
                                    <PencilSimple size={13} weight="bold" />
                                    {isRequestingEdit ? 'Sending...' : 'Request Edit'}
                                </button>
                            )}
                            {submission.aipStatus === 'Approved' && !hasRequestedEdit && editRequestCount >= 3 && (
                                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-border text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 font-bold" title="Edit request limit reached">
                                    <PencilSimple size={13} weight="bold" />
                                    No Requests Left
                                </span>
                            )}
                            {submission.aipStatus === 'Approved' && hasRequestedEdit && (
                                <button
                                    type="button"
                                    onClick={onCancelEditRequest}
                                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-colors group"
                                    title="Cancel edit request"
                                >
                                    <CheckCircle size={15} weight="fill" className="group-hover:hidden" />
                                    <X size={15} weight="bold" className="hidden group-hover:block" />
                                    <span className="group-hover:hidden">Edit Request Sent</span>
                                    <span className="hidden group-hover:inline">Cancel Request</span>
                                </button>
                            )}
                            {submission.aipStatus === 'Returned' && (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-pink-700"
                                >
                                    <PencilSimple size={13} weight="bold" />
                                    Edit
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onDelete}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:hover:bg-red-900/40"
                            >
                                <Trash size={13} weight="bold" />
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadPdf}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 dark:hover:bg-dark-base"
                            >
                                <DownloadSimple size={13} weight="bold" />
                                Download PDF
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700"
                            >
                                <Printer size={13} weight="bold" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto px-4 pb-12">
                    <div className="mx-auto min-w-[330.2mm] max-w-[330.2mm] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none dark:border-dark-border dark:bg-dark-surface sm:p-8">
                        <AIPDocumentPreview aipData={aipData} />
                    </div>
                </div>
            </div>
            {/* Request Edit Confirmation Modal */}
            <AnimatePresence>
                {confirmOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={() => setConfirmOpen(false)}
                        />
                        <Motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-dark-surface shadow-2xl ring-1 ring-slate-900/10 dark:ring-dark-border p-6"
                        >
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
                            >
                                <X size={16} weight="bold" />
                            </button>

                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                                    <Warning size={20} weight="duotone" className="text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">Request Edit Access?</h3>
                                    <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                        This will notify the administrator that you need to make changes to your approved AIP. You can only send one request at a time.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-border hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmRequestEdit}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
                                >
                                    Yes, Send Request
                                </button>
                            </div>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
});
