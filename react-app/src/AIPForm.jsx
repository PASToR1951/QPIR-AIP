import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { TextareaAuto } from './components/ui/TextareaAuto';
import { FormHeader } from './components/ui/FormHeader';
import { FormBoxHeader } from './components/ui/FormBoxHeader';
import { ViewModeSelector } from './components/ui/ViewModeSelector';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { DocumentPreviewModal } from './components/ui/DocumentPreviewModal';
import { AIPDocument } from './components/docs/AIPDocument';
import { useAccessibility } from './context/AccessibilityContext';
import { PageLoader } from './components/ui/PageLoader';
import WizardStepper from './components/ui/WizardStepper';
import SectionHeader from './components/ui/SectionHeader';
import SignatureBlock from './components/ui/SignatureBlock';
import FinalizeCard from './components/ui/FinalizeCard';

import AIPProfileSection from './components/forms/aip/AIPProfileSection';
import AIPGoalsTargetsSection from './components/forms/aip/AIPGoalsTargetsSection';
import AIPActionPlanSection from './components/forms/aip/AIPActionPlanSection';

export default function App() {
    const navigate = useNavigate();
    const { settings } = useAccessibility();
    const motionProps = useMemo(() => (
        settings.reduceMotion
            ? { initial: false, animate: false, exit: false, transition: { duration: 0 } }
            : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.15, ease: 'easeOut' } }
    ), [settings.reduceMotion]);
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch {
        localStorage.removeItem('user');
    }
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const isDivisionPersonnel = user?.role === 'Division Personnel';

    const saveTimerRef = useRef(null);

    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [isMobile, setIsMobile] = useState(false);
    const [year, setYear] = useState(String(new Date().getFullYear()));

    // UI State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
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

    // Draft State Tracking for ViewModeSelector
    const [hasDraft, setHasDraft] = useState(false);
    const [draftInfo, setDraftInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [loadedDraftData, setLoadedDraftData] = useState(null);
    const [submittedAipStatus, setSubmittedAipStatus] = useState(null);
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
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs`, { headers: authHeaders }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs/with-aips`, { headers: authHeaders }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/aips/draft`, { headers: authHeaders }),
                    schoolOrUserId ? axios.get(`${import.meta.env.VITE_API_URL}/api/schools/${schoolOrUserId}/coordinators`, { headers: authHeaders }) : Promise.resolve(null),
                    schoolOrUserId ? axios.get(`${import.meta.env.VITE_API_URL}/api/schools/${schoolOrUserId}/persons-terms`, { headers: authHeaders }) : Promise.resolve(null),
                ];
                const results = await Promise.allSettled(requests);
                const [programsRes, completedRes, draftRes, coordsRes, termsRes] = results;
                if (programsRes.status === 'fulfilled') {
                    const pdata = programsRes.value.data;
                    setProgramList(pdata.map(p => p.title).sort());
                    setProgramAbbreviations(Object.fromEntries(pdata.filter(p => p.abbreviation).map(p => [p.title, p.abbreviation])));
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
    }, []);

    // Called when the user picks program + mode in the splash
    const handleStart = async (mode, selectedProgram, opts = {}) => {
        setDepedProgram(selectedProgram);
        resetFormState();

        if (mode === 'readonly') {
            try {
                const year = new Date().getFullYear();
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/aips`,
                    { params: { program_title: selectedProgram, year }, headers: authHeaders }
                );
                const d = res.data;
                setYear(String(d.year));
                setSubmittedAipStatus(d.status || null);
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
                return; // stay on splash if fetch fails
            }
            setAppMode('readonly');
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
                    title: 'Restore Auto-Save?',
                    message: `An auto-saved draft was found from ${new Date(lsData.savedAt).toLocaleString()}. Restore it?${hasServerDraft ? ' Or discard it to load your last saved draft instead.' : ''}`,
                    confirmText: 'Yes, Restore',
                    cancelText: hasServerDraft ? 'No, Load Saved Draft' : 'Cancel',
                    onConfirm: () => {
                        loadDraftIntoState(lsData);
                        closeModal();
                        setAppMode(mode);
                    },
                    onClose: async () => {
                        closeModal();
                        localStorage.removeItem(lsKey);
                        if (hasServerDraft) {
                            try {
                                const currentYear = parseInt(year);
                                const draftRes = await axios.get(
                                    `${import.meta.env.VITE_API_URL}/api/aips/draft`,
                                    { params: { program_title: selectedProgram, year: currentYear }, headers: authHeaders }
                                );
                                if (draftRes.data.hasDraft) loadDraftIntoState(draftRes.data.draftData);
                            } catch { /* proceed with blank form */ }
                        }
                        setAppMode(mode);
                    }
                });
                return; // modal will trigger setAppMode on confirm or onClose
            } catch { /* ignore malformed */ }
        }

        // Fetch draft from server for this specific program
        if (draftPrograms.includes(selectedProgram)) {
            try {
                const currentYear = parseInt(year);
                const draftRes = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/aips/draft`,
                    { params: { program_title: selectedProgram, year: currentYear }, headers: authHeaders }
                );
                if (draftRes.data.hasDraft) loadDraftIntoState(draftRes.data.draftData);
            } catch { /* proceed with blank form */ }
        }
        setAppMode(mode);
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
        if (appMode === 'splash') {
            navigate('/');
        } else {
            if (hasInputtedData()) {
                handleSaveForLater();
            }
            setAppMode('splash');
        }
    };

    const handleHome = () => {
        if (hasInputtedData()) {
            handleSaveForLater();
        }
        navigate('/');
    };

    const handleSaveForLater = async () => {
        clearTimeout(saveTimerRef.current);
        setIsSaving(true);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/aips/draft`, {
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
            }, { headers: authHeaders });
            localStorage.removeItem(`aip_draft_${depedProgram}_${year}`);
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
        setIsAddingActivity(true);
        setTimeout(() => setIsAddingActivity(false), 1200);
    }, []);

    const handleAddActivityPhase = useCallback((targetPhase) => {
        const newId = crypto.randomUUID();
        setActivities(prev => [...prev, { id: newId, phase: targetPhase, name: "", period: "", periodStartMonth: "", periodEndMonth: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }]);
        setExpandedActivityId(newId);

        setIsAddingActivity(true);
        setTimeout(() => setIsAddingActivity(false), 1200);
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
                        axios.delete(`${import.meta.env.VITE_API_URL}/api/aips`, {
                            params: { program_title: prog, year: currentYear },
                            headers: authHeaders
                        })
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
    }, [authHeaders, closeModal, hasDraft, loadedDraftData, showToast, year]);

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
                    await axios.delete(
                        `${import.meta.env.VITE_API_URL}/api/aips`,
                        { params: { program_title: depedProgram, year }, headers: authHeaders }
                    );
                    setCompletedPrograms(prev => prev.filter(p => p !== depedProgram));
                    setReturnedPrograms(prev => prev.filter(p => p !== depedProgram));
                    setDraftPrograms(prev => prev.filter(p => p !== depedProgram));
                    showToast([depedProgram]);
                    setAppMode('splash');
                } catch (error) {
                    setModal({
                        isOpen: true,
                        type: 'warning',
                        title: 'Deletion Failed',
                        message: error.response?.data?.error || 'An error occurred while deleting the AIP. Please try again.',
                        confirmText: 'Dismiss',
                        onConfirm: closeModal
                    });
                }
            }
        });
    };

    const handleConfirmSubmit = async () => {
        const filledActivities = activities.filter(a => a.name.trim() !== '');

        const validationErrors = [];
        if (!outcome) validationErrors.push('Outcome Category is required.');
        if (!sipTitle.trim()) validationErrors.push('SIP Title is required.');
        if (filledActivities.length === 0) validationErrors.push('At least one activity with a name is required.');

        if (validationErrors.length > 0) {
            setModal({
                isOpen: true,
                type: 'warning',
                title: 'Required Fields Missing',
                message: validationErrors.join(' '),
                confirmText: 'OK',
                onConfirm: closeModal
            });
            return;
        }

        try {
            await axios.post(
              `${import.meta.env.VITE_API_URL}/api/aips`,
              {
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
              },
              { headers: authHeaders }
            );

            setIsSubmitted(true);
            localStorage.removeItem(`aip_draft_${depedProgram}_${year}`);
            // Draft is now promoted to Submitted in the backend — no separate delete needed
            setModal({
                isOpen: true,
                type: 'success',
                title: 'Success!',
                message: 'The Annual Implementation Plan has been saved to the database.',
                confirmText: 'Back to Dashboard',
                onConfirm: () => navigate('/')
            });
        } catch (error) {
            setModal({
                isOpen: true,
                type: 'warning',
                title: 'Submission Failed',
                message: error.response?.data?.error || 'An error occurred while saving the AIP. Please try again.',
                confirmText: 'Dismiss',
                onConfirm: closeModal
            });
        }
    };

    // ==========================================
    // RENDER APPLICATION WITH TRANSITIONS
    // ==========================================
    if (isLoading) return <PageLoader message="Loading AIP..." />;

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
                    />
                </motion.div>
            ) : appMode === 'readonly' ? (
                <motion.div key="readonly" {...motionProps}>
                    <FormHeader title="Annual Implementation Plan" programName={depedProgram} onBack={() => setAppMode('splash')} theme="pink" />
                    <div className="bg-slate-50 dark:bg-dark-base min-h-screen font-sans print:bg-white">
                        {/* Lock banner */}
                        <div className="max-w-5xl mx-auto px-4 pt-8 pb-4 print:hidden">
                            <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex-1">This form has been submitted and is read-only.</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDeleteSubmission}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                        </svg>
                                        Delete Submission
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                                        </svg>
                                        Print / Save PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Document */}
                        <div className="max-w-5xl mx-auto px-4 pb-12">
                            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border p-8 print:shadow-none print:border-none print:p-0 print:rounded-none">
                                <AIPDocument
                                    year={year}
                                    outcome={outcome}
                                    depedProgram={depedProgram}
                                    sipTitle={sipTitle}
                                    projectCoord={projectCoord}
                                    objectives={objectives}
                                    indicators={indicators}
                                    activities={activities}
                                    preparedByName={preparedByName}
                                    preparedByTitle={preparedByTitle}
                                    approvedByName={approvedByName}
                                    approvedByTitle={approvedByTitle}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div key="form" {...motionProps}>
                    <div className="bg-slate-50 dark:bg-dark-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 font-sans relative print:py-0 print:bg-white print:text-black">
            <FormHeader
                title="Annual Implementation Plan"
                programName={depedProgram}
                onSave={handleSaveForLater}
                onBack={handleBack}
                onHome={handleHome}
                isSaving={isSaving}
                isSaved={isSaved}
                lastSavedTime={lastSavedTime}
                lastAutoSavedTime={lastAutoSavedTime}
                theme="pink"
                appMode={appMode}
                toggleAppMode={() => setAppMode(appMode === 'wizard' ? 'full' : 'wizard')}
            />

            <DocumentPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="AIP Document Preview"
                subtitle={`Annual Implementation Plan Cycle ${year}`}
                filename={`AIP_${year}${sipTitle ? '_' + sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') : ''}`}
            >
                <AIPDocument
                    year={year}
                    outcome={outcome}
                    depedProgram={depedProgram}
                    sipTitle={sipTitle}
                    projectCoord={projectCoord}
                    objectives={objectives}
                    indicators={indicators}
                    activities={activities}
                    preparedByName={preparedByName}
                    preparedByTitle={preparedByTitle}
                    approvedByName={approvedByName}
                    approvedByTitle={approvedByTitle}
                />
            </DocumentPreviewModal>

            <style>{`
                @media print {
                    @page { margin: 1cm; }
                    body { background-color: white !important; color: black !important; }
                    .print-reset { background: transparent !important; color: black !important; border-color: black !important; }
                }
            `}</style>



            {/* MAIN CONTAINER */}
            <div className="container mx-auto max-w-5xl relative z-10 mt-8 mb-12 print:hidden px-4 md:px-0">

                {/* Independent Header Card (Wizard View) */}
                {appMode === 'wizard' && (
                    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-6 shadow-md mb-6">
                        <FormBoxHeader
                            title="Annual Implementation Plan"
                            badge={`CY ${year}`}
                            compact={true}
                        />
                    </div>
                )}

                <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] p-6 md:p-12 shadow-xl relative">

                    {/* FULL VIEW HEADER */}                    {appMode === 'full' && (
                        <FormBoxHeader
                            title="Annual Implementation Plan"
                            badge={`CY ${year}`}
                        />
                    )}
                    {/* ============================================================== */}
                    {/* WIZARD MODE: STEPPER */}
                    {/* ============================================================== */}
                    {appMode === 'wizard' && (
                        <WizardStepper 
                            steps={[
                                { num: 1, label: "Alignment" },
                                { num: 2, label: "Targets" },
                                { num: 3, label: "Action Plan" },
                                { num: 4, label: "M&E" },
                                { num: 5, label: "Signatures" },
                                { num: 6, label: "Finalize" }
                            ]}
                            currentStep={currentStep}
                            theme="pink"
                        />
                    )}

                    <form onSubmit={(e) => e.preventDefault()}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={appMode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="min-h-[300px]">

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 1: PROFILE / ALIGNMENT */}
                            {/* -------------------------------------------------------- */}
                            <div className={`${(appMode === 'full' || currentStep === 1) ? 'block' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                                <AIPProfileSection
                                    appMode={appMode}
                                    outcome={outcome}
                                    setOutcome={handleOutcomeChange}
                                    selectedTarget={selectedTarget}
                                    setSelectedTarget={handleTargetChange}
                                    year={year}
                                    setYear={setYear}
                                    depedProgram={depedProgram}
                                    sipTitle={sipTitle}
                                    setSipTitle={setSipTitle}
                                    projectCoord={projectCoord}
                                    setProjectCoord={setProjectCoord}
                                    coordinatorSuggestions={coordinatorSuggestions}
                                />
                            </div>

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 2: GOALS AND TARGETS */}
                            {/* -------------------------------------------------------- */}
                            <div className={`${(appMode === 'full' || currentStep === 2) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                                <AIPGoalsTargetsSection
                                    appMode={appMode}
                                    objectives={objectives}
                                    handleObjectiveChange={handleObjectiveChange}
                                    addObjective={addObjective}
                                    removeObjective={removeObjective}
                                    indicators={indicators}
                                    handleIndicatorChange={handleIndicatorChange}
                                    addIndicator={addIndicator}
                                    removeIndicator={removeIndicator}
                                />
                            </div>

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 3: ACTION PLAN & BUDGET */}
                            {/* -------------------------------------------------------- */}
                            <div className={`${(appMode === 'full' || currentStep === 3 || currentStep === 4) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                                <AIPActionPlanSection
                                    appMode={appMode}
                                    currentStep={currentStep}
                                    activities={activities}
                                    expandedActivityId={expandedActivityId}
                                    setExpandedActivityId={setExpandedActivityId}
                                    handleActivityChange={handleActivityChange}
                                    handleRemoveActivity={handleRemoveActivity}
                                    handleAddActivityPhase={handleAddActivityPhase}
                                    personsTerms={personsTerms}
                                />
                            </div>

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 5: SIGNATURES */}
                            {/* -------------------------------------------------------- */}
                            {(appMode === 'full' || currentStep === 5) && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
                                    <SectionHeader 
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
                                        title="Signatures"
                                        subtitle="Finalize with necessary approvals."
                                        theme="pink"
                                        appMode={appMode}
                                    />

                                    <div className="bg-white dark:bg-dark-surface p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm mb-2 relative overflow-hidden">
                                        <svg className="absolute inset-0 h-full w-full opacity-20 dark:opacity-40 stroke-slate-300 dark:stroke-dark-border" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%)' }} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines)"></rect></svg>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                                            <SignatureBlock 
                                                label="Prepared by" 
                                                name={preparedByName} 
                                                title={preparedByTitle} 
                                                onNameChange={setPreparedByName} 
                                                onTitleChange={setPreparedByTitle} 
                                                namePlaceholder="FULL NAME" 
                                                titlePlaceholder="Title / Position" 
                                                theme="pink" 
                                            />
                                            <SignatureBlock 
                                                label="Approved" 
                                                name={approvedByName} 
                                                title={approvedByTitle} 
                                                onNameChange={setApprovedByName} 
                                                onTitleChange={setApprovedByTitle} 
                                                namePlaceholder="FULL NAME" 
                                                titlePlaceholder="Title / Position" 
                                                theme="pink" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 6: FINAL REVIEW & SUBMIT */}
                            {/* -------------------------------------------------------- */}
                            {(appMode === 'full' || currentStep === 6) && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
                                    {appMode === 'wizard' && (
                                        <FinalizeCard 
                                            isSubmitted={isSubmitted} 
                                            onSubmit={handleConfirmSubmit} 
                                            onPreview={() => setIsPreviewOpen(true)}
                                            theme="pink" 
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ======================================================== */}
                        {/* WIZARD MODE: NAVIGATION BUTTONS (Back / Continue)       */}
                        {/* ======================================================== */}
                        {appMode === 'wizard' && (
                            <div className="mt-12 flex justify-between items-center pt-6 border-t border-slate-200 dark:border-dark-border">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{pointerEvents:'none'}}><path d="m15 18-6-6 6-6" /></svg>
                                    Back
                                </button>

                                {currentStep < totalSteps && (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors active:scale-95 shadow-md"
                                    >
                                        Continue
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{pointerEvents:'none'}}><path d="m9 18 6-6-6-6" /></svg>
                                    </button>
                                )}
                            </div>
                        )}
                        {/* FINAL ACTION BUTTONS (Below Full Form Only) */}
                        {appMode === 'full' && (
                            <div className="print:hidden mt-12 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg relative z-10">
                                <h3 className="text-slate-800 dark:text-slate-100 font-bold text-xl mb-6">Ready to finalize your plan?</h3>

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
                                        onClick={handleConfirmSubmit}
                                        disabled={isSubmitted}
                                        className="inline-flex h-14 items-center justify-center rounded-2xl bg-pink-600 px-8 py-1 text-sm font-bold text-white transition-colors gap-3 hover:bg-pink-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        {isSubmitted ? "Submitted" : "Confirm & Submit"}
                                    </button>
                                </div>
                            </div>
                        )}
                        </motion.div>
                        </AnimatePresence>
                    </form>
                </div>
            </div>

        </div>
                </motion.div>
            )}
        </AnimatePresence>
        </div>
    );
}
