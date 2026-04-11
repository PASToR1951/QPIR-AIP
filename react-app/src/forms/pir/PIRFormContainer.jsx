import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../../lib/api.js';
import { FormHeader } from '../../components/ui/FormHeader';
import { FormBoxHeader } from '../../components/ui/FormBoxHeader';
import { ViewModeSelector } from '../../components/ui/ViewModeSelector';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { DocumentPreviewModal } from '../../components/ui/DocumentPreviewModal';
import { useAccessibility } from '../../context/AccessibilityContext';
import WizardStepper from '../../components/ui/WizardStepper';
import SectionHeader from '../../components/ui/SectionHeader';
import SignatureBlock from '../../components/ui/SignatureBlock';
import FinalizeCard from '../../components/ui/FinalizeCard';
import WizardStickyNav from '../../components/ui/WizardStickyNav';
import PIRProfileSection from '../../components/forms/pir/PIRProfileSection';
import PIRIndicatorsSection from '../../components/forms/pir/PIRIndicatorsSection';
import PIRMonitoringEvaluationSection from '../../components/forms/pir/PIRMonitoringEvaluationSection';
import PIRFactorsSection from '../../components/forms/pir/PIRFactorsSection';
import PIRActionItemsSection from '../../components/forms/pir/PIRActionItemsSection';
import FormShellLayout from '../shared/FormShellLayout.jsx';
import { FormShellProvider } from '../shared/formShellContext.jsx';
import useFormShell from '../shared/useFormShell.js';
import useProgramsAndConfig from '../shared/useProgramsAndConfig.js';
import usePirFormState, { createEmptyPirActivity } from './usePirFormState.js';
import { PirProvider } from './pirContext.jsx';
import usePirDraft from './usePirDraft.js';
import usePirAipActivities from './usePirAipActivities.js';
import { buildPirPayload } from './buildPirPayload.js';
import submitPir from './submitPir.js';

const LazyPIRDocument = lazy(() => (
    import('../../components/docs/PIRDocument.jsx').then((module) => ({ default: module.PIRDocument }))
));
const LazyAIPDocument = lazy(() => (
    import('../../components/docs/AIPDocument.jsx').then((module) => ({ default: module.AIPDocument }))
));

function PreviewFallback() {
    return (
        <div className="px-6 py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading preview...
        </div>
    );
}

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
    const indicatorTargets = state.indicatorTargets;
    const activities = state.activities;
    const removedAIPActivities = state.removedAIPActivities;
    const factors = state.factors;
    const actionItems = state.actionItems;
    const ui = state.ui;
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
    const appModeRef = useRef(shell.appMode);
    const autoStartedRef = useRef(false);

    useEffect(() => {
        appModeRef.current = shell.appMode;
    }, [shell.appMode]);

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

    const hasInputtedData = useCallback(() => {
        return profile.program
            || profile.school
            || profile.owner
            || budget.fromDivision
            || budget.fromCoPSF
            || activities.some((activity) => activity.name || activity.physTarget || activity.finTarget || activity.physAcc || activity.finAcc || activity.actions)
            || Object.values(factors).some((factor) => factor.facilitating || factor.hindering)
            || actionItems.some((item) => item.action);
    }, [actionItems, activities, budget.fromCoPSF, budget.fromDivision, factors, profile.owner, profile.program, profile.school]);

    const handleStart = useCallback(async (mode, selectedProgram) => {
        if (!selectedProgram) {
            return;
        }

        resetFormState(selectedProgram);
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isSubmitted', value: false } });
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });

        if (mode === 'readonly') {
            try {
                aipActivities.markActivityReviewsHydrated();
                const response = await api.get('/api/pirs', {
                    params: { program_title: selectedProgram, quarter: quarterString },
                });
                dispatch({ type: 'HYDRATE_SUBMITTED', payload: { pir: response.data } });
            } catch {
                return;
            }

            shell.setAppMode('readonly');
            setSearchParams({ program: selectedProgram, mode: 'readonly' }, { replace: true });
            return;
        }

        const localStorageKey = `pir_draft_${selectedProgram}_${quarterString}`;
        const localDraft = draft.readDraft(localStorageKey);

        if (localDraft) {
            shell.openModal({
                type: 'warning',
                title: 'Continue your saved draft?',
                message: `We found an auto-saved draft from ${new Date(localDraft.savedAt).toLocaleString()}. Continue from that draft?`,
                confirmText: 'Continue draft',
                cancelText: 'Open saved draft',
                onConfirm: () => {
                    hydrateLocalOrServerDraft(localDraft);
                    shell.closeModal();
                    shell.setAppMode(mode);
                    setSearchParams({ program: selectedProgram, mode }, { replace: true });
                },
                onClose: async () => {
                    shell.closeModal();
                    draft.clearDraft(localStorageKey);
                    try {
                        await loadServerDraft(selectedProgram);
                    } catch {
                        // Continue with a blank form.
                    }
                    shell.setAppMode(mode);
                    setSearchParams({ program: selectedProgram, mode }, { replace: true });
                },
            });
            return;
        }

        if (serverDraft?.draftProgram === selectedProgram && serverDraft.draftData) {
            hydrateLocalOrServerDraft(serverDraft.draftData);
        }

        shell.setAppMode(mode);
        setSearchParams({ program: selectedProgram, mode }, { replace: true });
    }, [aipActivities, dispatch, draft, hydrateLocalOrServerDraft, loadServerDraft, quarterString, resetFormState, serverDraft, setSearchParams, shell]);

    const handleBack = useCallback(() => {
        if (shell.appMode === 'splash') {
            navigate('/');
        } else if (submission.isEditing) {
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
            shell.setAppMode('readonly');
            setSearchParams({ program: profile.program, mode: 'readonly' }, { replace: true });
        } else {
            if (hasInputtedData()) {
                draft.saveNow();
            }
            shell.setAppMode('splash');
            setSearchParams({}, { replace: true });
        }
    }, [dispatch, draft, hasInputtedData, navigate, profile.program, setSearchParams, shell, submission.isEditing]);

    const handleHome = useCallback(() => {
        if (hasInputtedData()) {
            draft.saveNow();
        }
        navigate('/');
    }, [draft, hasInputtedData, navigate]);

    const handleEditPIR = useCallback(() => {
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: true } });
        shell.setAppMode('wizard');
        setSearchParams({ program: profile.program, mode: 'wizard' }, { replace: true });
    }, [dispatch, profile.program, setSearchParams, shell]);

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
                dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'program', value: '' } });
            }
        } else if (!paramMode) {
            shell.setSplashSelectedProgram(paramProgram);
            if (appModeRef.current !== 'splash') {
                shell.setAppMode('splash');
                dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'program', value: '' } });
            }
        } else if (appModeRef.current === 'splash') {
            handleStart(paramMode, paramProgram);
        }
    }, [dispatch, handleStart, searchParams, shell]);

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

    const handleToggleAppMode = useCallback(() => {
        const nextMode = shell.appMode === 'wizard' ? 'full' : 'wizard';
        shell.setAppMode(nextMode);
        setSearchParams({ program: profile.program, mode: nextMode }, { replace: true });
    }, [profile.program, setSearchParams, shell]);

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

    const renderReadonly = () => (
        <>
            <FormHeader title="Quarterly Performance Review" programName={profile.program} onBack={handleBack} theme="blue" />
            <div className="bg-slate-50 dark:bg-dark-base min-h-screen font-sans print:bg-white">
                <div className="max-w-5xl mx-auto px-4 pt-8 pb-4 print:hidden">
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-sm flex-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex-1">
                            This form has been submitted{submission.pirStatus && submission.pirStatus !== 'Submitted' ? ` — currently ${submission.pirStatus.toLowerCase()} by reviewers` : ' and is read-only'}.
                        </span>
                        <div className="flex items-center gap-2">
                            {['For CES Review', 'For Cluster Head Review', 'Returned'].includes(submission.pirStatus) && (
                                <>
                                    <button
                                        onClick={handleEditPIR}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDeletePIR}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900/50 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                        </svg>
                                        Delete
                                    </button>
                                </>
                            )}
                            <button
                                aria-label="Print PIR"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                                </svg>
                                Print / Save PDF
                            </button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 pb-12">
                    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border p-8 print:shadow-none print:border-none print:p-0 print:rounded-none">
                        <Suspense fallback={<PreviewFallback />}>
                            <LazyPIRDocument
                                quarter={quarterString}
                                supervisorName={supervisorName}
                                supervisorTitle={supervisorTitle}
                                program={profile.program}
                                school={profile.school}
                                owner={profile.owner}
                                budgetFromDivision={budget.fromDivision}
                                budgetFromCoPSF={budget.fromCoPSF}
                                functionalDivision={profile.functionalDivision}
                                indicatorTargets={indicatorTargets}
                                activities={activities}
                                factors={factors}
                                actionItems={actionItems}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </>
    );

    const renderEditor = () => (
        <div className="bg-slate-50 dark:bg-dark-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 font-sans relative print:py-0 print:bg-white print:text-black">
            <FormHeader
                title={submission.isEditing ? 'Edit Submitted PIR' : 'Quarterly Performance Review'}
                programName={profile.program}
                onSave={submission.isEditing ? undefined : draft.saveNow}
                onBack={handleBack}
                onHome={submission.isEditing ? undefined : handleHome}
                isSaving={draft.isSaving}
                isSaved={draft.isSaved}
                lastSavedTime={draft.lastSavedTime}
                lastAutoSavedTime={draft.lastAutoSavedTime}
                theme="blue"
                appMode={shell.appMode}
                toggleAppMode={handleToggleAppMode}
            />

            <DocumentPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="PIR Document Preview"
                subtitle="Quarterly Program Implementation Review"
                filename={`PIR_${quarterString.replace(/\s+/g, '_')}${profile.program ? `_${profile.program.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : ''}`}
                landscape
            >
                <Suspense fallback={<PreviewFallback />}>
                    <LazyPIRDocument
                        quarter={quarterString}
                        supervisorName={supervisorName}
                        supervisorTitle={supervisorTitle}
                        program={profile.program}
                        school={profile.school}
                        owner={profile.owner}
                        budgetFromDivision={budget.fromDivision}
                        budgetFromCoPSF={budget.fromCoPSF}
                        functionalDivision={profile.functionalDivision}
                        indicatorTargets={indicatorTargets}
                        activities={activities}
                        factors={factors}
                        actionItems={actionItems}
                    />
                </Suspense>
            </DocumentPreviewModal>

            <DocumentPreviewModal
                isOpen={isAIPPreviewOpen}
                onClose={() => setIsAIPPreviewOpen(false)}
                title="Annual Implementation Plan"
                subtitle={`AIP Reference — ${profile.program}`}
                filename={`AIP_${aipDocumentData?.year ?? ''}${aipDocumentData?.sipTitle ? `_${aipDocumentData.sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : ''}`}
            >
                {aipDocumentData && (
                    <Suspense fallback={<PreviewFallback />}>
                        <LazyAIPDocument
                            year={String(aipDocumentData.year)}
                            outcome={aipDocumentData.outcome}
                            depedProgram={aipDocumentData.depedProgram}
                            sipTitle={aipDocumentData.sipTitle}
                            projectCoord={aipDocumentData.projectCoord}
                            objectives={aipDocumentData.objectives}
                            indicators={aipDocumentData.indicators}
                            activities={aipDocumentData.activities}
                            preparedByName={aipDocumentData.preparedByName}
                            preparedByTitle={aipDocumentData.preparedByTitle}
                            approvedByName={aipDocumentData.approvedByName}
                            approvedByTitle={aipDocumentData.approvedByTitle}
                        />
                    </Suspense>
                )}
            </DocumentPreviewModal>

            {profile.program && (
                <button
                    onClick={handleViewAIP}
                    className="fixed bottom-6 left-6 z-50 print:hidden flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl font-bold text-sm transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    View AIP
                </button>
            )}

            <div className={`container mx-auto max-w-5xl relative z-10 mt-8 mb-12 print:hidden px-4 md:px-0 ${shell.appMode === 'wizard' && shell.isMobile ? 'pb-28' : ''}`}>
                {shell.appMode === 'wizard' && (
                    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-6 shadow-md mb-6">
                        <FormBoxHeader
                            title="Quarterly Performance Review"
                            badge={quarterString}
                            compact={true}
                        />
                    </div>
                )}

                <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] p-6 md:p-12 shadow-xl relative">
                    {shell.appMode === 'full' && (
                        <FormBoxHeader
                            title="Quarterly Performance Review"
                            subtitle="Division Monitoring Evaluation and Adjustment"
                            badge={quarterString}
                        />
                    )}

                    {shell.appMode === 'wizard' && (
                        <div data-tour="form-step-nav">
                            <WizardStepper
                                steps={[
                                    { num: 1, label: 'Profile' },
                                    { num: 2, label: 'Indicators' },
                                    { num: 3, label: 'Review' },
                                    { num: 4, label: 'Factors' },
                                    { num: 5, label: 'Action Items' },
                                    { num: 6, label: 'Finalize' },
                                ]}
                                currentStep={shell.currentStep}
                                theme="blue"
                            />
                        </div>
                    )}

                    <form onSubmit={(event) => event.preventDefault()}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={shell.appMode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="min-h-[320px]">
                                    <PIRProfileSection
                                        isDivisionPersonnel={isDivisionPersonnel}
                                        user={user}
                                        quarterString={quarterString}
                                    />

                                    <PIRIndicatorsSection />

                                    <PIRMonitoringEvaluationSection
                                        appMode={shell.appMode}
                                        currentStep={shell.currentStep}
                                        isLoadingActivities={aipActivities.isLoading}
                                        activities={activities}
                                        expandedActivityId={ui.expandedActivityId}
                                        setExpandedActivityId={(activityId) => dispatch({ type: 'SET_EXPANDED_ACTIVITY_ID', payload: activityId })}
                                        calculateGap={calculateGap}
                                        handleRemoveActivity={handleRemoveActivity}
                                        handleActivityChange={handleActivityChange}
                                        handleAddActivity={handleAddActivity}
                                        handleAddUnplannedActivity={handleAddUnplannedActivity}
                                        isAddingActivity={ui.isAddingActivity}
                                        removedAIPActivities={removedAIPActivities}
                                        handleRestoreActivity={handleRestoreActivity}
                                    />

                                    <PIRFactorsSection showRecommendations={true} />

                                    <PIRActionItemsSection />

                                    <div className={`${(shell.appMode === 'full' || shell.currentStep === 6) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${shell.appMode === 'full' ? 'mb-16' : ''}`}>
                                        <SectionHeader
                                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
                                            title="Signatures"
                                            subtitle="Finalize with necessary approvals."
                                            theme="blue"
                                            appMode={shell.appMode}
                                        />

                                        <div className="bg-white dark:bg-dark-surface p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm mb-2 relative overflow-hidden">
                                            <svg className="absolute inset-0 h-full w-full opacity-20 dark:opacity-40 stroke-slate-300 dark:stroke-dark-border" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%)' }} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines-pir" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines-pir)"></rect></svg>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                                                <SignatureBlock
                                                    label="Prepared by"
                                                    name={profile.owner}
                                                    title="Program Owner"
                                                    onNameChange={(value) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'owner', value } })}
                                                    namePlaceholder="NAME OF PROGRAM OWNER"
                                                    theme="blue"
                                                />
                                                <SignatureBlock
                                                    label="Noted"
                                                    name="DR. ENRIQUE Q. RETES, EdD"
                                                    title="Chief Education Supervisor"
                                                    readOnly
                                                    theme="blue"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {shell.appMode === 'wizard' && shell.currentStep === 6 && (
                                        <div data-tour="form-review-submit" className="animate-in fade-in slide-in-from-bottom-4 duration-200 mt-6">
                                            <FinalizeCard
                                                isSubmitted={submission.isSubmitted}
                                                onSubmit={() => setShowFinalConfirm(true)}
                                                onPreview={() => setIsPreviewOpen(true)}
                                                theme="blue"
                                                submitLabel={submission.isEditing ? 'Save Changes' : undefined}
                                            />
                                        </div>
                                    )}
                                </div>

                                {shell.appMode === 'wizard' && !(shell.appMode === 'wizard' && shell.isMobile) && (
                                    <div className="mt-12 pt-6 border-t border-slate-200 dark:border-dark-border flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={shell.prevStep}
                                            disabled={shell.currentStep === 1}
                                            className={`group relative inline-flex h-12 items-center justify-center rounded-xl px-6 font-medium transition-colors gap-2 ${shell.currentStep === 1
                                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface shadow-sm border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-base active:scale-95'
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                            Back
                                        </button>

                                        {shell.currentStep < 6 && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={shell.nextStep}
                                                    className="group relative inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-md transition-colors active:scale-95 hover:bg-slate-800 gap-2"
                                                >
                                                    Continue
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {shell.appMode === 'full' && (
                                    <div data-tour="form-review-submit" className="mt-12 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg relative z-10">
                                        <h3 className="text-slate-800 dark:text-slate-100 font-bold text-xl mb-6">Ready to finalize your review?</h3>

                                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={() => setIsPreviewOpen(true)}
                                                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white dark:bg-dark-surface border-2 border-slate-200 dark:border-dark-border px-8 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-base transition-colors active:scale-95 w-full sm:w-auto shadow-sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                Preview Layout
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowFinalConfirm(true)}
                                                disabled={submission.isSubmitted}
                                                className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-8 py-1 text-sm font-bold text-white transition-colors gap-3 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                                {submission.isSubmitted ? "Submitted" : submission.isEditing ? "Save Changes" : "Confirm & Submit"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </form>
                </div>
            </div>

            <WizardStickyNav
                show={shell.appMode === 'wizard' && shell.isMobile}
                theme="blue"
                onPrevious={shell.prevStep}
                onNext={shell.currentStep < 6 ? shell.nextStep : () => setShowFinalConfirm(true)}
                previousDisabled={shell.currentStep === 1}
                nextLabel={shell.currentStep < 6 ? 'Continue' : submission.isEditing ? 'Save Changes' : 'Submit PIR'}
                showNext
            />
        </div>
    );

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
                    readonly={renderReadonly()}
                    editor={renderEditor()}
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
