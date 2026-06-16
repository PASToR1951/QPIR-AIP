import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { getCurrentPeriodLabel, getDefaultReportingYear, getPeriodNumber, getPeriodTypeForRole, getQuarterLabel } from '../../lib/periods.js';
import { emitOnboardingSignal } from '../../lib/onboardingSignals.js';
import { useReportingPeriod } from '../../context/ReportingPeriodContext.jsx';

function hasFactorInput(factors) {
    return Object.values(factors).some((factorGroup) => {
        if (!factorGroup || typeof factorGroup !== 'object') return false;
        if (typeof factorGroup.facilitating === 'string' || typeof factorGroup.hindering === 'string') {
            return Boolean(factorGroup.facilitating || factorGroup.hindering);
        }

        return Object.values(factorGroup).some((entry) => (
            entry && typeof entry === 'object' && Boolean(entry.facilitating || entry.hindering)
        ));
    });
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

    const { selectedYear: globalSelectedYear, selectedQuarter: globalSelectedQuarter } = useReportingPeriod();
    const isDivisionPersonnel = ['Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(user?.role);
    const defaultReportingYear = getDefaultReportingYear(user?.role);
    const selectedYear = globalSelectedYear || defaultReportingYear;
    const currentQuarterStr = globalSelectedQuarter ? getQuarterLabel(globalSelectedQuarter, selectedYear) : getCurrentPeriodLabel(user?.role);
    
    const periodSearchParams = useMemo(() => ({
        year: String(selectedYear),
        quarter: String(globalSelectedQuarter || 1),
    }), [selectedYear, globalSelectedQuarter]);

    const [periodInfo, setPeriodInfo] = useState({
        label: currentQuarterStr,
        type: getPeriodTypeForRole(user?.role),
        range: null,
    });
    const quarterString = periodInfo.label || currentQuarterStr;
    const periodType = periodInfo.type || getPeriodTypeForRole(user?.role);
    const periodRange = periodInfo.range;
    const currentQuarterNum = useMemo(() => getPeriodNumber(quarterString), [quarterString]);

    useEffect(() => {
        let isActive = true;
        api.get('/api/dashboard', { params: { year: selectedYear } })
            .then((response) => {
                if (!isActive) return;
                const quarterInfo = response.data.quarters?.find((quarter) => quarter.name === `Q${globalSelectedQuarter || 1}`);
                setPeriodInfo({
                    label: currentQuarterStr,
                    type: response.data.period_type || getPeriodTypeForRole(user?.role),
                    range: quarterInfo
                        ? {
                            start: quarterInfo.period_start_month,
                            end: quarterInfo.period_end_month,
                        }
                        : null,
                });
            })
            .catch(() => {
                if (!isActive) return;
                setPeriodInfo({
                    label: currentQuarterStr,
                    type: getPeriodTypeForRole(user?.role),
                    range: null,
                });
            });
        return () => {
            isActive = false;
        };
    }, [currentQuarterStr, globalSelectedQuarter, selectedYear, user?.role]);

    const data = useProgramsAndConfig({
        kind: 'pir',
        year: String(selectedYear),
        quarter: quarterString,
        clusterId: user?.cluster_id,
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
    const rawPrograms = data.rawPrograms ?? [];

    const [programsWithAIPs, setProgramsWithAIPs] = useState([]);
    const [programAbbreviations, setProgramAbbreviations] = useState({});
    const [completedPrograms, setCompletedPrograms] = useState([]);
    const [supervisorName, setSupervisorName] = useState('');
    const [supervisorTitle, setSupervisorTitle] = useState('');
    const [notedBy, setNotedBy] = useState(null);
    const [serverDraft, setServerDraft] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isAIPPreviewOpen, setIsAIPPreviewOpen] = useState(false);
    const [aipDocumentData, setAipDocumentData] = useState(null);
    const reviewAreaRef = useRef(null);

    useEffect(() => {
        setProgramsWithAIPs(data.programsWithAIPs);
        setProgramAbbreviations(data.programAbbreviations);
        setCompletedPrograms(data.completedPrograms);
        setSupervisorName(data.supervisorName);
        setSupervisorTitle(data.supervisorTitle);
        setNotedBy(data.notedBy);
        setServerDraft(data.draft);
    }, [
        data.completedPrograms,
        data.draft,
        data.programAbbreviations,
        data.programsWithAIPs,
        data.supervisorName,
        data.supervisorTitle,
        data.notedBy,
    ]);

    const findProgramByTitle = useCallback((programTitle) => (
        rawPrograms.find((program) => program.title === programTitle) ?? null
    ), [rawPrograms]);

    const selectedProgramRecord = profile.program
        ? findProgramByTitle(profile.program)
        : null;

    // Auto-fill Program Owner for Division Personnel
    useEffect(() => {
        if (!isDivisionPersonnel || !user) return;
        if (profile.owner || profile.ownerLocked) return;
        const baseName = user.name || [
            user.first_name,
            user.middle_initial ? `${user.middle_initial}.` : null,
            user.last_name,
        ].filter(Boolean).join(' ').trim();
        const fullName = user.salutation ? `${user.salutation} ${baseName}` : baseName;
        if (fullName.trim()) {
            dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'owner', value: fullName.trim() } });
        }
    }, [isDivisionPersonnel, user, profile.owner, profile.ownerLocked, dispatch]);

    const draft = usePirDraft({
        appMode: shell.appMode,
        state,
        quarterString,
        isDivisionPersonnel,
        isBackfill: false,
        onHydrate: (draftData) => {
            dispatch({ type: 'HYDRATE_DRAFT', payload: { draft: draftData, isDivisionPersonnel } });
        },
    });

    const handleActivitiesLoaded = useCallback((nextActivities) => {
        dispatch({ type: 'REPLACE_ACTIVITIES_FROM_AIP', payload: { activities: nextActivities } });
    }, [dispatch]);

    const handleIndicatorsLoaded = useCallback((nextIndicators) => {
        dispatch({ type: 'SET_INDICATOR_TARGETS', payload: nextIndicators });
    }, [dispatch]);

    const handleOwnerLoaded = useCallback((ownerName) => {
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'owner', value: ownerName } });
        dispatch({ type: 'SET_OWNER_LOCKED', payload: true });
    }, [dispatch]);

    const aipActivities = usePirAipActivities({
        program: profile.program,
        programId: selectedProgramRecord?.id ?? null,
        quarterString,
        currentQuarterNum,
        periodType,
        periodRange,
        isDivisionPersonnel,
        user,
        onActivitiesLoaded: handleActivitiesLoaded,
        onIndicatorsLoaded: handleIndicatorsLoaded,
        onOwnerLoaded: handleOwnerLoaded,
    });

    useEffect(() => {
        dispatch({ type: 'SET_OWNER_LOCKED', payload: false });
        setAipDocumentData(null);
    }, [dispatch, profile.program]);

    // Auto-fill Functional Division from the selected program's division field
    useEffect(() => {
        if (!selectedProgramRecord?.division) return;
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'functionalDivision', value: selectedProgramRecord.division } });
    }, [selectedProgramRecord, dispatch]);

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
        || hasFactorInput(factors)
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

    useEffect(() => {
        const reviewArea = reviewAreaRef.current;
        if (!reviewArea || shell.appMode === 'splash' || shell.appMode === 'readonly') return undefined;
        if (typeof IntersectionObserver === 'undefined') { emitOnboardingSignal('author.pir_review_area_opened'); return undefined; }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { emitOnboardingSignal('author.pir_review_area_opened'); observer.disconnect(); }
        }, { threshold: 0.35 });
        observer.observe(reviewArea);
        return () => observer.disconnect();
    }, [shell.appMode, shell.currentStep]);

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
            cancelText: 'Start fresh',
        }),
        loadInitialDraft: async (selectedProgram) => {
            if (serverDraft?.draftProgram === selectedProgram && serverDraft.draftData) {
                hydrateLocalOrServerDraft(serverDraft.draftData);
            }
        },
        loadDiscardedLocalDraftFallback: async (selectedProgram) => {
            await loadServerDraft(selectedProgram);
        },
        onBeforeStart: ({ mode, selectedProgram }) => {
            if (mode !== 'readonly') {
                emitOnboardingSignal('author.pir_program_selected', { program: selectedProgram, mode });
            }
        },
        extraSearchParams: periodSearchParams,
    });

    const handleEditPIR = useCallback(() => {
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: true } });
        shell.setAppMode('wizard');
        setSearchParams({ ...periodSearchParams, program: profile.program, mode: 'wizard' }, { replace: true });
    }, [dispatch, periodSearchParams, profile.program, setSearchParams, shell]);

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
                    setSearchParams(periodSearchParams, { replace: true });
                } catch (error) {
                    shell.openModal({
                        type: 'warning',
                        title: "We couldn't delete this PIR",
                        message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.',
                        confirmText: 'Close',
                        onConfirm: shell.closeModal,
                        hideCancelButton: true,
                    });
                }
            },
        });
    }, [dispatch, periodSearchParams, profile.program, setSearchParams, shell, submission.pirId]);

    const handleViewAIP = useCallback(async () => {
        if (!aipDocumentData) {
            try {
                const yearMatch = quarterString.match(/CY (\d{4})/);
                const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
                const response = await api.get('/api/aips', {
                    params: {
                        program_title: profile.program,
                        year,
                        ...(selectedProgramRecord?.id ? { program_id: selectedProgramRecord.id } : {}),
                    },
                });
                setAipDocumentData(response.data);
            } catch {
                // Ignore preview load failures.
            }
        }
        setIsAIPPreviewOpen(true);
    }, [aipDocumentData, profile.program, quarterString, selectedProgramRecord?.id]);

    const handleAddUnplannedActivity = useCallback(() => {
        dispatch({ type: 'ADD_ACTIVITY', payload: { activity: createEmptyPirActivity({ isUnplanned: true }) } });
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
        const payload = buildPirPayload(state, { isDivisionPersonnel, quarterString, isBackfill: false });

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
                hideCancelButton: true,
            });
        }
    }, [dispatch, draft, handleStart, isDivisionPersonnel, navigate, periodMode, profile.program, quarterString, shell, state, submission.isEditing, submission.pirId]);

    // Period handlers removed, using ReportingPeriodContext instead

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
                                title="Quarterly Program Implmentation Review"
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
                                formKind="pir"
                                onSelectProgram={(program) => {
                                    shell.setSplashSelectedProgram(program);
                                    if (program) {
                                        setSearchParams({ ...periodSearchParams, program }, { replace: true });
                                    } else {
                                        setSearchParams(periodSearchParams, { replace: true });
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
                            notedBy={notedBy}
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
                            onShowFinalConfirm={handleConfirmSubmit}
                            toggleAppMode={handleToggleAppMode}
                            handleActivityChange={handleActivityChange}
                            handleAddUnplannedActivity={handleAddUnplannedActivity}
                            calculateGap={calculateGap}
                            isSaving={draft.isSaving}
                            isSaved={draft.isSaved}
                            lastSavedTime={draft.lastSavedTime}
                            lastAutoSavedTime={draft.lastAutoSavedTime}
                            reviewAreaRef={reviewAreaRef}
                        />
                    )}
                    editor={(
                        <PIRFormEditor
                            quarterString={quarterString}
                            supervisorName={supervisorName}
                            supervisorTitle={supervisorTitle}
                            notedBy={notedBy}
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
                            onShowFinalConfirm={handleConfirmSubmit}
                            toggleAppMode={handleToggleAppMode}
                            handleActivityChange={handleActivityChange}
                            handleAddUnplannedActivity={handleAddUnplannedActivity}
                            calculateGap={calculateGap}
                            isSaving={draft.isSaving}
                            isSaved={draft.isSaved}
                            lastSavedTime={draft.lastSavedTime}
                            lastAutoSavedTime={draft.lastAutoSavedTime}
                            reviewAreaRef={reviewAreaRef}
                        />
                    )}
                    afterAnimate={(
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
                    )}
                />
            </PirProvider>
        </FormShellProvider>
    );
}
