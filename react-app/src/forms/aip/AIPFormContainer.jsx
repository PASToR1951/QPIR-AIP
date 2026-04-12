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
import useFormLifecycle from '../shared/useFormLifecycle.js';
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
    const rawPrograms = data.rawPrograms ?? [];

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

    const findProgramByTitle = useCallback((programTitle) => (
        rawPrograms.find((program) => program.title === programTitle) ?? null
    ), [rawPrograms]);

    const buildProgramParams = useCallback((programTitle, extraParams = {}) => {
        const program = findProgramByTitle(programTitle);
        return {
            ...extraParams,
            program_title: programTitle,
            ...(program?.id ? { program_id: program.id } : {}),
        };
    }, [findProgramByTitle]);

    const resetFormState = useCallback((selectedProgram = '') => {
        const selectedProgramRecord = findProgramByTitle(selectedProgram);
        dispatch({ type: 'RESET', payload: { year: String(new Date().getFullYear()) } });
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'depedProgram', value: selectedProgram } });
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'programId', value: selectedProgramRecord?.id ?? null } });
        dispatch({
            type: 'SET_SUGGESTIONS',
            payload: {
                coordinatorSuggestions: data.coordinatorSuggestions,
                personsTerms: data.personsTerms,
            },
        });
        shell.setCurrentStep(1);
    }, [data.coordinatorSuggestions, data.personsTerms, dispatch, findProgramByTitle, shell]);

    const loadServerDraft = useCallback(async (selectedProgram, yearValue) => {
        const draftResponse = await api.get('/api/aips/draft', {
            params: buildProgramParams(selectedProgram, {
                year: parseInt(yearValue, 10),
            }),
        });

        if (draftResponse.data.hasDraft) {
            draft.hydrate(draftResponse.data.draftData);
            return true;
        }

        return false;
    }, [buildProgramParams, draft]);

    const applyTemplateForProgram = useCallback(async (selectedProgram) => {
        const selectedProgramRecord = findProgramByTitle(selectedProgram);
        if (!selectedProgramRecord?.id) {
            return false;
        }

        const templateResponse = await api.get(`/api/programs/${selectedProgramRecord.id}/template`);
        const template = templateResponse.data;
        if (!template) {
            return false;
        }

        dispatch({
            type: 'APPLY_TEMPLATE',
            payload: {
                outcome: template.outcome,
                targetDescription: template.target_description,
                indicators: template.indicators ?? [],
            },
        });
        return true;
    }, [dispatch, findProgramByTitle]);

    const hasInputtedData = useCallback(() => (
        profile.outcome
        || profile.sipTitle
        || profile.projectCoord
        || state.objectives.some((objective) => objective.trim())
        || state.indicators.some((indicator) => indicator.description.trim() || indicator.target.trim())
        || state.signatories.preparedByName
        || state.signatories.approvedByName
        || state.activities.some((activity) => activity.name || activity.period || activity.persons || activity.outputs || activity.budgetAmount || activity.budgetSource)
    ), [
        profile.outcome,
        profile.projectCoord,
        profile.sipTitle,
        state.activities,
        state.indicators,
        state.objectives,
        state.signatories.approvedByName,
        state.signatories.preparedByName,
    ]);

    const { handleStart, handleBack, handleHome, handleToggleAppMode } = useFormLifecycle({
        shell,
        searchParams,
        setSearchParams,
        navigate,
        isLoading: data.isLoading,
        currentProgram: profile.depedProgram,
        isEditing: submission.isEditing,
        hasInputtedData,
        draft,
        resetFormState,
        resetSubmissionState: () => {
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isSubmitted', value: false } });
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
        },
        exitEditMode: () => {
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
        },
        clearProgramField: () => {
            dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'depedProgram', value: '' } });
            dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'programId', value: null } });
        },
        loadReadonlyRecord: async (selectedProgram) => {
            const response = await api.get('/api/aips', {
                params: buildProgramParams(selectedProgram, { year: new Date().getFullYear() }),
            });
            dispatch({ type: 'HYDRATE_SUBMITTED', payload: { aip: response.data } });
        },
        hydrateDraft: (draftData) => {
            draft.hydrate(draftData);
        },
        getLocalDraftKey: (selectedProgram) => `aip_draft_${selectedProgram}_${String(new Date().getFullYear())}`,
        getLocalDraftModal: ({ localDraft }) => ({
            type: 'warning',
            title: 'Continue your saved draft?',
            message: `We found an auto-saved draft from ${new Date(localDraft.savedAt).toLocaleString()}. Continue from that draft?`,
            confirmText: 'Continue draft',
            cancelText: 'Continue without local draft',
        }),
        loadInitialDraft: async (selectedProgram) => {
            const currentYear = String(new Date().getFullYear());
            const hasServerDraft = await loadServerDraft(selectedProgram, currentYear);
            if (!hasServerDraft) {
                await applyTemplateForProgram(selectedProgram);
            }
        },
        loadDiscardedLocalDraftFallback: async (selectedProgram) => {
            const currentYear = String(new Date().getFullYear());
            const hasServerDraft = await loadServerDraft(selectedProgram, currentYear);
            if (!hasServerDraft) {
                await applyTemplateForProgram(selectedProgram);
            }
        },
        onBeforeStart: ({ mode, selectedProgram }) => {
            setLoadError(null);
            if (mode !== 'readonly') {
                emitOnboardingSignal('author.program_selected', { program: selectedProgram, mode });
            }
        },
        onReadonlyError: (error) => {
            setLoadError(error?.friendlyMessage ?? 'Failed to load the AIP. Please try again.');
        },
    });

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
                        api.delete('/api/aips', { params: buildProgramParams(program, { year: currentYear }) })
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
    }, [buildProgramParams, profile.year, shell, showToast]);

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
                    await api.delete('/api/aips', { params: buildProgramParams(profile.depedProgram, { year: profile.year }) });
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
    }, [buildProgramParams, profile.depedProgram, profile.year, setSearchParams, shell, showToast]);

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
                                <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
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
                                    className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/70"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    {toast.message}
                                    <span className="ml-1 rounded border border-current px-1.5 py-0.5 text-[10px] font-semibold opacity-60">details</span>
                                </button>
                            )}
                            {deletedPopup && (
                                <div
                                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 backdrop-blur-sm"
                                    onClick={() => setDeletedPopup(null)}
                                >
                                    <div
                                        className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-dark-border dark:bg-dark-surface"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6" />
                                                    <path d="M14 11v6" />
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Deleted Programs</h3>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{deletedPopup.length} AIP{deletedPopup.length > 1 ? 's' : ''} removed</p>
                                            </div>
                                        </div>
                                        <ul className="mb-5 max-h-60 space-y-2 overflow-y-auto">
                                            {deletedPopup.map((program) => (
                                                <li key={program} className="flex items-center gap-2.5 border-b border-slate-100 py-1.5 text-sm text-slate-700 last:border-0 dark:border-dark-border dark:text-slate-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-500">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    {program}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => setDeletedPopup(null)}
                                            className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-dark-border dark:text-slate-300 dark:hover:bg-dark-border/80"
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
