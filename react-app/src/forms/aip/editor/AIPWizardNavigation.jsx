import React from 'react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import WizardStickyNav from '../../../components/ui/WizardStickyNav';
import { AIP_TOTAL_STEPS } from './aipEditorConfig.js';

export default React.memo(function AIPWizardNavigation({
    appMode,
    currentStep,
    showSticky,
    onPrevious,
    onNext,
    onSubmit,
    submission,
}) {
    if (appMode !== 'wizard') {
        return null;
    }

    const onPrimaryAction = currentStep < AIP_TOTAL_STEPS ? onNext : onSubmit;
    const stickyLabel = currentStep < AIP_TOTAL_STEPS
        ? 'Continue'
        : submission.isEditing
            ? 'Save Changes'
            : 'Submit AIP';

    return (
        <>
            {!showSticky && (
                <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-dark-border">
                    <button
                        type="button"
                        onClick={onPrevious}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-600 transition-colors active:scale-95 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-border"
                    >
                        <ArrowLeft size={18} weight="bold" />
                        Back
                    </button>
                    {currentStep < AIP_TOTAL_STEPS && (
                        <button
                            type="button"
                            onClick={onPrimaryAction}
                            className="flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-3 font-bold text-white shadow-md transition-colors active:scale-95 hover:bg-pink-700"
                        >
                            Continue
                            <ArrowRight size={18} weight="bold" />
                        </button>
                    )}
                </div>
            )}

            <WizardStickyNav
                show={showSticky}
                theme="pink"
                onPrevious={onPrevious}
                onNext={onPrimaryAction}
                previousDisabled={currentStep === 1}
                nextLabel={stickyLabel}
                showNext
            />
        </>
    );
});
