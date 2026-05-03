import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { FormHeader } from '../../components/ui/FormHeader';
import { ViewModeSelector } from '../../components/ui/ViewModeSelector';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useAccessibility } from '../../context/AccessibilityContext';
import { emitOnboardingSignal } from '../../lib/onboardingSignals.js';
import FormShellLayout from '../shared/FormShellLayout.jsx';
import { FormShellProvider } from '../shared/formShellContext.jsx';
import useFormShell from '../shared/useFormShell.js';
import useProgramsAndConfig from '../shared/useProgramsAndConfig.js';
import useFormLifecycle from '../shared/useFormLifecycle.js';
import useAipFormState from './useAipFormState.js';
import { AipProvider, selectAipProfile, selectAipSubmission } from './aipContext.jsx';
import useAipDraft from './useAipDraft.js';
import AIPFormEditor from './AIPFormEditor.jsx';
import { getProjectTerminology } from '../../lib/projectTerminology.js';
import { useAipProgramState } from './useAipProgramState.js';
import { useAipSignatories } from './useAipSignatories.js';
import { useAipProgramInit } from './useAipProgramInit.js';
import { useAipMutations } from './useAipMutations.js';
import { DeletedProgramsPopup } from './DeletedProgramsPopup.jsx';
import { getDefaultReportingYear } from '../../lib/periods.js';

export default function AIPFormContainer() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { settings } = useAccessibility();
    const shell = useFormShell({ totalSteps: 6, isMobileBreakpoint: 1024 });
    const motionProps = useMemo(() => (
        settings.reduceMotion
            ? { initial: false, animate: false, exit: false, transition: { duration: 0 } }
            : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.15, ease: 'easeOut' } }
    ), [settings.reduceMotion]);

    const userStr = sessionStorage.getItem('user');
    let user = null;
    try { user = userStr ? JSON.parse(userStr) : null; } catch { sessionStorage.removeItem('user'); }

    const isDivisionPersonnel = ['Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(user?.role);
    const isSchoolUser        = user?.role === 'School';
    const projectTerminology  = getProjectTerminology(isSchoolUser);
    const schoolOrUserId      = user?.school_id || user?.id;
    const reportingYear       = String(getDefaultReportingYear(user?.role));

    const data = useProgramsAndConfig({ kind: 'aip', schoolOrUserId, clusterId: user?.cluster_id });
    const [state, dispatch]  = useAipFormState({ year: reportingYear });
    const profile     = selectAipProfile(state);
    const submission  = selectAipSubmission(state);
    const rawPrograms = data.rawPrograms ?? [];

    const programState = useAipProgramState({ data, dispatch, profileYear: profile.year });

    useAipSignatories({
        user, state, dispatch, isDivisionPersonnel, isSchoolUser,
        notedBy: programState.notedBy,
        rawPrograms, profile,
    });

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);
    const [toast, setToast] = useState(null);
    const [deletedPopup, setDeletedPopup] = useState(null);
    const [isRequestingEdit, setIsRequestingEdit] = useState(false);
    const reviewAreaRef  = useRef(null);
    const toastTimerRef  = useRef(null);

    useEffect(() => {
        if (toast) { clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setToast(null), 4000); }
        return () => clearTimeout(toastTimerRef.current);
    }, [toast]);

    useEffect(() => {
        const reviewArea = reviewAreaRef.current;
        if (!reviewArea || shell.appMode === 'splash' || shell.appMode === 'readonly') return undefined;
        if (typeof IntersectionObserver === 'undefined') { emitOnboardingSignal('author.review_area_opened'); return undefined; }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { emitOnboardingSignal('author.review_area_opened'); observer.disconnect(); }
        }, { threshold: 0.35 });
        observer.observe(reviewArea);
        return () => observer.disconnect();
    }, [shell.appMode, shell.currentStep]);

    const showToast = useCallback((programs) => {
        const count = programs.length;
        const message = count === 1 ? `"${programs[0]}" deleted.`
            : count === 2 ? `"${programs[0]}" and "${programs[1]}" deleted.`
            : `${count} programs deleted.`;
        setToast({ message, programs });
    }, []);

    const handleManualDraftSaved = useCallback(() => {
        try { localStorage.removeItem(`aip_draft_${profile.depedProgram}_${profile.year}`); } catch { /* ignore */ }
        programState.setAutosavedPrograms((prev) => prev.filter((p) => p !== profile.depedProgram));
        emitOnboardingSignal('author.draft_saved', { source: 'server-draft' });
    }, [profile.depedProgram, profile.year, programState]);

    const draft = useAipDraft({
        appMode: shell.appMode,
        state,
        onHydrate: (draftData) => { dispatch({ type: 'HYDRATE_DRAFT', payload: { draft: draftData } }); },
        onAutosave: () => {
            if (profile.depedProgram) {
                programState.setAutosavedPrograms((prev) => prev.includes(profile.depedProgram) ? prev : [...prev, profile.depedProgram]);
            }
            emitOnboardingSignal('author.draft_saved', { source: 'autosave' });
        },
        afterManualSave: handleManualDraftSaved,
    });

    const programInit = useAipProgramInit({
        rawPrograms, data, state, dispatch, shell, draft, profile, setLoadError: programState.setLoadError, reportingYear,
    });

    const mutations = useAipMutations({
        shell, dispatch, navigate, state, draft, profile, submission, projectTerminology,
        setSearchParams,
        setCompletedPrograms: programState.setCompletedPrograms,
        setReturnedPrograms:  programState.setReturnedPrograms,
        setDraftPrograms:     programState.setDraftPrograms,
        showToast, buildProgramParams: programInit.buildProgramParams,
    });

    const { handleStart, handleBack, handleHome, handleToggleAppMode } = useFormLifecycle({
        shell, searchParams, setSearchParams, navigate,
        isLoading:          data.isLoading,
        currentProgram:     profile.depedProgram,
        isEditing:          submission.isEditing,
        hasInputtedData:    programInit.hasInputtedData,
        draft,
        resetFormState:     programInit.resetFormState,
        resetSubmissionState:              programInit.resetSubmissionState,
        exitEditMode:                      programInit.exitEditMode,
        clearProgramField:                 programInit.clearProgramField,
        loadReadonlyRecord:                programInit.loadReadonlyRecord,
        hydrateDraft:                      programInit.hydrateDraft,
        getLocalDraftKey:                  programInit.getLocalDraftKey,
        getLocalDraftModal:                programInit.getLocalDraftModal,
        loadInitialDraft:                  programInit.loadInitialDraft,
        loadDiscardedLocalDraftFallback:   programInit.loadDiscardedLocalDraftFallback,
        onBeforeStart:                     programInit.onBeforeStart,
        onReadonlyError:                   programInit.onReadonlyError,
    });

    const renderEditor = () => (
        <AIPFormEditor
            usesSchoolTerminology={isSchoolUser}
            toggleAppMode={handleToggleAppMode}
            reviewAreaRef={reviewAreaRef}
            isPreviewOpen={isPreviewOpen}
            onPreviewOpen={setIsPreviewOpen}
            onSaveForLater={draft.saveNow}
            onShowFinalConfirm={setShowFinalConfirm}
            onBack={handleBack}
            onHome={handleHome}
            onEditAIP={mutations.handleEditAIP}
            onRequestEdit={() => { setIsRequestingEdit(true); mutations.handleRequestEdit().finally(() => setIsRequestingEdit(false)); }}
            onCancelEditRequest={mutations.handleCancelEditRequest}
            isRequestingEdit={isRequestingEdit}
            hasRequestedEdit={submission.editRequested}
            editRequestCount={submission.editRequestCount ?? 0}
            onDeleteSubmission={mutations.handleDeleteSubmission}
            onRequestRemoveActivity={mutations.handleRequestRemoveActivity}
            isSaving={draft.isSaving}
            isSaved={draft.isSaved}
            lastSavedTime={draft.lastSavedTime}
            lastAutoSavedTime={draft.lastAutoSavedTime}
        />
    );

    return (
        <FormShellProvider value={shell}>
            <AipProvider state={state} dispatch={dispatch}>
                <FormShellLayout
                    loading={data.isLoading}
                    loadingMessage="Loading AIP..."
                    motionProps={motionProps}
                    splash={(
                        <>
                            <FormHeader title="Annual Implementation Plan" programName={profile.depedProgram} onBack={handleBack} theme="pink" />
                            {programState.loadError && (
                                <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                                    {programState.loadError}
                                </div>
                            )}
                            <ViewModeSelector
                                programs={programState.programList}
                                programAbbreviations={programState.programAbbreviations}
                                onStart={handleStart}
                                draftPrograms={programState.draftPrograms}
                                completedPrograms={programState.completedPrograms}
                                returnedPrograms={programState.returnedPrograms}
                                autosavedPrograms={programState.autosavedPrograms}
                                onBulkDelete={mutations.handleBulkDelete}
                                theme="pink" isMobile={shell.isMobile}
                                selectedProgram={shell.splashSelectedProgram}
                                onSelectProgram={(program) => {
                                    shell.setSplashSelectedProgram(program);
                                    setSearchParams(program ? { program } : {}, { replace: true });
                                }}
                            />
                        </>
                    )}
                    readonly={renderEditor()}
                    editor={renderEditor()}
                    afterAnimate={(
                        <>
                            <ConfirmationModal
                                isOpen={shell.modal.isOpen} onClose={shell.modal.onClose ?? shell.closeModal}
                                onConfirm={shell.modal.onConfirm} type={shell.modal.type} title={shell.modal.title}
                                message={shell.modal.message} confirmText={shell.modal.confirmText}
                                cancelText={shell.modal.cancelText} hideCancelButton={shell.modal.hideCancelButton}
                                extraAction={shell.modal.extraAction}
                            />
                            <ConfirmationModal
                                isOpen={showFinalConfirm} onClose={() => setShowFinalConfirm(false)}
                                onConfirm={() => { setShowFinalConfirm(false); mutations.handleConfirmSubmit(); }}
                                type="warning"
                                title={submission.isEditing ? 'Save AIP changes?' : 'Submit this AIP?'}
                                message={submission.isEditing ? 'Your updated AIP will stay in the review process after you save these changes.' : 'Your AIP will be sent for review after submission. You can still edit it while it is pending.'}
                                confirmText={submission.isEditing ? 'Save changes' : 'Submit AIP'}
                                cancelText="Keep editing"
                            />
                            <DeletedProgramsPopup
                                toast={toast} deletedPopup={deletedPopup}
                                onToastClick={() => setDeletedPopup(toast.programs)}
                                onClose={() => setDeletedPopup(null)}
                            />
                        </>
                    )}
                />
            </AipProvider>
        </FormShellProvider>
    );
}
