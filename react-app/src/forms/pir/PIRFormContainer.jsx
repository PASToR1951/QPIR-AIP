import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import api from '../../lib/api.js';
import { FormHeader } from '../../components/ui/FormHeader';
import { ViewModeSelector } from '../../components/ui/ViewModeSelector';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useAccessibility } from '../../context/AccessibilityContext';
import FormShellLayout from '../shared/FormShellLayout.jsx';
import { FormShellProvider } from '../shared/formShellContext.jsx';
import useFormShell from '../shared/useFormShell.js';
import useProgramsAndConfig from '../shared/useProgramsAndConfig.js';
import useFormLifecycle from '../shared/useFormLifecycle.js';
import usePirFormState, { createEmptyPirActivity } from './usePirFormState.js';
import { PirProvider } from './pirContext.jsx';
import usePirDraft from './usePirDraft.js';
import usePirAipActivities from './usePirAipActivities.js';
import { buildPirPayload } from './buildPirPayload.js';
import submitPir from './submitPir.js';
import PIRFormEditor from './PIRFormEditor.jsx';

function getQuarterString() {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();

    if (month <= 2) return `1st Quarter CY ${year}`;
    if (month <= 5) return `2nd Quarter CY ${year}`;
    if (month <= 8) return `3rd Quarter CY ${year}`;
    return `4th Quarter CY ${year}`;
}

function getQuarterNumber(quarterString) {
    if (quarterString.startsWith('1st')) return 1;
    if (quarterString.startsWith('2nd')) return 2;
    if (quarterString.startsWith('3rd')) return 3;
    return 4;
}

export default function PIRFormContainer() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { settings } = useAccessibility();
    const shell = useFormShell({ totalSteps: 6, isMobileBreakpoint: 768 });
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

    const isDivisionPersonnel = user?.role === 'Division Personnel';
    const quarterString = useMemo(() => getQuarterString(), []);
    const currentQuarterNum = useMemo(() => getQuarterNumber(quarterString), [quarterString]);

    const data = useProgramsAndConfig({
        kind: 'pir',
        quarter: quarterString,
    });
    const [state, dispatch] = usePirFormState({
        isDivisionPersonnel,
        schoolName: user?.school_name || '',
    });

    const profile = state.profile;
    const budget = state.budget;
    const activities = state.activities;
    const factors = state.factors;
    const actionItems = state.actionItems;
    const submission = state.submission;

    const [programsWithAIPs, setProgramsWithAIPs] = useState([]);
    const [programAbbreviations, setProgramAbbreviations] = useState({});
    const [completedPrograms, setCompletedPrograms] = useState([]);
    const [supervisorName, setSupervisorName] = useState('');
    const [supervisorTitle, setSupervisorTitle] = useState('');
    const [serverDraft, setServerDraft] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isAIPPreviewOpen, setIsAIPPreviewOpen] = useState(false);
    const [aipDocumentData, setAipDocumentData] = useState(null);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);

    useEffect(() => {
        setProgramsWithAIPs(data.programsWithAIPs);
        setProgramAbbreviations(data.programAbbreviations);
        setCompletedPrograms(data.completedPrograms);
        setSupervisorName(data.supervisorName);
        setSupervisorTitle(data.supervisorTitle);
        setServerDraft(data.draft);
    }, [
        data.completedPrograms,
        data.draft,
        data.programAbbreviations,
        data.programsWithAIPs,
        data.supervisorName,
        data.supervisorTitle,
    ]);

    const draft = usePirDraft({
        appMode: shell.appMode,
        state,
        quarterString,
        isDivisionPersonnel,
        onHydrate: (draftData) => {
            dispatch({ type: 'HYDRATE_DRAFT', payload: { draft: draftData, isDivisionPersonnel } });
        },
    });

    const aipActivities = usePirAipActivities({
        program: profile.program,
        quarterString,
        currentQuarterNum,
        isDivisionPersonnel,
        user,
        onActivitiesLoaded: (nextActivities) => {
            dispatch({ type: 'REPLACE_ACTIVITIES_FROM_AIP', payload: { activities: nextActivities } });
        },
        onIndicatorsLoaded: (nextIndicators) => {
            dispatch({ type: 'SET_INDICATOR_TARGETS', payload: nextIndicators });
        },
        onOwnerLoaded: (ownerName) => {
            dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'owner', value: ownerName } });
            dispatch({ type: 'SET_OWNER_LOCKED', payload: true });
        },
    });

    useEffect(() => {
        dispatch({ type: 'SET_OWNER_LOCKED', payload: false });
        setAipDocumentData(null);
    }, [dispatch, profile.program]);

    const resetFormState = useCallback((selectedProgram = '') => {
        dispatch({
            type: 'RESET',
            payload: {
                isDivisionPersonnel,
                schoolName: user?.school_name || '',
            },
        });
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'program', value: selectedProgram } });
        shell.setCurrentStep(1);
    }, [dispatch, isDivisionPersonnel, shell, user?.school_name]);

    const hydrateLocalOrServerDraft = useCallback((draftData) => {
        if (draftData?.indicatorQuarterlyTargets?.length) {
            aipActivities.markDraftIndicatorsHydrated();
        }
        draft.hydrate(draftData);
    }, [aipActivities, draft]);

    const loadServerDraft = useCallback(async (selectedProgram) => {
        const response = await api.get('/api/pirs/draft', {
            params: { program_title: selectedProgram, quarter: quarterString },
        });

        if (response.data.hasDraft) {
            hydrateLocalOrServerDraft(response.data.draftData);
            return true;
        }

        return false;
    }, [hydrateLocalOrServerDraft, quarterString]);

    const hasInputtedData = useCallback(() => (
        profile.program
        || profile.school
        || profile.owner
        || budget.fromDivision
        || budget.fromCoPSF
        || activities.some((activity) => activity.name || activity.physTarget || activity.finTarget || activity.physAcc || activity.finAcc || activity.actions)
        || Object.values(factors).some((factor) => factor.facilitating || factor.hindering)
        || actionItems.some((item) => item.action)
    ), [
        actionItems,
        activities,
        budget.fromCoPSF,
        budget.fromDivision,
        factors,
        profile.owner,
        profile.program,
        profile.school,
    ]);

    const { handleStart, handleBack, handleHome, handleToggleAppMode } = useFormLifecycle({
        shell,
        searchParams,
        setSearchParams,
        navigate,
        isLoading: data.isLoading,
        currentProgram: profile.program,
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
            dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'program', value: '' } });
        },
        loadReadonlyRecord: async (selectedProgram) => {
            aipActivities.markActivityReviewsHydrated();
            const response = await api.get('/api/pirs', {
                params: { program_title: selectedProgram, quarter: quarterString },
            });
            dispatch({ type: 'HYDRATE_SUBMITTED', payload: { pir: response.data } });
        },
        hydrateDraft: hydrateLocalOrServerDraft,
        getLocalDraftKey: (selectedProgram) => `pir_draft_${selectedProgram}_${quarterString}`,
        getLocalDraftModal: ({ localDraft }) => ({
            type: 'warning',
            title: 'Continue your saved draft?',
            message: `We found an auto-saved draft from ${new Date(localDraft.savedAt).toLocaleString()}. Continue from that draft?`,
            confirmText: 'Continue draft',
            cancelText: 'Open saved draft',
        }),
        loadInitialDraft: async (selectedProgram) => {
            if (serverDraft?.draftProgram === selectedProgram && serverDraft.draftData) {
                hydrateLocalOrServerDraft(serverDraft.draftData);
            }
        },
        loadDiscardedLocalDraftFallback: async (selectedProgram) => {
            await loadServerDraft(selectedProgram);
        },
    });

    const handleEditPIR = useCallback(() => {
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: true } });
        shell.setAppMode('wizard');
        setSearchParams({ program: profile.program, mode: 'wizard' }, { replace: true });
    }, [dispatch, profile.program, setSearchParams, shell]);

    const handleDeletePIR = useCallback(() => {
        shell.openModal({
            type: 'warning',
            title: 'Delete Submitted PIR?',
            message: 'This will permanently delete your submitted PIR for this quarter. This cannot be undone.',
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                shell.closeModal();
                try {
                    await api.delete(`/api/pirs/${submission.pirId}`);
                    setCompletedPrograms((currentPrograms) => currentPrograms.filter((program) => program !== profile.program));
                    dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'pirId', value: null } });
                    dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'pirStatus', value: null } });
                    dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
                    shell.setAppMode('splash');
                    setSearchParams({}, { replace: true });
                } catch (error) {
                    shell.openModal({
                        type: 'warning',
                        title: "We couldn't delete this PIR",
                        message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.',
                        confirmText: 'Close',
                        onConfirm: shell.closeModal,
                    });
                }
            },
        });
    }, [dispatch, profile.program, setSearchParams, shell, submission.pirId]);

    const handleViewAIP = useCallback(async () => {
        if (!aipDocumentData) {
            try {
                const yearMatch = quarterString.match(/CY (\d{4})/);
                const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
                const response = await api.get('/api/aips', { params: { program_title: profile.program, year } });
                setAipDocumentData(response.data);
            } catch {
                // Ignore preview load failures.
            }
        }
        setIsAIPPreviewOpen(true);
    }, [aipDocumentData, profile.program, quarterString]);

    const handleAddActivity = useCallback(() => {
        dispatch({ type: 'ADD_ACTIVITY', payload: { activity: createEmptyPirActivity(), showAddedFlash: true } });
        window.setTimeout(() => {
            dispatch({ type: 'SET_IS_ADDING_ACTIVITY', payload: false });
        }, 1200);
    }, [dispatch]);

    const handleAddUnplannedActivity = useCallback(() => {
        dispatch({ type: 'ADD_ACTIVITY', payload: { activity: createEmptyPirActivity({ isUnplanned: true }) } });
    }, [dispatch]);

    const executeRemoveActivity = useCallback((activityId, moveToRemovedAip) => {
        dispatch({ type: 'REMOVE_ACTIVITY', payload: { id: activityId, moveToRemovedAip } });
    }, [dispatch]);

    const handleRemoveActivity = useCallback((activityId) => {
        const activity = activities.find((currentActivity) => currentActivity.id === activityId);
        const hasData = activity && [activity.name, activity.physTarget, activity.finTarget, activity.physAcc, activity.finAcc, activity.actions].some((value) => String(value).trim() !== '');

        if (hasData) {
            shell.openModal({
                type: 'warning',
                title: 'Delete Activity?',
                message: activity.fromAIP
                    ? 'This activity contains data. It will be moved to the tray below so you can restore it later.'
                    : 'This activity contains data. Are you sure you want to permanently remove it?',
                confirmText: 'Yes, Delete',
                onConfirm: () => {
                    executeRemoveActivity(activityId, Boolean(activity.fromAIP));
                    shell.closeModal();
                },
            });
            return;
        }

        executeRemoveActivity(activityId, Boolean(activity?.fromAIP));
    }, [activities, executeRemoveActivity, shell]);

    const handleRestoreActivity = useCallback((activityId) => {
        dispatch({ type: 'RESTORE_ACTIVITY', payload: { id: activityId } });
    }, [dispatch]);

    const handleActivityChange = useCallback((activityId, field, value) => {
        dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: activityId, field, value } });
    }, [dispatch]);

    const calculateGap = useCallback((targetStr, accStr) => {
        const target = parseFloat(targetStr) || 0;
        const accomplished = parseFloat(accStr) || 0;
        if (target > 0) {
            if (accomplished >= target) {
                return 0;
            }
            return ((accomplished - target) / target) * 100;
        }
        return 0;
    }, []);

    const handleConfirmSubmit = useCallback(async () => {
        const payload = buildPirPayload(state, { isDivisionPersonnel, quarterString });

        try {
            await submitPir({
                body: payload,
                pirId: submission.pirId,
                isEditing: submission.isEditing,
            });

            if (submission.isEditing) {
                dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
                shell.openModal({
                    type: 'success',
                    title: 'PIR updated',
                    message: 'Your changes have been saved and sent back for review.',
                    confirmText: 'View Submission',
                    onConfirm: () => {
                        shell.closeModal();
                        handleStart('readonly', profile.program);
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
            } else {
                dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isSubmitted', value: true } });
                draft.clearDraft(`pir_draft_${profile.program}_${quarterString}`);
                shell.openModal({
                    type: 'success',
                    title: 'PIR submitted',
                    message: 'Your PIR - Quarterly Report has been submitted. You can review it from your submission history.',
                    confirmText: 'View Submission',
                    onConfirm: () => {
                        shell.closeModal();
                        handleStart('readonly', profile.program);
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
            }
        } catch (error) {
            const isWindowError = error.response?.status === 403 && error.response?.data?.error?.toLowerCase().includes('submission window');
            shell.openModal({
                type: 'warning',
                title: isWindowError ? 'Submission window closed' : submission.isEditing ? "We couldn't update this PIR" : "We couldn't submit this PIR",
                message: error.friendlyMessage ?? 'Please try again. Make sure the related AIP has already been submitted.',
                confirmText: 'Close',
                onConfirm: shell.closeModal,
            });
        }
    }, [dispatch, draft, handleStart, isDivisionPersonnel, navigate, profile.program, quarterString, shell, state, submission.isEditing, submission.pirId]);

    return (
        <FormShellProvider value={shell}>
            <PirProvider state={state} dispatch={dispatch}>
                <FormShellLayout
                    loading={data.isLoading}
                    loadingMessage="Loading PIR..."
                    motionProps={motionProps}
                    splash={(
                        <>
                            <FormHeader
                                title="Quarterly Performance Review"
                                programName={profile.program}
                                onBack={handleBack}
                                theme="blue"
                            />
                            <ViewModeSelector
                                programs={programsWithAIPs}
                                programAbbreviations={programAbbreviations}
                                onStart={handleStart}
                                completedPrograms={completedPrograms}
                                theme="blue"
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
                    readonly={(
                        <PIRFormEditor
                            quarterString={quarterString}
                            supervisorName={supervisorName}
                            supervisorTitle={supervisorTitle}
                            user={user}
                            isDivisionPersonnel={isDivisionPersonnel}
                            aipActivitiesLoading={aipActivities.isLoading}
                            isPreviewOpen={isPreviewOpen}
                            onPreviewOpen={setIsPreviewOpen}
                            isAIPPreviewOpen={isAIPPreviewOpen}
                            onAIPPreviewOpen={setIsAIPPreviewOpen}
                            aipDocumentData={aipDocumentData}
                            onViewAIP={handleViewAIP}
                            onSaveForLater={draft.saveNow}
                            onBack={handleBack}
                            onHome={handleHome}
                            onEditPIR={handleEditPIR}
                            onDeletePIR={handleDeletePIR}
                            onShowFinalConfirm={setShowFinalConfirm}
                            toggleAppMode={handleToggleAppMode}
                            handleRemoveActivity={handleRemoveActivity}
                            handleActivityChange={handleActivityChange}
                            handleAddActivity={handleAddActivity}
                            handleAddUnplannedActivity={handleAddUnplannedActivity}
                            handleRestoreActivity={handleRestoreActivity}
                            calculateGap={calculateGap}
                            isSaving={draft.isSaving}
                            isSaved={draft.isSaved}
                            lastSavedTime={draft.lastSavedTime}
                            lastAutoSavedTime={draft.lastAutoSavedTime}
                        />
                    )}
                    editor={(
                        <PIRFormEditor
                            quarterString={quarterString}
                            supervisorName={supervisorName}
                            supervisorTitle={supervisorTitle}
                            user={user}
                            isDivisionPersonnel={isDivisionPersonnel}
                            aipActivitiesLoading={aipActivities.isLoading}
                            isPreviewOpen={isPreviewOpen}
                            onPreviewOpen={setIsPreviewOpen}
                            isAIPPreviewOpen={isAIPPreviewOpen}
                            onAIPPreviewOpen={setIsAIPPreviewOpen}
                            aipDocumentData={aipDocumentData}
                            onViewAIP={handleViewAIP}
                            onSaveForLater={draft.saveNow}
                            onBack={handleBack}
                            onHome={handleHome}
                            onEditPIR={handleEditPIR}
                            onDeletePIR={handleDeletePIR}
                            onShowFinalConfirm={setShowFinalConfirm}
                            toggleAppMode={handleToggleAppMode}
                            handleRemoveActivity={handleRemoveActivity}
                            handleActivityChange={handleActivityChange}
                            handleAddActivity={handleAddActivity}
                            handleAddUnplannedActivity={handleAddUnplannedActivity}
                            handleRestoreActivity={handleRestoreActivity}
                            calculateGap={calculateGap}
                            isSaving={draft.isSaving}
                            isSaved={draft.isSaved}
                            lastSavedTime={draft.lastSavedTime}
                            lastAutoSavedTime={draft.lastAutoSavedTime}
                        />
                    )}
                    afterAnimate={(
                        <ConfirmationModal
                            isOpen={shell.modal.isOpen || showFinalConfirm}
                            onClose={showFinalConfirm ? () => setShowFinalConfirm(false) : (shell.modal.onClose ?? shell.closeModal)}
                            onConfirm={showFinalConfirm ? () => {
                                setShowFinalConfirm(false);
                                handleConfirmSubmit();
                            } : shell.modal.onConfirm}
                            type={showFinalConfirm ? 'warning' : shell.modal.type}
                            title={showFinalConfirm ? (submission.isEditing ? 'Save PIR changes?' : 'Submit this PIR?') : shell.modal.title}
                            message={showFinalConfirm ? (submission.isEditing ? 'Your updated PIR will stay in the review process after you save these changes.' : 'Your PIR will be sent for review after submission.') : shell.modal.message}
                            confirmText={showFinalConfirm ? (submission.isEditing ? 'Save changes' : 'Submit PIR') : shell.modal.confirmText}
                            cancelText={showFinalConfirm ? 'Keep editing' : shell.modal.cancelText}
                            hideCancelButton={shell.modal.hideCancelButton}
                            extraAction={shell.modal.extraAction}
                        />
                    )}
                />
            </PirProvider>
        </FormShellProvider>
    );
}
