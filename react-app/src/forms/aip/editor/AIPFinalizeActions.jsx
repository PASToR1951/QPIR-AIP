import React from 'react';
import { Eye, FloppyDisk } from '@phosphor-icons/react';
import FinalizeCard from '../../../components/ui/FinalizeCard';

export default React.memo(function AIPFinalizeActions({
    appMode,
    reviewAreaRef,
    submission,
    onPreview,
    onSubmit,
}) {
    if (appMode === 'wizard') {
        return (
            <div ref={reviewAreaRef} data-tour="form-review-submit">
                <FinalizeCard
                    isSubmitted={submission.isSubmitted}
                    onSubmit={onSubmit}
                    onPreview={onPreview}
                    theme="pink"
                    submitLabel={submission.isEditing ? 'Save Changes' : undefined}
                />
            </div>
        );
    }

    return (
        <div
            ref={reviewAreaRef}
            data-tour="form-review-submit"
            className="print:hidden relative z-10 mt-12 flex flex-col items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white p-5 text-center shadow-lg dark:border-dark-border dark:bg-dark-surface sm:rounded-[2rem] sm:p-8"
        >
            <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-slate-100">Ready to finalize your plan?</h3>
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <button
                    type="button"
                    onClick={onPreview}
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-8 text-sm font-bold text-slate-700 shadow-sm transition-colors active:scale-95 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 dark:hover:bg-dark-base sm:w-auto"
                >
                    <Eye size={18} weight="bold" />
                    Preview Layout
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submission.isSubmitted}
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-pink-600 px-8 py-1 text-sm font-bold text-white shadow-md transition-colors active:scale-95 hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    <FloppyDisk size={18} weight="bold" />
                    {submission.isSubmitted ? 'Submitted' : submission.isEditing ? 'Save Changes' : 'Confirm & Submit'}
                </button>
            </div>
        </div>
    );
});
