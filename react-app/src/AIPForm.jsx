import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

import api from './lib/api.js';
import { FormHeader } from './components/ui/FormHeader';
import { ViewModeSelector } from './components/ui/ViewModeSelector';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { useAccessibility } from './context/AccessibilityContext';
import { PageLoader } from './components/ui/PageLoader';
import { emitOnboardingSignal } from './lib/onboardingSignals.js';
import AIPFormEditor from './AIPFormEditor.jsx';

export default function App() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { settings } = useAccessibility();
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

    const saveTimerRef = useRef(null);
    const autoStarted = useRef(false);
    const reviewAreaRef = useRef(null);

    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [loadError, setLoadError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [year, setYear] = useState(String(new Date().getFullYear()));

    // UI State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [programList, setProgramList] = useState([]);
    const [programAbbreviations, setProgramAbbreviations] = useState({});
    const [completedPrograms, setCompletedPrograms] = useState([]);

    // Save Status State
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState(null);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'warning',
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => { },
        onClose: null // null means fall back to closeModal
    });

    const closeModal = useCallback(() => setModal(prev => ({ ...prev, isOpen: false })), []);

    // Form State: Profile & Goals
    const [outcome, setOutcome] = useState("");
    const [selectedTarget, setSelectedTarget] = useState("");
    const [depedProgram, setDepedProgram] = useState("");
    const [sipTitle, setSipTitle] = useState("");
    const [projectCoord, setProjectCoord] = useState("");

    const [objectives, setObjectives] = useState([""]);
    const [indicators, setIndicators] = useState([{ description: "", target: "" }]);

    // Form State: Signatories
    const [preparedByName, setPreparedByName] = useState("");
    const [preparedByTitle, setPreparedByTitle] = useState("");
    const [approvedByName, setApprovedByName] = useState("");
    const [approvedByTitle, setApprovedByTitle] = useState("");

    // Form State: Activities
    const [activities, setActivities] = useState([
        { id: crypto.randomUUID(), phase: "Planning", name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Implementation", name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Monitoring and Evaluation", name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }
    ]);
    const [expandedActivityId, setExpandedActivityId] = useState(null);

    // Autocomplete / Suggestion State
    const [coordinatorSuggestions, setCoordinatorSuggestions] = useState([]);
    const [personsTerms, setPersonsTerms] = useState([]);

    // Autosave State
    const autosaveTimerRef = useRef(null);
    const [lastAutoSavedTime, setLastAutoSavedTime] = useState(null);

    // Submitted AIP tracking (for edit)
    const [aipId, setAipId] = useState(null);
    const [aipStatus, setAipStatus] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Splash stage-2 selection (program chosen but no mode yet)
    const [splashSelectedProgram, setSplashSelectedProgram] = useState(null);

    // Draft State Tracking for ViewModeSelector
    const [hasDraft, setHasDraft] = useState(false);
    const [draftInfo, setDraftInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [loadedDraftData, setLoadedDraftData] = useState(null);
    const [returnedPrograms, setReturnedPrograms] = useState([]);
    const [draftPrograms, setDraftPrograms] = useState([]);
    const [toast, setToast] = useState(null);          // { msg, programs[] }
    const [deletedPopup, setDeletedPopup] = useState(null); // programs[] shown in popup
    const [autosavedPrograms, setAutosavedPrograms] = useState([]);
    const toastTimerRef = useRef(null);

    const showToast = useCallback((programs) => {
        const count = programs.length;
        const msg = count === 1
            ? `"${programs[0]}" deleted.`
            : count === 2
                ? `"${programs[0]}" and "${programs[1]}" deleted.`
                : `${count} programs deleted.`;
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ msg, programs });
        toastTimerRef.current = setTimeout(() => setToast(null), 4000);
    }, []);

    // ==========================================
    // FORM HELPERS
    // ==========================================

    const makeInitialActivities = () => [
        { id: crypto.randomUUID(), phase: "Planning", name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Implementation", name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Monitoring and Evaluation", name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }
    ];

    const loadDraftIntoState = useCallback((draft) => {
        if (!draft) return;
        setOutcome(draft.outcome || "");
        setSelectedTarget(draft.indicators?.[0]?.description || "");
        setYear(draft.year || String(new Date().getFullYear()));
        setSipTitle(draft.sipTitle || "");
        setProjectCoord(draft.projectCoord || "");
        setObjectives(draft.objectives?.length ? draft.objectives : [""]);
        setIndicators(draft.indicators?.length ? draft.indicators : [{ description: "", target: "" }]);
        setPreparedByName(draft.preparedByName || "");
        setPreparedByTitle(draft.preparedByTitle || "");
        setApprovedByName(draft.approvedByName || "");
        setApprovedByTitle(draft.approvedByTitle || "");
        if (draft.activities?.length) setActivities(draft.activities);
    }, []);

    const resetFormState = useCallback(() => {
        setOutcome("");
        setSelectedTarget("");
        setSipTitle("");
        setProjectCoord("");
        setObjectives([""]);
        setIndicators([{ description: "", target: "" }]);
        setPreparedByName("");
        setPreparedByTitle("");
        setApprovedByName("");
        setApprovedByTitle("");
        setActivities(makeInitialActivities());
        setCurrentStep(1);
        setExpandedActivityId(null);
    }, []);

    // Fetch programs, completed programs, and draft in parallel on mount
    useEffect(() => {
        const init = async () => {
            try {
                const schoolOrUserId = user?.school_id || user?.id;
                const requests = [
                    api.get('/api/programs'),
                    api.get('/api/programs/with-aips'),
                    api.get('/api/aips/draft'),
                    schoolOrUserId ? api.get(`/api/schools/${schoolOrUserId}/coordinators`) : Promise.resolve(null),
                    schoolOrUserId ? api.get(`/api/schools/${schoolOrUserId}/persons-terms`) : Promise.resolve(null),
                ];
                const results = await Promise.allSettled(requests);
                const [programsRes, completedRes, draftRes, coordsRes, termsRes] = results;
                if (programsRes.status === 'fulfilled') {
                    const pdata = programsRes.value.data;
                    setProgramList(pdata.map(p => p.title).sort());
                    setProgramAbbreviations(Object.fromEntries(pdata.filter(p => p.abbreviation).map(p => [p.title, p.abbreviation])));
                } else {
                    const status = programsRes.reason?.response?.status;
                    setLoadError(
                        programsRes.reason?.friendlyMessage ??
                        status === 403
                            ? 'You do not have permission to load programs for this account.'
                            : 'Programs could not be loaded. Please refresh and try again.'
                    );
                }
                if (completedRes.status === 'fulfilled') {
                    const data = completedRes.value.data;
                    setCompletedPrograms(data.filter(p => p.aip_status !== 'Draft').map(p => p.title));
                    setReturnedPrograms(data.filter(p => p.aip_status === 'Returned').map(p => p.title));
                    setDraftPrograms(data.filter(p => p.aip_status === 'Draft').map(p => p.title));
                }
                if (coordsRes?.status === 'fulfilled' && coordsRes.value?.data) setCoordinatorSuggestions(coordsRes.value.data);
                if (termsRes?.status === 'fulfilled' && termsRes.value?.data) setPersonsTerms(termsRes.value.data);
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [navigate, user?.id, user?.school_id]);

    // Called when the user picks program + mode in the splash
    const handleStart = async (mode, selectedProgram, opts = {}) => {
        setDepedProgram(selectedProgram);
        setIsSubmitted(false);
        resetFormState();

        if (mode !== 'readonly' && selectedProgram) {
            emitOnboardingSignal('author.program_selected', { program: selectedProgram, mode });
        }

        if (mode === 'readonly') {
            try {
                const year = new Date().getFullYear();
                const res = await api.get('/api/aips', { params: { program_title: selectedProgram, year } });
                const d = res.data;
                setAipId(d.id ?? null);
                setAipStatus(d.status ?? null);
                setYear(String(d.year));
                setOutcome(d.outcome || "");
                setSelectedTarget(d.indicators?.[0]?.description || "");
                setSipTitle(d.sipTitle || "");
                setProjectCoord(d.projectCoord || "");
                setObjectives(d.objectives || []);
                setIndicators(d.indicators || []);
                setPreparedByName(d.preparedByName || "");
                setPreparedByTitle(d.preparedByTitle || "");
                setApprovedByName(d.approvedByName || "");
                setApprovedByTitle(d.approvedByTitle || "");
                if (d.activities) setActivities(d.activities);
            } catch (e) {
                console.error('Failed to load AIP data:', e);
                setLoadError(e?.friendlyMessage ?? 'Failed to load the AIP. Please try again.');
                return; // stay on splash
            }
            setAppMode('readonly');
            setSearchParams({ program: selectedProgram, mode: 'readonly' }, { replace: true });
            return;
        }

        // Check localStorage for an auto-saved draft first
        const lsKey = `aip_draft_${selectedProgram}_${year}`;
        const lsRaw = localStorage.getItem(lsKey);
        if (lsRaw) {
            try {
                const lsData = JSON.parse(lsRaw);
                const hasServerDraft = draftPrograms.includes(selectedProgram);
                setModal({
                    isOpen: true,
                    type: 'warning',
                    title: 'Continue your saved draft?',
                    message: `We found an auto-saved draft from ${new Date(lsData.savedAt).toLocaleString()}. Continue from that draft?${hasServerDraft ? ' You can also skip it and open your last saved draft instead.' : ''}`,
                    confirmText: 'Continue draft',
                    cancelText: hasServerDraft ? 'Open saved draft' : 'Start fresh',
                    onConfirm: () => {
                        loadDraftIntoState(lsData);
                        closeModal();
                        setAppMode(mode);
                        setSearchParams({ program: selectedProgram, mode }, { replace: true });
                    },
                    onClose: async () => {
                        closeModal();
                        localStorage.removeItem(lsKey);
                        if (hasServerDraft) {
                            try {
                                const currentYear = parseInt(year);
                                const draftRes = await api.get('/api/aips/draft', {
                                    params: { program_title: selectedProgram, year: currentYear },
                                });
                                if (draftRes.data.hasDraft) loadDraftIntoState(draftRes.data.draftData);
                            } catch { /* proceed with blank form */ }
                        }
                        setAppMode(mode);
                        setSearchParams({ program: selectedProgram, mode }, { replace: true });
                    }
                });
                return; // modal will trigger setAppMode on confirm or onClose
            } catch { /* ignore malformed */ }
        }

        // Fetch draft from server for this specific program
        if (draftPrograms.includes(selectedProgram)) {
            try {
                const currentYear = parseInt(year);
                const draftRes = await api.get('/api/aips/draft', {
                    params: { program_title: selectedProgram, year: currentYear },
                });
                if (draftRes.data.hasDraft) loadDraftIntoState(draftRes.data.draftData);
            } catch { /* proceed with blank form */ }
        }
        setAppMode(mode);
        setSearchParams({ program: selectedProgram, mode }, { replace: true });
    };

    // Objective handlers
    const handleObjectiveChange = useCallback((index, value) => {
        setObjectives(prev => prev.map((obj, i) => i === index ? value : obj));
    }, []);
    const addObjective = useCallback(() => setObjectives(prev => [...prev, ""]), []);
    const removeObjective = useCallback((index) => setObjectives(prev => prev.filter((_, i) => i !== index)), []);

    // Indicator handlers
    const handleIndicatorChange = useCallback((index, field, value) => {
        setIndicators(prev => prev.map((ind, i) => i === index ? { ...ind, [field]: value } : ind));
    }, []);
    const addIndicator = useCallback(() => setIndicators(prev => [...prev, { description: "", target: "" }]), []);
    const removeIndicator = useCallback((index) => setIndicators(prev => prev.filter((_, i) => i !== index)), []);

    // Outcome change handler — resets target and indicators when outcome changes
    const handleOutcomeChange = useCallback((newOutcome) => {
        setOutcome(newOutcome);
        setSelectedTarget("");
        setIndicators([{ description: "", target: "" }]);
    }, []);

    // Target change handler — syncs selected target into the first indicator description
    const handleTargetChange = useCallback((targetDescription) => {
        setSelectedTarget(targetDescription);
        setIndicators(prev => [{ ...prev[0], description: targetDescription }, ...prev.slice(1)]);
    }, []);

    const hasInputtedData = () => {
        return outcome || sipTitle || projectCoord ||
               objectives.some(o => o.trim()) || indicators.some(i => i.description.trim() || i.target.trim()) ||
               preparedByName || approvedByName ||
               activities.some(a => a.name || a.period || a.persons || a.outputs || a.budgetAmount || a.budgetSource);
    };

    const handleBack = () => {
        if (isEditing) {
            setIsEditing(false);
            setAppMode('readonly');
            setSearchParams({ program: depedProgram, mode: 'readonly' }, { replace: true });
            return;
        }
        if (appMode === 'splash') {
            navigate('/');
        } else {
            if (hasInputtedData()) {
                handleSaveForLater();
            }
            setAppMode('splash');
            setSearchParams({}, { replace: true });
        }
    };

    const handleHome = () => {
        if (hasInputtedData()) {
            handleSaveForLater();
        }
        navigate('/');
    };

    // Auto-start from URL params once data has loaded (supports deep links & browser refresh)
    useEffect(() => {
        if (isLoading || autoStarted.current) return;
        autoStarted.current = true;
        const paramProgram = searchParams.get('program');
        const paramMode = searchParams.get('mode');
        if (paramProgram && ['wizard', 'full', 'readonly'].includes(paramMode)) {
            handleStart(paramMode, paramProgram);
        } else if (paramProgram && !paramMode) {
            setSplashSelectedProgram(paramProgram);
        }
    }, [isLoading]);

    // Keep a ref so the searchParams effect always reads the current appMode
    // without needing it in the dependency array (avoids stale-closure double-calls).
    const appModeRef = useRef(appMode);
    appModeRef.current = appMode;

    // Sync splash/form state when URL params change
    useEffect(() => {
        if (!autoStarted.current) return;
        const paramProgram = searchParams.get('program');
        const paramMode = searchParams.get('mode');
        if (!paramProgram) {
            setSplashSelectedProgram(null);
            if (appModeRef.current !== 'splash') { setAppMode('splash'); setDepedProgram(''); }
        } else if (!paramMode) {
            setSplashSelectedProgram(paramProgram);
            if (appModeRef.current !== 'splash') { setAppMode('splash'); setDepedProgram(''); }
        } else if (appModeRef.current === 'splash') {
            // URL params restored (e.g. browser back) — re-enter form
            handleStart(paramMode, paramProgram);
        }
    }, [searchParams]);

    const handleSaveForLater = async () => {
        if (!depedProgram) return;
        clearTimeout(saveTimerRef.current);
        setIsSaving(true);

        try {
            await api.post('/api/aips/draft', {
                program_title: depedProgram,
                year: parseInt(year),
                outcome,
                sip_title: sipTitle,
                project_coordinator: projectCoord,
                objectives: objectives.filter(o => o.trim() !== ''),
                indicators: indicators.filter(ind => ind.description.trim() !== ''),
                prepared_by_name: preparedByName,
                prepared_by_title: preparedByTitle,
                approved_by_name: approvedByName,
                approved_by_title: approvedByTitle,
                activities
            });
            localStorage.removeItem(`aip_draft_${depedProgram}_${year}`);
            emitOnboardingSignal('author.draft_saved', { source: 'server-draft' });
        } catch (e) {
        }

        saveTimerRef.current = setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setLastSavedTime(timeString);
            saveTimerRef.current = setTimeout(() => setIsSaved(false), 3000);
        }, 800);
    };

    // Clean up save timers on unmount
    useEffect(() => () => {
        clearTimeout(saveTimerRef.current);
        clearTimeout(autosaveTimerRef.current);
    }, []);

    // localStorage autosave — debounced 15s, only in active edit modes
    useEffect(() => {
        if (appMode !== 'wizard' && appMode !== 'full') return;
        if (!depedProgram) return;

        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            try {
                const key = `aip_draft_${depedProgram}_${year}`;
                const snapshot = {
                    outcome, depedProgram, sipTitle, projectCoord,
                    objectives: objectives.filter(o => o.trim() !== ''),
                    indicators: indicators.filter(ind => ind.description.trim() !== ''),
                    activities,
                    preparedByName, preparedByTitle, approvedByName, approvedByTitle,
                    year,
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem(key, JSON.stringify(snapshot));
                setAutosavedPrograms(prev => prev.includes(depedProgram) ? prev : [...prev, depedProgram]);
                setLastAutoSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                setTimeout(() => setLastAutoSavedTime(null), 3000);
                emitOnboardingSignal('author.draft_saved', { source: 'autosave' });
            } catch { /* quota exceeded or private browsing — silently skip */ }
        }, 15000);

        return () => clearTimeout(autosaveTimerRef.current);
    }, [appMode, depedProgram, year, outcome, sipTitle, projectCoord, objectives, indicators, activities,
        preparedByName, preparedByTitle, approvedByName, approvedByTitle]);

    // Scan localStorage for autosaved programs; clear any that are already submitted
    useEffect(() => {
        if (!year || programList.length === 0) return;
        completedPrograms.forEach(p => localStorage.removeItem(`aip_draft_${p}_${year}`));
        const withAutosave = programList.filter(p =>
            !completedPrograms.includes(p) &&
            localStorage.getItem(`aip_draft_${p}_${year}`) !== null
        );
        setAutosavedPrograms(withAutosave);
    }, [programList, year, completedPrograms]);

    // Resize Listener
    useEffect(() => {
        const checkMobile = () => {
            const mobileStatus = window.innerWidth < 1024;
            setIsMobile(mobileStatus);
            if (mobileStatus && appMode === 'full') {
                setAppMode('wizard');
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [appMode]);

    useEffect(() => {
        const reviewArea = reviewAreaRef.current;
        if (!reviewArea || appMode === 'splash' || appMode === 'readonly') return undefined;

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
    }, [appMode, currentStep]);

    const formatCurrency = (val) => {
        if (!val) return "";
        return `₱ ${parseFloat(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Handlers
    const handleAddActivity = useCallback(() => {
        const newId = crypto.randomUUID();
        setActivities(prev => {
            const lastPhase = prev.length > 0 ? prev[prev.length - 1].phase : "Planning";
            return [...prev, { id: newId, phase: lastPhase, name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }];
        });
        setExpandedActivityId(newId);
    }, []);

    const handleAddActivityPhase = useCallback((targetPhase) => {
        const newId = crypto.randomUUID();
        setActivities(prev => [...prev, { id: newId, phase: targetPhase, name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }]);
        setExpandedActivityId(newId);

    }, []);

    const executeDelete = useCallback((id) => {
        setActivities(prev => {
            const newActivities = prev.filter(a => a.id !== id);
            setExpandedActivityId(curr => curr === id && newActivities.length > 0 ? newActivities[newActivities.length - 1].id : curr);
            return newActivities;
        });
        setActivityToDelete(null);
    }, []);

    const handleRemoveActivity = useCallback((id) => {
        setActivities(prev => {
            const row = prev.find(a => a.id === id);
            const hasData = [row.name, row.period, row.persons, row.outputs, row.budgetAmount, row.budgetSource].some(val => String(val).trim() !== '');

            if (hasData) {
                setModal({
                    isOpen: true,
                    type: 'warning',
                    title: 'Delete Activity?',
                    message: 'This activity contains data. Are you sure you want to permanently remove it?',
                    confirmText: 'Yes, Delete',
                    onConfirm: () => executeDelete(id)
                });
                return prev; // Don't modify activities yet
            } else {
                const newActivities = prev.filter(a => a.id !== id);
                setExpandedActivityId(curr => curr === id && newActivities.length > 0 ? newActivities[newActivities.length - 1].id : curr);
                return newActivities;
            }
        });
    }, [executeDelete]);
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const derivePeriodLabel = (startMonth, endMonth) => {
        if (!startMonth || !endMonth) return '';
        const s = parseInt(startMonth), e = parseInt(endMonth);
        if (isNaN(s) || isNaN(e)) return '';
        return s === e ? MONTH_NAMES[s - 1] : `${MONTH_NAMES[s - 1]} to ${MONTH_NAMES[e - 1]}`;
    };
    const handleActivityChange = useCallback((id, field, value) => {
        setActivities(prev => prev.map(a => {
            if (a.id !== id) return a;
            const updated = { ...a, [field]: value };
            // Auto-derive period display when month fields change
            if (field === 'periodStartMonth' || field === 'periodEndMonth') {
                const s = field === 'periodStartMonth' ? value : updated.periodStartMonth;
                const e = field === 'periodEndMonth' ? value : updated.periodEndMonth;
                updated.period = derivePeriodLabel(s, e);
            }
            return updated;
        }));
    }, []);

    const nextStep = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, totalSteps)), []);
    const prevStep = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 1)), []);

    const editSection = (stepNumber) => {
        if (appMode === 'full') return;
        setCurrentStep(stepNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBulkDelete = useCallback((programsToDelete) => {
        setModal({
            isOpen: true,
            type: 'warning',
            title: `Delete ${programsToDelete.length} AIP${programsToDelete.length > 1 ? 's' : ''}?`,
            message: `This will permanently delete ${programsToDelete.length} AIP submission${programsToDelete.length > 1 ? 's' : ''}. This cannot be undone.`,
            confirmText: `Yes, Delete ${programsToDelete.length > 1 ? 'All' : 'It'}`,
            onConfirm: async () => {
                closeModal();
                const currentYear = parseInt(year);
                const results = await Promise.allSettled(
                    programsToDelete.map(prog =>
                        api.delete('/api/aips', { params: { program_title: prog, year: currentYear } })
                    )
                );
                const deleted = programsToDelete.filter((_, i) => results[i].status === 'fulfilled');
                if (deleted.length > 0) {
                    setCompletedPrograms(prev => prev.filter(p => !deleted.includes(p)));
                    setReturnedPrograms(prev => prev.filter(p => !deleted.includes(p)));
                    setDraftPrograms(prev => prev.filter(p => !deleted.includes(p)));
                    showToast(deleted);
                }
            }
        });
    }, [closeModal, hasDraft, loadedDraftData, showToast, year]);

    const handleEditAIP = () => {
        setIsEditing(true);
        setCurrentStep(1);
        setAppMode('wizard');
        setSearchParams({ program: depedProgram, mode: 'wizard' }, { replace: true });
    };

    const handleDeleteSubmission = () => {
        setModal({
            isOpen: true,
            type: 'warning',
            title: 'Delete Submission?',
            message: 'This will permanently delete your submitted AIP. This action cannot be undone. Are you sure you want to proceed?',
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                closeModal();
                try {
                    await api.delete('/api/aips', { params: { program_title: depedProgram, year } });
                    setCompletedPrograms(prev => prev.filter(p => p !== depedProgram));
                    setReturnedPrograms(prev => prev.filter(p => p !== depedProgram));
                    setDraftPrograms(prev => prev.filter(p => p !== depedProgram));
                    showToast([depedProgram]);
                    setAppMode('splash');
                    setSearchParams({}, { replace: true });
                } catch (error) {
                    setModal({
                        isOpen: true,
                        type: 'warning',
                        title: "We couldn't delete this AIP",
                        message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.',
                        confirmText: 'Close',
                        onConfirm: closeModal
                    });
                }
            }
        });
    };

    const handleConfirmSubmit = async () => {
        const filledActivities = activities.filter(a => a.name.trim() !== '');

        const validationErrors = [];
        if (!outcome) validationErrors.push('Please choose an Outcome Category.');
        if (!sipTitle.trim()) validationErrors.push('Please enter a SIP Title.');
        if (filledActivities.length === 0) validationErrors.push('Add at least one activity before submitting.');

        if (validationErrors.length > 0) {
            setModal({
                isOpen: true,
                type: 'warning',
                title: 'Complete the required fields',
                message: validationErrors.join(' '),
                confirmText: 'Review form',
                onConfirm: closeModal
            });
            return;
        }

        const aipBody = {
            program_title: depedProgram,
            year: parseInt(year),
            outcome,
            sip_title: sipTitle,
            project_coordinator: projectCoord,
            objectives: objectives.filter(o => o.trim() !== ''),
            indicators: indicators.filter(ind => ind.description.trim() !== ''),
            prepared_by_name: preparedByName,
            prepared_by_title: preparedByTitle,
            approved_by_name: approvedByName,
            approved_by_title: approvedByTitle,
            activities: filledActivities
        };

        try {
            if (isEditing && aipId) {
                await api.put(`/api/aips/${aipId}`, aipBody);
                setIsEditing(false);
                setAipStatus('Submitted');
                setModal({
                    isOpen: true,
                    type: 'success',
                    title: 'AIP updated',
                    message: 'Your changes have been saved and sent back for review.',
                    confirmText: 'View Submission',
                    onConfirm: () => { closeModal(); setAppMode('readonly'); setSearchParams({ program: depedProgram, mode: 'readonly' }, { replace: true }); },
                    hideCancelButton: true,
                    extraAction: { text: 'Back to Dashboard', onClick: () => { closeModal(); navigate('/'); } }
                });
            } else {
                await api.post('/api/aips', aipBody);
                setIsSubmitted(true);
                localStorage.removeItem(`aip_draft_${depedProgram}_${year}`);
                setModal({
                    isOpen: true,
                    type: 'success',
                    title: 'AIP submitted',
                    message: 'Your AIP - Annual Plan has been submitted. You can review it from your submission history.',
                    confirmText: 'View Submission',
                    onConfirm: () => { closeModal(); setAppMode('readonly'); setSearchParams({ program: depedProgram, mode: 'readonly' }, { replace: true }); },
                    hideCancelButton: true,
                    extraAction: { text: 'Back to Dashboard', onClick: () => { closeModal(); navigate('/'); } }
                });
            }
        } catch (error) {
            setModal({
                isOpen: true,
                type: 'warning',
                title: isEditing ? "We couldn't update this AIP" : "We couldn't submit this AIP",
                message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.',
                confirmText: 'Close',
                onConfirm: closeModal
            });
        }
    };

    // ==========================================
    // RENDER APPLICATION WITH TRANSITIONS
    // ==========================================
    if (isLoading) return <PageLoader message="Loading AIP..." />;

    const showWizardStickyNav = appMode === 'wizard' && isMobile;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-base">
        <ConfirmationModal
            isOpen={modal.isOpen}
            onClose={modal.onClose ?? closeModal}
            onConfirm={modal.onConfirm}
            type={modal.type}
            title={modal.title}
            message={modal.message}
            confirmText={modal.confirmText}
            cancelText={modal.cancelText}
            hideCancelButton={modal.hideCancelButton}
            extraAction={modal.extraAction}
        />
        <ConfirmationModal
            isOpen={showFinalConfirm}
            onClose={() => setShowFinalConfirm(false)}
            onConfirm={() => { setShowFinalConfirm(false); handleConfirmSubmit(); }}
            type="warning"
            title={isEditing ? 'Save AIP changes?' : 'Submit this AIP?'}
            message={isEditing ? 'Your updated AIP will stay in the review process after you save these changes.' : 'Your AIP will be sent for review after submission. You can still edit it while it is pending.'}
            confirmText={isEditing ? 'Save changes' : 'Submit AIP'}
            cancelText="Keep editing"
        />
        {toast && (
            <button
                onClick={() => { setDeletedPopup(toast.programs); }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border text-sm font-bold bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 transition-colors cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {toast.msg}
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
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Deleted Programs</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{deletedPopup.length} AIP{deletedPopup.length > 1 ? 's' : ''} removed</p>
                        </div>
                    </div>
                    <ul className="space-y-2 mb-5 max-h-60 overflow-y-auto">
                        {deletedPopup.map(p => (
                            <li key={p} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 py-1.5 border-b border-slate-100 dark:border-dark-border last:border-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                {p}
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
        <AnimatePresence mode="wait">
            {appMode === 'splash' ? (
                <motion.div key="splash" {...motionProps}>
                    <FormHeader
                        title="Annual Implementation Plan"
                        programName={depedProgram}
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
                        isMobile={isMobile}
                        selectedProgram={splashSelectedProgram}
                        onSelectProgram={(p) => {
                            setSplashSelectedProgram(p);
                            if (p) {
                                setSearchParams({ program: p }, { replace: true });
                            } else {
                                setSearchParams({}, { replace: true });
                            }
                        }}
                    />
                </motion.div>
            ) : (
                <AIPFormEditor
                    appMode={appMode}
                    toggleAppMode={() => {
                        const newMode = appMode === 'wizard' ? 'full' : 'wizard';
                        setAppMode(newMode);
                        setSearchParams({ program: depedProgram, mode: newMode }, { replace: true });
                    }}
                    motionProps={motionProps}
                    isMobile={isMobile}
                    depedProgram={depedProgram}
                    year={year}
                    setYear={setYear}
                    isEditing={isEditing}
                    aipStatus={aipStatus}
                    outcome={outcome}
                    sipTitle={sipTitle}
                    setSipTitle={setSipTitle}
                    projectCoord={projectCoord}
                    setProjectCoord={setProjectCoord}
                    selectedTarget={selectedTarget}
                    objectives={objectives}
                    indicators={indicators}
                    activities={activities}
                    expandedActivityId={expandedActivityId}
                    setExpandedActivityId={setExpandedActivityId}
                    preparedByName={preparedByName}
                    setPreparedByName={setPreparedByName}
                    preparedByTitle={preparedByTitle}
                    setPreparedByTitle={setPreparedByTitle}
                    approvedByName={approvedByName}
                    setApprovedByName={setApprovedByName}
                    approvedByTitle={approvedByTitle}
                    setApprovedByTitle={setApprovedByTitle}
                    coordinatorSuggestions={coordinatorSuggestions}
                    personsTerms={personsTerms}
                    onOutcomeChange={handleOutcomeChange}
                    onTargetChange={handleTargetChange}
                    onObjectiveChange={handleObjectiveChange}
                    onAddObjective={addObjective}
                    onRemoveObjective={removeObjective}
                    onIndicatorChange={handleIndicatorChange}
                    onAddIndicator={addIndicator}
                    onRemoveIndicator={removeIndicator}
                    onActivityChange={handleActivityChange}
                    onAddActivity={handleAddActivity}
                    onAddActivityPhase={handleAddActivityPhase}
                    onRemoveActivity={handleRemoveActivity}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onNextStep={nextStep}
                    onPrevStep={prevStep}
                    onEditSection={editSection}
                    reviewAreaRef={reviewAreaRef}
                    isSaving={isSaving}
                    isSaved={isSaved}
                    lastSavedTime={lastSavedTime}
                    lastAutoSavedTime={lastAutoSavedTime}
                    onSaveForLater={handleSaveForLater}
                    isSubmitted={isSubmitted}
                    showFinalConfirm={showFinalConfirm}
                    onShowFinalConfirm={setShowFinalConfirm}
                    isPreviewOpen={isPreviewOpen}
                    onPreviewOpen={setIsPreviewOpen}
                    onBack={handleBack}
                    onHome={handleHome}
                    onEditAIP={handleEditAIP}
                    onDeleteSubmission={handleDeleteSubmission}
                />
            )}
        </AnimatePresence>
        </div>
    );
}
