import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import api from '../../lib/api.js';
import { FormHeader } from '../../components/ui/FormHeader';
import { ViewModeSelector } from '../../components/ui/ViewModeSelector';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useAccessibility } from '../../context/AccessibilityContext';
import { emitOnboardingSignal } from '../../lib/onboardingSignals.js';
import FormShellLayout from '../shared/FormShellLayout.jsx';
import { FormShellProvider } from '../shared/formShellContext.jsx';
import useFormShell from '../shared/useFormShell.js';
import useProgramsAndConfig from '../shared/useProgramsAndConfig.js';
import useAipFormState from './useAipFormState.js';
import { AipProvider, selectAipProfile, selectAipSubmission } from './aipContext.jsx';
import useAipDraft from './useAipDraft.js';
import { buildAipPayload } from './buildAipPayload.js';
import submitAip from './submitAip.js';
import AIPFormEditor from './AIPFormEditor.jsx';

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

    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch {
        sessionStorage.removeItem('user');
    }

    const schoolOrUserId = user?.school_id || user?.id;
    const data = useProgramsAndConfig({
        kind: 'aip',
        schoolOrUserId,
    });
    const [state, dispatch] = useAipFormState({ year: String(new Date().getFullYear()) });
    const profile = selectAipProfile(state);
    const submission = selectAipSubmission(state);

    const [programList, setProgramList] = useState([]);
    const [programAbbreviations, setProgramAbbreviations] = useState({});
    const [completedPrograms, setCompletedPrograms] = useState([]);
    const [returnedPrograms, setReturnedPrograms] = useState([]);
    const [draftPrograms, setDraftPrograms] = useState([]);
    const [autosavedPrograms, setAutosavedPrograms] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);
    const [toast, setToast] = useState(null);
    const [deletedPopup, setDeletedPopup] = useState(null);

    const reviewAreaRef = useRef(null);
    const toastTimerRef = useRef(null);
    const appModeRef = useRef(shell.appMode);
    const autoStartedRef = useRef(false);

    useEffect(() => {
        appModeRef.current = shell.appMode;
    }, [shell.appMode]);

    useEffect(() => {
        setProgramList(data.programList);
        setProgramAbbreviations(data.programAbbreviations);
        setCompletedPrograms(data.completedPrograms);
        setReturnedPrograms(data.returnedPrograms);
        setDraftPrograms(data.draftPrograms);
        setLoadError(typeof data.error === 'string' ? data.error : (data.error?.friendlyMessage ?? null));
        dispatch({
            type: 'SET_SUGGESTIONS',
            payload: {
                coordinatorSuggestions: data.coordinatorSuggestions,
                personsTerms: data.personsTerms,
            },
        });
    }, [
        data.completedPrograms,
        data.coordinatorSuggestions,
        data.draftPrograms,
        data.error,
        data.personsTerms,
        data.programAbbreviations,
        data.programList,
        data.returnedPrograms,
        dispatch,
    ]);

    const handleManualDraftSaved = useCallback(() => {
        const storageKey = `aip_draft_${profile.depedProgram}_${profile.year}`;
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // Ignore storage failures.
        }
        setAutosavedPrograms((currentPrograms) => currentPrograms.filter((program) => program !== profile.depedProgram));
        emitOnboardingSignal('author.draft_saved', { source: 'server-draft' });
    }, [profile.depedProgram, profile.year]);

    const draft = useAipDraft({
        appMode: shell.appMode,
        state,
        onHydrate: (draftData) => {
            dispatch({ type: 'HYDRATE_DRAFT', payload: { draft: draftData } });
        },
        onAutosave: () => {
            if (profile.depedProgram) {
                setAutosavedPrograms((currentPrograms) => (
                    currentPrograms.includes(profile.depedProgram)
                        ? currentPrograms
                        : [...currentPrograms, profile.depedProgram]
                ));
            }
            emitOnboardingSignal('author.draft_saved', { source: 'autosave' });
        },
        afterManualSave: handleManualDraftSaved,
    });

    useEffect(() => {
        if (!profile.year || programList.length === 0) {
            return;
        }

        completedPrograms.forEach((program) => {
            try {
                localStorage.removeItem(`aip_draft_${program}_${profile.year}`);
            } catch {
                // Ignore local storage failures.
            }
        });

        const nextAutosavedPrograms = programList.filter((program) => (
            !completedPrograms.includes(program)
            && localStorage.getItem(`aip_draft_${program}_${profile.year}`) !== null
        ));
        setAutosavedPrograms(nextAutosavedPrograms);
    }, [completedPrograms, profile.year, programList]);

    useEffect(() => {
        if (toast) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => setToast(null), 4000);
        }
        return () => clearTimeout(toastTimerRef.current);
    }, [toast]);

    useEffect(() => {
        const reviewArea = reviewAreaRef.current;
        if (!reviewArea || shell.appMode === 'splash' || shell.appMode === 'readonly') {
            return undefined;
        }

        if (typeof IntersectionObserver === 'undefined') {
            emitOnboardingSignal('author.review_area_opened');
            return undefined;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                emitOnboardingSignal('author.review_area_opened');
                observer.disconnect();
            }
        }, { threshold: 0.35 });

        observer.observe(reviewArea);
        return () => observer.disconnect();
    }, [shell.appMode, shell.currentStep]);

    const showToast = useCallback((programs) => {
        const count = programs.length;
        const message = count === 1
            ? `"${programs[0]}" deleted.`
            : count === 2
                ? `"${programs[0]}" and "${programs[1]}" deleted.`
                : `${count} programs deleted.`;
        setToast({ message, programs });
    }, []);

    const resetFormState = useCallback((selectedProgram = '') => {
        dispatch({ type: 'RESET', payload: { year: String(new Date().getFullYear()) } });
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'depedProgram', value: selectedProgram } });
        dispatch({
            type: 'SET_SUGGESTIONS',
            payload: {
                coordinatorSuggestions: data.coordinatorSuggestions,
                personsTerms: data.personsTerms,
            },
        });
        shell.setCurrentStep(1);
    }, [data.coordinatorSuggestions, data.personsTerms, dispatch, shell]);

    const loadServerDraft = useCallback(async (selectedProgram, yearValue) => {
        const draftResponse = await api.get('/api/aips/draft', {
            params: {
                program_title: selectedProgram,
                year: parseInt(yearValue, 10),
            },
        });

        if (draftResponse.data.hasDraft) {
            draft.hydrate(draftResponse.data.draftData);
            return true;
        }

        return false;
    }, [draft]);

    const hasInputtedData = useCallback(() => {
        return profile.outcome
            || profile.sipTitle
            || profile.projectCoord
            || state.objectives.some((objective) => objective.trim())
            || state.indicators.some((indicator) => indicator.description.trim() || indicator.target.trim())
            || state.signatories.preparedByName
            || state.signatories.approvedByName
            || state.activities.some((activity) => activity.name || activity.period || activity.persons || activity.outputs || activity.budgetAmount || activity.budgetSource);
    }, [profile.outcome, profile.projectCoord, profile.sipTitle, state.activities, state.indicators, state.objectives, state.signatories.approvedByName, state.signatories.preparedByName]);

    const handleStart = useCallback(async (mode, selectedProgram) => {
        if (!selectedProgram) {
            return;
        }

        const currentYear = String(new Date().getFullYear());
        resetFormState(selectedProgram);
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isSubmitted', value: false } });
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });

        if (mode !== 'readonly') {
            emitOnboardingSignal('author.program_selected', { program: selectedProgram, mode });
        }

        if (mode === 'readonly') {
            try {
                const response = await api.get('/api/aips', {
                    params: { program_title: selectedProgram, year: new Date().getFullYear() },
                });
                dispatch({ type: 'HYDRATE_SUBMITTED', payload: { aip: response.data } });
            } catch (error) {
                setLoadError(error?.friendlyMessage ?? 'Failed to load the AIP. Please try again.');
                return;
            }

            shell.setAppMode('readonly');
            setSearchParams({ program: selectedProgram, mode: 'readonly' }, { replace: true });
            return;
        }

        const localStorageKey = `aip_draft_${selectedProgram}_${currentYear}`;
        const localDraft = draft.readDraft(localStorageKey);

        if (localDraft) {
            const hasServerDraft = draftPrograms.includes(selectedProgram);
            shell.openModal({
                type: 'warning',
                title: 'Continue your saved draft?',
                message: `We found an auto-saved draft from ${new Date(localDraft.savedAt).toLocaleString()}. Continue from that draft?${hasServerDraft ? ' You can also skip it and open your last saved draft instead.' : ''}`,
                confirmText: 'Continue draft',
                cancelText: hasServerDraft ? 'Open saved draft' : 'Start fresh',
                onConfirm: () => {
                    draft.hydrate(localDraft);
                    shell.closeModal();
                    shell.setAppMode(mode);
                    setSearchParams({ program: selectedProgram, mode }, { replace: true });
                },
                onClose: async () => {
                    shell.closeModal();
                    draft.clearDraft(localStorageKey);
                    if (hasServerDraft) {
                        try {
                            await loadServerDraft(selectedProgram, currentYear);
                        } catch {
                            // Fall back to blank form.
                        }
                    }
                    shell.setAppMode(mode);
                    setSearchParams({ program: selectedProgram, mode }, { replace: true });
                },
            });
            return;
        }

        if (draftPrograms.includes(selectedProgram)) {
            try {
                await loadServerDraft(selectedProgram, currentYear);
            } catch {
                // Continue with a blank form.
            }
        }

        shell.setAppMode(mode);
        setSearchParams({ program: selectedProgram, mode }, { replace: true });
    }, [dispatch, draft, draftPrograms, loadServerDraft, resetFormState, setSearchParams, shell]);

    const handleBack = useCallback(() => {
        if (submission.isEditing) {
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
            shell.setAppMode('readonly');
            setSearchParams({ program: profile.depedProgram, mode: 'readonly' }, { replace: true });
            return;
        }

        if (shell.appMode === 'splash') {
            navigate('/');
            return;
        }

        if (hasInputtedData()) {
            draft.saveNow();
        }

        shell.setAppMode('splash');
        setSearchParams({}, { replace: true });
    }, [dispatch, draft, hasInputtedData, navigate, profile.depedProgram, setSearchParams, shell, submission.isEditing]);

    const handleHome = useCallback(() => {
        if (hasInputtedData()) {
            draft.saveNow();
        }
        navigate('/');
    }, [draft, hasInputtedData, navigate]);

    useEffect(() => {
        if (data.isLoading || autoStartedRef.current) {
            return;
        }

        autoStartedRef.current = true;
        const paramProgram = searchParams.get('program');
        const paramMode = searchParams.get('mode');

        if (paramProgram && ['wizard', 'full', 'readonly'].includes(paramMode)) {
            handleStart(paramMode, paramProgram);
        } else if (paramProgram && !paramMode) {
            shell.setSplashSelectedProgram(paramProgram);
        }
    }, [data.isLoading, handleStart, searchParams, shell]);

    useEffect(() => {
        if (!autoStartedRef.current) {
            return;
        }

        const paramProgram = searchParams.get('program');
        const paramMode = searchParams.get('mode');

        if (!paramProgram) {
            shell.setSplashSelectedProgram(null);
            if (appModeRef.current !== 'splash') {
                shell.setAppMode('splash');
                dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'depedProgram', value: '' } });
            }
        } else if (!paramMode) {
            shell.setSplashSelectedProgram(paramProgram);
            if (appModeRef.current !== 'splash') {
                shell.setAppMode('splash');
                dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'depedProgram', value: '' } });
            }
        } else if (appModeRef.current === 'splash') {
            handleStart(paramMode, paramProgram);
        }
    }, [dispatch, handleStart, searchParams, shell]);

    const handleToggleAppMode = useCallback(() => {
        const nextMode = shell.appMode === 'wizard' ? 'full' : 'wizard';
        shell.setAppMode(nextMode);
        setSearchParams({ program: profile.depedProgram, mode: nextMode }, { replace: true });
    }, [profile.depedProgram, setSearchParams, shell]);

    const handleBulkDelete = useCallback((programsToDelete) => {
        shell.openModal({
            type: 'warning',
            title: `Delete ${programsToDelete.length} AIP${programsToDelete.length > 1 ? 's' : ''}?`,
            message: `This will permanently delete ${programsToDelete.length} AIP submission${programsToDelete.length > 1 ? 's' : ''}. This cannot be undone.`,
            confirmText: `Yes, Delete ${programsToDelete.length > 1 ? 'All' : 'It'}`,
            onConfirm: async () => {
                shell.closeModal();
                const currentYear = parseInt(profile.year, 10);
                const results = await Promise.allSettled(
                    programsToDelete.map((program) => (
                        api.delete('/api/aips', { params: { program_title: program, year: currentYear } })
                    )),
                );
                const deletedPrograms = programsToDelete.filter((_, index) => results[index].status === 'fulfilled');
                if (deletedPrograms.length > 0) {
                    setCompletedPrograms((currentPrograms) => currentPrograms.filter((program) => !deletedPrograms.includes(program)));
                    setReturnedPrograms((currentPrograms) => currentPrograms.filter((program) => !deletedPrograms.includes(program)));
                    setDraftPrograms((currentPrograms) => currentPrograms.filter((program) => !deletedPrograms.includes(program)));
                    showToast(deletedPrograms);
                }
            },
        });
    }, [profile.year, shell, showToast]);

    const handleEditAIP = useCallback(() => {
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: true } });
        shell.setCurrentStep(1);
        shell.setAppMode('wizard');
        setSearchParams({ program: profile.depedProgram, mode: 'wizard' }, { replace: true });
    }, [dispatch, profile.depedProgram, setSearchParams, shell]);

    const handleDeleteSubmission = useCallback(() => {
        shell.openModal({
            type: 'warning',
            title: 'Delete Submission?',
            message: 'This will permanently delete your submitted AIP. This action cannot be undone. Are you sure you want to proceed?',
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                shell.closeModal();
                try {
                    await api.delete('/api/aips', { params: { program_title: profile.depedProgram, year: profile.year } });
                    setCompletedPrograms((currentPrograms) => currentPrograms.filter((program) => program !== profile.depedProgram));
                    setReturnedPrograms((currentPrograms) => currentPrograms.filter((program) => program !== profile.depedProgram));
                    setDraftPrograms((currentPrograms) => currentPrograms.filter((program) => program !== profile.depedProgram));
                    showToast([profile.depedProgram]);
                    shell.setAppMode('splash');
                    setSearchParams({}, { replace: true });
                } catch (error) {
                    shell.openModal({
                        type: 'warning',
                        title: "We couldn't delete this AIP",
                        message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.',
                        confirmText: 'Close',
                        onConfirm: shell.closeModal,
                    });
                }
            },
        });
    }, [profile.depedProgram, profile.year, setSearchParams, shell, showToast]);

    const handleRequestRemoveActivity = useCallback((activityId) => {
        const activity = state.activities.find((currentActivity) => currentActivity.id === activityId);
        const hasData = activity && [activity.name, activity.period, activity.persons, activity.outputs, activity.budgetAmount, activity.budgetSource].some((value) => String(value).trim() !== '');

        if (hasData) {
            shell.openModal({
                type: 'warning',
                title: 'Delete Activity?',
                message: 'This activity contains data. Are you sure you want to permanently remove it?',
                confirmText: 'Yes, Delete',
                onConfirm: () => {
                    dispatch({ type: 'REMOVE_ACTIVITY', payload: { id: activityId } });
                    shell.closeModal();
                },
            });
            return;
        }

        dispatch({ type: 'REMOVE_ACTIVITY', payload: { id: activityId } });
    }, [dispatch, shell, state.activities]);

    const handleConfirmSubmit = useCallback(async () => {
        const payload = buildAipPayload(state);
        const validationErrors = [];

        if (!profile.outcome) {
            validationErrors.push('Please choose an Outcome Category.');
        }
        if (!profile.sipTitle.trim()) {
            validationErrors.push('Please enter a SIP Title.');
        }
        if (payload.activities.length === 0) {
            validationErrors.push('Add at least one activity before submitting.');
        }

        if (validationErrors.length > 0) {
            shell.openModal({
                type: 'warning',
                title: 'Complete the required fields',
                message: validationErrors.join(' '),
                confirmText: 'Review form',
                onConfirm: shell.closeModal,
            });
            return;
        }

        try {
            await submitAip({
                body: payload,
                aipId: submission.aipId,
                isEditing: submission.isEditing,
            });

            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isSubmitted', value: true } });
            draft.clearDraft(`aip_draft_${profile.depedProgram}_${profile.year}`);

            shell.openModal({
                type: 'success',
                title: submission.isEditing ? 'AIP updated' : 'AIP submitted',
                message: submission.isEditing
                    ? 'Your changes have been saved and sent back for review.'
                    : 'Your AIP - Annual Plan has been submitted. You can review it from your submission history.',
                confirmText: 'View Submission',
                onConfirm: () => {
                    shell.closeModal();
                    shell.setAppMode('readonly');
                    setSearchParams({ program: profile.depedProgram, mode: 'readonly' }, { replace: true });
                },
                hideCancelButton: true,
                extraAction: {
                    text: 'Back to Dashboard',
                    onClick: () => {
                        shell.closeModal();
                        navigate('/');
                    },
                },
            });
        } catch (error) {
            shell.openModal({
                type: 'warning',
                title: submission.isEditing ? "We couldn't update this AIP" : "We couldn't submit this AIP",
                message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.',
                confirmText: 'Close',
                onConfirm: shell.closeModal,
            });
        }
    }, [dispatch, draft, navigate, profile.depedProgram, profile.outcome, profile.sipTitle, profile.year, setSearchParams, shell, state, submission.aipId, submission.isEditing]);

    const renderEditor = () => (
        <AIPFormEditor
            motionProps={motionProps}
            toggleAppMode={handleToggleAppMode}
            reviewAreaRef={reviewAreaRef}
            isPreviewOpen={isPreviewOpen}
            onPreviewOpen={setIsPreviewOpen}
            onSaveForLater={draft.saveNow}
            onShowFinalConfirm={setShowFinalConfirm}
            onBack={handleBack}
            onHome={handleHome}
            onEditAIP={handleEditAIP}
            onDeleteSubmission={handleDeleteSubmission}
            onRequestRemoveActivity={handleRequestRemoveActivity}
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
                            <FormHeader
                                title="Annual Implementation Plan"
                                programName={profile.depedProgram}
                                onBack={handleBack}
                                theme="pink"
                            />
                            {loadError && (
                                <div className="mx-auto max-w-2xl mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium">
                                    {loadError}
                                </div>
                            )}
                            <ViewModeSelector
                                programs={programList}
                                programAbbreviations={programAbbreviations}
                                onStart={handleStart}
                                draftPrograms={draftPrograms}
                                completedPrograms={completedPrograms}
                                returnedPrograms={returnedPrograms}
                                autosavedPrograms={autosavedPrograms}
                                onBulkDelete={handleBulkDelete}
                                theme="pink"
                                isMobile={shell.isMobile}
                                selectedProgram={shell.splashSelectedProgram}
                                onSelectProgram={(program) => {
                                    shell.setSplashSelectedProgram(program);
                                    if (program) {
                                        setSearchParams({ program }, { replace: true });
                                    } else {
                                        setSearchParams({}, { replace: true });
                                    }
                                }}
                            />
                        </>
                    )}
                    readonly={renderEditor()}
                    editor={renderEditor()}
                    afterAnimate={(
                        <>
                            <ConfirmationModal
                                isOpen={shell.modal.isOpen}
                                onClose={shell.modal.onClose ?? shell.closeModal}
                                onConfirm={shell.modal.onConfirm}
                                type={shell.modal.type}
                                title={shell.modal.title}
                                message={shell.modal.message}
                                confirmText={shell.modal.confirmText}
                                cancelText={shell.modal.cancelText}
                                hideCancelButton={shell.modal.hideCancelButton}
                                extraAction={shell.modal.extraAction}
                            />
                            <ConfirmationModal
                                isOpen={showFinalConfirm}
                                onClose={() => setShowFinalConfirm(false)}
                                onConfirm={() => {
                                    setShowFinalConfirm(false);
                                    handleConfirmSubmit();
                                }}
                                type="warning"
                                title={submission.isEditing ? 'Save AIP changes?' : 'Submit this AIP?'}
                                message={submission.isEditing ? 'Your updated AIP will stay in the review process after you save these changes.' : 'Your AIP will be sent for review after submission. You can still edit it while it is pending.'}
                                confirmText={submission.isEditing ? 'Save changes' : 'Submit AIP'}
                                cancelText="Keep editing"
                            />
                            {toast && (
                                <button
                                    onClick={() => setDeletedPopup(toast.programs)}
                                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border text-sm font-bold bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 transition-colors cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    {toast.message}
                                    <span className="text-[10px] font-semibold opacity-60 border border-current rounded px-1.5 py-0.5 ml-1">details</span>
                                </button>
                            )}
                            {deletedPopup && (
                                <div
                                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 backdrop-blur-sm"
                                    onClick={() => setDeletedPopup(null)}
                                >
                                    <div
                                        className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Deleted Programs</h3>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{deletedPopup.length} AIP{deletedPopup.length > 1 ? 's' : ''} removed</p>
                                            </div>
                                        </div>
                                        <ul className="space-y-2 mb-5 max-h-60 overflow-y-auto">
                                            {deletedPopup.map((program) => (
                                                <li key={program} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 py-1.5 border-b border-slate-100 dark:border-dark-border last:border-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    {program}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => setDeletedPopup(null)}
                                            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                />
            </AipProvider>
        </FormShellProvider>
    );
}
