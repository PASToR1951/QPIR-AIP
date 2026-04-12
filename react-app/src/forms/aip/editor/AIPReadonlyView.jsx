import React, { useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { LockKey, PencilSimple, Printer, Trash, DownloadSimple } from '@phosphor-icons/react';
import { FormHeader } from '../../../components/ui/FormHeader';
import AIPDocumentPreview from './AIPDocumentPreview.jsx';
import { generateAIPPdf } from '../../../lib/formPdfExport.js';

export default React.memo(function AIPReadonlyView({
    motionProps,
    profile,
    submission,
    aipData,
    onBack,
    onEdit,
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
        style.textContent = '@media print { @page { size: A4 landscape; margin: 1cm; } }';
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
    return (
        <Motion.div {...motionProps}>
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
                <div className="mx-auto max-w-5xl px-4 pb-4 pt-4 print:hidden sm:pt-8">
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:px-5">
                        <LockKey size={16} className="shrink-0 text-emerald-600" weight="duotone" />
                        <span className="flex-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                            This form has been submitted{submission.aipStatus && submission.aipStatus !== 'Submitted' ? ` — currently ${submission.aipStatus.toLowerCase()}` : ' and is read-only'}.
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            {(submission.aipStatus === 'Submitted' || submission.aipStatus === 'Returned') && (
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

                <div className="mx-auto max-w-5xl px-4 pb-12">
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none dark:border-dark-border dark:bg-dark-surface sm:p-8">
                        <AIPDocumentPreview aipData={aipData} />
                    </div>
                </div>
            </div>
        </Motion.div>
    );
});
