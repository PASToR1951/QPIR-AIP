import React, { useCallback, useMemo } from 'react';

import { FormHeader } from '../../components/ui/FormHeader';
import { FormBoxHeader } from '../../components/ui/FormBoxHeader';
import { DocumentPreviewModal } from '../../components/ui/DocumentPreviewModal';
import WizardStepper from '../../components/ui/WizardStepper';
import AIPProfileSection from '../../components/forms/aip/AIPProfileSection';
import AIPGoalsTargetsSection from '../../components/forms/aip/AIPGoalsTargetsSection';
import AIPActionPlanSection from '../../components/forms/aip/AIPActionPlanSection';
import { useFormShellContext } from '../shared/formShellContext.jsx';
import {
    selectAipActivities,
    selectAipIndicators,
    selectAipObjectives,
    selectAipProfile,
    selectAipSignatories,
    selectAipSubmission,
    selectAipSuggestions,
    selectAipUi,
    useAipDispatch,
    useAipSelector,
} from './aipContext.jsx';
import { createEmptyAipActivity } from './useAipFormState.js';
import { generateAIPPdf } from '../../lib/formPdfExport.js';
import AIPDocumentPreview from './editor/AIPDocumentPreview.jsx';
import AIPFinalizeActions from './editor/AIPFinalizeActions.jsx';
import AIPReadonlyView from './editor/AIPReadonlyView.jsx';
import AIPSignaturesSection from './editor/AIPSignaturesSection.jsx';
import AIPStepContainer from './editor/AIPStepContainer.jsx';
import AIPWizardNavigation from './editor/AIPWizardNavigation.jsx';
import { AIP_WIZARD_STEPS } from './editor/aipEditorConfig.js';

function sanitizeFilenameSegment(value) {
    return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default React.memo(function AIPFormEditor({
    usesSchoolTerminology,
    toggleAppMode,
    reviewAreaRef,
    isPreviewOpen,
    onPreviewOpen,
    onSaveForLater,
    onShowFinalConfirm,
    onBack,
    onHome,
    onEditAIP,
    onRequestEdit,
    onCancelEditRequest,
    isRequestingEdit,
    hasRequestedEdit,
    editRequestCount,
    onDeleteSubmission,
    onRequestRemoveActivity,
    isSaving,
    isSaved,
    lastSavedTime,
    lastAutoSavedTime,
}) {
    const {
        appMode,
        currentStep,
        nextStep,
        prevStep,
        isMobile,
    } = useFormShellContext();
    const dispatch = useAipDispatch();
    const profile = useAipSelector(selectAipProfile);
    const activities = useAipSelector(selectAipActivities);
    const objectives = useAipSelector(selectAipObjectives);
    const indicators = useAipSelector(selectAipIndicators);
    const signatories = useAipSelector(selectAipSignatories);
    const suggestions = useAipSelector(selectAipSuggestions);
    const submission = useAipSelector(selectAipSubmission);
    const ui = useAipSelector(selectAipUi);

    const showWizardStickyNav = appMode === 'wizard' && isMobile;

    const handleActivityChange = useCallback((id, field, value) => {
        dispatch({ type: 'SET_ACTIVITY', payload: { id, field, value } });
    }, [dispatch]);

    const handleAddActivityPhase = useCallback((phase) => {
        dispatch({ type: 'ADD_ACTIVITY', payload: { activity: createEmptyAipActivity({ phase }) } });
    }, [dispatch]);

    const handleSetExpandedActivityId = useCallback((activityId) => {
        dispatch({ type: 'SET_EXPANDED_ACTIVITY_ID', payload: activityId });
    }, [dispatch]);

    const handleSignatoryChange = useCallback((field, value) => {
        dispatch({ type: 'SET_SIGNATORY', payload: { field, value } });
    }, [dispatch]);

    const handleOpenPreview = useCallback(() => {
        onPreviewOpen(true);
    }, [onPreviewOpen]);

    const handleClosePreview = useCallback(() => {
        onPreviewOpen(false);
    }, [onPreviewOpen]);

    const handleOpenFinalConfirm = useCallback(() => {
        onShowFinalConfirm(true);
    }, [onShowFinalConfirm]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const previewFilename = useMemo(() => {
        const sanitizedSipTitle = profile.sipTitle ? sanitizeFilenameSegment(profile.sipTitle) : '';

        return `AIP_${profile.year}${sanitizedSipTitle ? `_${sanitizedSipTitle}` : ''}`;
    }, [profile.sipTitle, profile.year]);

    const aipDocumentData = useMemo(() => ({
        year: profile.year,
        outcome: profile.outcome,
        targetDescription: profile.selectedTarget,
        depedProgram: profile.depedProgram,
        usesSchoolTerminology,
        sipTitle: profile.sipTitle,
        projectCoord: profile.projectCoord,
        objectives,
        indicators,
        activities,
        preparedByName: signatories.preparedByName,
        preparedByTitle: signatories.preparedByTitle,
        approvedByName: signatories.approvedByName,
        approvedByTitle: signatories.approvedByTitle,
    }), [
        activities,
        indicators,
        objectives,
        profile.depedProgram,
        profile.outcome,
        profile.projectCoord,
        profile.selectedTarget,
        profile.sipTitle,
        profile.year,
        usesSchoolTerminology,
        signatories.approvedByName,
        signatories.approvedByTitle,
        signatories.preparedByName,
        signatories.preparedByTitle,
    ]);

    const handleDownloadPdf = useCallback(() => {
        generateAIPPdf(aipDocumentData);
    }, [aipDocumentData]);

    if (appMode === 'readonly') {
        return (
            <AIPReadonlyView
                profile={profile}
                submission={submission}
                aipData={aipDocumentData}
                onBack={onBack}
                onEdit={onEditAIP}
                onRequestEdit={onRequestEdit}
                onCancelEditRequest={onCancelEditRequest}
                isRequestingEdit={isRequestingEdit}
                hasRequestedEdit={hasRequestedEdit}
                editRequestCount={editRequestCount}
                onDelete={onDeleteSubmission}
                onPrint={handlePrint}
                isSaving={isSaving}
                isSaved={isSaved}
                lastSavedTime={lastSavedTime}
                lastAutoSavedTime={lastAutoSavedTime}
            />
        );
    }

    return (
        <div data-tour="aip-form-active" className="relative flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 print:bg-white print:text-black dark:bg-dark-base dark:text-slate-100">
                <FormHeader
                    title={submission.isEditing ? 'Edit Annual Implementation Plan' : 'Annual Implementation Plan'}
                    programName={profile.depedProgram}
                    onSave={submission.isEditing ? undefined : onSaveForLater}
                    onBack={onBack}
                    onHome={submission.isEditing ? undefined : onHome}
                    isSaving={isSaving}
                    isSaved={isSaved}
                    lastSavedTime={lastSavedTime}
                    lastAutoSavedTime={lastAutoSavedTime}
                    theme="pink"
                    appMode={appMode}
                    toggleAppMode={toggleAppMode}
                />

                <DocumentPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={handleClosePreview}
                    title="AIP Document Preview"
                    subtitle={`Annual Implementation Plan Cycle ${profile.year}`}
                    filename={previewFilename}
                    landscape
                    onDownloadPdf={handleDownloadPdf}
                >
                    <AIPDocumentPreview aipData={aipDocumentData} />
                </DocumentPreviewModal>

                <div className={`container relative z-10 mx-auto mb-10 mt-4 max-w-5xl px-3 print:hidden sm:mt-6 sm:px-4 md:mt-8 md:px-0 ${showWizardStickyNav ? 'pb-32' : ''}`}>
                    {appMode === 'wizard' && (
                        <div className="mb-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-md dark:border-dark-border dark:bg-dark-surface sm:mb-6 sm:rounded-[2rem] sm:p-6">
                            <FormBoxHeader
                                title="Annual Implementation Plan"
                                badge={`CY ${profile.year}`}
                                compact
                            />
                        </div>
                    )}

                    <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl dark:border-dark-border dark:bg-dark-surface sm:p-6 md:rounded-[2.5rem] md:p-12">
                        {appMode === 'full' && (
                            <FormBoxHeader
                                title="Annual Implementation Plan"
                                badge={`CY ${profile.year}`}
                            />
                        )}

                        {appMode === 'wizard' && (
                            <div data-tour="form-step-nav">
                                <WizardStepper
                                    steps={AIP_WIZARD_STEPS}
                                    currentStep={currentStep}
                                    theme="pink"
                                />
                            </div>
                        )}

                        <form onSubmit={(event) => event.preventDefault()}>
                            <div className="min-h-[300px]">
                                <AIPStepContainer
                                    appMode={appMode}
                                    currentStep={currentStep}
                                    steps={1}
                                    animated={false}
                                >
                                    <AIPProfileSection usesSchoolTerminology={usesSchoolTerminology} />
                                </AIPStepContainer>

                                <AIPStepContainer
                                    appMode={appMode}
                                    currentStep={currentStep}
                                    steps={2}
                                >
                                    <AIPGoalsTargetsSection />
                                </AIPStepContainer>

                                <AIPStepContainer
                                    appMode={appMode}
                                    currentStep={currentStep}
                                    steps={[3, 4]}
                                >
                                    <AIPActionPlanSection
                                        appMode={appMode}
                                        currentStep={currentStep}
                                        activities={activities}
                                        expandedActivityId={ui.expandedActivityId}
                                        setExpandedActivityId={handleSetExpandedActivityId}
                                        handleActivityChange={handleActivityChange}
                                        handleRemoveActivity={onRequestRemoveActivity}
                                        handleAddActivityPhase={handleAddActivityPhase}
                                        personsTerms={suggestions.personsTerms}
                                    />
                                </AIPStepContainer>

                                <AIPStepContainer
                                    appMode={appMode}
                                    currentStep={currentStep}
                                    steps={5}
                                    keepMounted={false}
                                >
                                    <AIPSignaturesSection
                                        appMode={appMode}
                                        signatories={signatories}
                                        onSignatoryChange={handleSignatoryChange}
                                    />
                                </AIPStepContainer>

                                <AIPStepContainer
                                    appMode={appMode}
                                    currentStep={currentStep}
                                    steps={6}
                                    keepMounted={false}
                                >
                                    <AIPFinalizeActions
                                        appMode={appMode}
                                        reviewAreaRef={reviewAreaRef}
                                        submission={submission}
                                        onPreview={handleOpenPreview}
                                        onSubmit={handleOpenFinalConfirm}
                                    />
                                </AIPStepContainer>
                            </div>

                            <AIPWizardNavigation
                                appMode={appMode}
                                currentStep={currentStep}
                                showSticky={showWizardStickyNav}
                                onPrevious={prevStep}
                                onNext={nextStep}
                                onSubmit={handleOpenFinalConfirm}
                                submission={submission}
                            />
                        </form>
                    </div>
                </div>
            </div>
    );
});
