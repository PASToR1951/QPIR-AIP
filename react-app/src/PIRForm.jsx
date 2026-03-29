import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const FACTOR_TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];

import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { TextareaAuto } from './components/ui/TextareaAuto';
import { FormHeader } from './components/ui/FormHeader';
import { FormBoxHeader } from './components/ui/FormBoxHeader';
import { ViewModeSelector } from './components/ui/ViewModeSelector';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { DocumentPreviewModal } from './components/ui/DocumentPreviewModal';
import { PIRDocument } from './components/docs/PIRDocument';
import { AIPDocument } from './components/docs/AIPDocument';
import { useAccessibility } from './context/AccessibilityContext';
import { PageLoader } from './components/ui/PageLoader';
import WizardStepper from './components/ui/WizardStepper';
import SectionHeader from './components/ui/SectionHeader';
import SignatureBlock from './components/ui/SignatureBlock';
import FinalizeCard from './components/ui/FinalizeCard';

import PIRProfileSection from './components/forms/pir/PIRProfileSection';
import PIRIndicatorsSection from './components/forms/pir/PIRIndicatorsSection';
import PIRMonitoringEvaluationSection from './components/forms/pir/PIRMonitoringEvaluationSection';
import PIRFactorsSection from './components/forms/pir/PIRFactorsSection';
import PIRActionItemsSection from './components/forms/pir/PIRActionItemsSection';

export default function App() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
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
    const draftIndicatorsLoaded = useRef(false);
    const pirActivitiesLoaded = useRef(false);
    const autoStarted = useRef(false);

    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [isMobile, setIsMobile] = useState(false);
    const [programsWithAIPs, setProgramsWithAIPs] = useState([]);
    const [programAbbreviations, setProgramAbbreviations] = useState({});
    const [completedPrograms, setCompletedPrograms] = useState([]);
    const [supervisorName, setSupervisorName] = useState('');
    const [supervisorTitle, setSupervisorTitle] = useState('');
    const [quarterString] = useState(() => {
        const date = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();
        if (month <= 2) return `1st Quarter CY ${year}`;
        if (month <= 5) return `2nd Quarter CY ${year}`;
        if (month <= 8) return `3rd Quarter CY ${year}`;
        return `4th Quarter CY ${year}`;
    });

    // Quarter number (1-4) for activity filtering
    const currentQuarterNum = (() => {
        if (quarterString.startsWith('1st')) return 1;
        if (quarterString.startsWith('2nd')) return 2;
        if (quarterString.startsWith('3rd')) return 3;
        return 4;
    })();

    // Fetch programs, PIR completion status, draft, and school map in parallel on mount
    useEffect(() => {
        const init = async () => {
            try {
                const requests = [
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs/with-aips`, { headers: authHeaders }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs/with-pirs`, { headers: authHeaders }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/config`),
                ];
                requests.push(axios.get(`${import.meta.env.VITE_API_URL}/api/pirs/draft`, { headers: authHeaders }));
                const results = await Promise.allSettled(requests);
                const [withAIPsRes, withPIRsRes, configRes, draftRes] = results;
                if (withAIPsRes.status === 'fulfilled') {
                    const pdata = withAIPsRes.value.data;
                    setProgramsWithAIPs(pdata.map(p => p.title));
                    setProgramAbbreviations(Object.fromEntries(pdata.filter(p => p.abbreviation).map(p => [p.title, p.abbreviation])));
                }
                if (withPIRsRes.status === 'fulfilled') setCompletedPrograms(withPIRsRes.value.data.map(p => p.title));
                if (configRes.status === 'fulfilled') {
                    setSupervisorName(configRes.value.data.supervisor_name ?? '');
                    setSupervisorTitle(configRes.value.data.supervisor_title ?? '');
                }
                if (draftRes?.status === 'fulfilled' && draftRes.value.data.hasDraft) {
                    setDraftInfo({ lastSaved: draftRes.value.data.lastSaved, draftProgram: draftRes.value.data.draftProgram });
                    setHasDraft(true);
                    if (draftRes.value.data.draftData) setLoadedDraftData(draftRes.value.data.draftData);
                }

            } catch (error) {
                console.error("Failed to initialise PIR:", error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    // UI State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;
    const [activeFactorTab, setActiveFactorTab] = useState(FACTOR_TYPES[0]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isAIPPreviewOpen, setIsAIPPreviewOpen] = useState(false);
    const [aipDocumentData, setAipDocumentData] = useState(null);

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
        onConfirm: () => { }
    });

    const closeModal = useCallback(() => setModal(prev => ({ ...prev, isOpen: false })), []);

    // Submitted PIR tracking (for edit/delete)
    const [pirId, setPirId] = useState(null);
    const [pirStatus, setPirStatus] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Splash stage-2 selection (program chosen but no mode yet)
    const [splashSelectedProgram, setSplashSelectedProgram] = useState(null);

    // Form State
    const [program, setProgram] = useState("");
    // School Users: school is always their own school (pre-filled, not selectable)
    // Division Personnel: no school association
    const [school, setSchool] = useState(user?.school_name || "");
    const [owner, setOwner] = useState("");
    const [ownerLocked, setOwnerLocked] = useState(false);

    // Budget split (v4)
    const [budgetFromDivision, setBudgetFromDivision] = useState("");
    const [budgetFromCoPSF, setBudgetFromCoPSF] = useState("");

    // Functional Division (Division Personnel only)
    const [functionalDivision, setFunctionalDivision] = useState("");

    // Section B — Performance Indicators
    const [indicatorTargets, setIndicatorTargets] = useState([]);

    // Section E — Action Items
    const [actionItems, setActionItems] = useState(
        [{ action: '', response_asds: '', response_sds: '' }]
    );

    // Date Initialization & Resize Listener
    useEffect(() => {
        // Screen Size Listener
        const checkMobile = () => {
            const mobileStatus = window.innerWidth < 768;
            setIsMobile(mobileStatus);
            // Enforce Wizard exclusively on smaller screens
            if (mobileStatus && appMode === 'full') {
                setAppMode('wizard');
            }
        };

        checkMobile(); // Initial check
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, [appMode]);

    const [activities, setActivities] = useState([
        { id: crypto.randomUUID(), name: "", implementation_period: "", period_start_month: null, period_end_month: null, aip_activity_id: null, fromAIP: false, isUnplanned: false, complied: null, actualTasksConducted: "", contributoryIndicators: "", movsExpectedOutputs: "", adjustments: "", physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }
    ]);
    const [removedAIPActivities, setRemovedAIPActivities] = useState([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);

    // Add state to track which activity card is expanded (for Wizard)
    const [expandedActivityId, setExpandedActivityId] = useState(activities[0].id);

    const initialFactors = FACTOR_TYPES.reduce((acc, type) => {
        acc[type] = { facilitating: "", hindering: "", recommendations: "" };
        return acc;
    }, {});
    const [factors, setFactors] = useState(initialFactors);

    // Draft State Tracking for ViewModeSelector
    const [hasDraft, setHasDraft] = useState(false);
    const [draftInfo, setDraftInfo] = useState(null);
    const [loadedDraftData, setLoadedDraftData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Reset AIP-prefilled lock flags and cached AIP doc when program changes
    useEffect(() => {
        setOwnerLocked(false);
        setAipDocumentData(null);
    }, [program]);

    // Auto-fetch AIP activities when program is selected (and school is available for School Users)
    useEffect(() => {
        if (!program) return;

        // School Users need their school ID; Division Personnel use their user ID
        const schoolId = isDivisionPersonnel ? null : (user?.school_id || null);
        if (!isDivisionPersonnel && !schoolId) return;

        const yearMatch = quarterString.match(/CY (\d{4})/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

        const fetchAIPActivities = async () => {
            setIsLoadingActivities(true);
            try {
                const params = isDivisionPersonnel
                    ? { user_id: user?.id, program_title: program, year }
                    : { school_id: schoolId, program_title: program, year };

                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/aips/activities`, { params, headers: authHeaders });
                const aipActivities = res.data.activities;
                if (aipActivities && aipActivities.length > 0) {
                    if (pirActivitiesLoaded.current) {
                        // Loading from a submitted PIR — preserve its activity review data
                        pirActivitiesLoaded.current = false;
                    } else {
                        // Filter to activities relevant to the current quarter
                        const qStart = (currentQuarterNum - 1) * 3 + 1;
                        const qEnd = currentQuarterNum * 3;
                        const relevantActivities = aipActivities.filter(a =>
                            a.period_start_month && a.period_end_month
                                ? (a.period_start_month <= qEnd && a.period_end_month >= qStart)
                                : true // Legacy data without structured months — show in all quarters
                        );
                        setActivities(relevantActivities.map(a => ({
                            id: crypto.randomUUID(),
                            name: a.activity_name,
                            implementation_period: a.implementation_period,
                            period_start_month: a.period_start_month ?? null,
                            period_end_month: a.period_end_month ?? null,
                            aip_activity_id: a.id,
                            fromAIP: true,
                            isUnplanned: false,
                            complied: null,
                            actualTasksConducted: "",
                            contributoryIndicators: "",
                            movsExpectedOutputs: a.outputs ?? "",
                            adjustments: "",
                            physTarget: "",
                            finTarget: String(a.budget_amount ?? ""),
                            physAcc: "",
                            finAcc: "",
                            actions: ""
                        })));
                    }
                }
                // Populate indicator targets from AIP indicators
                if (res.data.indicators?.length) {
                    if (draftIndicatorsLoaded.current) {
                        // First fetch after draft load: preserve saved targets, clear flag
                        draftIndicatorsLoaded.current = false;
                    } else {
                        // Normal fetch (new program selected): overwrite with fresh indicators
                        setIndicatorTargets(res.data.indicators.map(ind => ({
                            description: ind.description,
                            annual_target: String(ind.target ?? ''),
                            quarterly_target: '',
                        })));
                    }
                }
                // Owner/Coordinator is always overwritten and locked from AIP when present
                if (res.data.project_coordinator) { setOwner(res.data.project_coordinator); setOwnerLocked(true); }
            } catch {
                // No AIP found - keep manual entry mode
            } finally {
                setIsLoadingActivities(false);
            }
        };

        fetchAIPActivities();
    }, [program, school, quarterString, isDivisionPersonnel]);

    // Called when the user picks program + mode in the splash
    const handleStart = async (mode, selectedProgram) => {
        setProgram(selectedProgram);
        setIsSubmitted(false);

        if (mode === 'readonly') {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/pirs`,
                    { params: { program_title: selectedProgram, quarter: quarterString }, headers: authHeaders }
                );
                const d = res.data;
                setPirId(d.id ?? null);
                setPirStatus(d.status ?? null);
                setSchool(d.school || "");
                setOwner(d.owner || "");
                setBudgetFromDivision(String(d.budgetFromDivision || ""));
                setBudgetFromCoPSF(String(d.budgetFromCoPSF || ""));
                setFunctionalDivision(String(d.functionalDivision || ""));
                if (d.indicatorQuarterlyTargets) setIndicatorTargets(d.indicatorQuarterlyTargets);
                if (d.actionItems) setActionItems(d.actionItems);
                if (d.activities) { setActivities(d.activities); pirActivitiesLoaded.current = true; }
                if (d.factors) setFactors(d.factors);
            } catch (e) {
                console.error("Failed to load submitted PIR:", e);
                return; // stay on splash if fetch fails
            }
            setAppMode('readonly');
            setSearchParams({ program: selectedProgram, mode: 'readonly' }, { replace: true });
            return;
        }

        if (hasDraft && loadedDraftData) {
            try {
                const draft = loadedDraftData;
                if (isDivisionPersonnel) {
                    setSchool(draft.school || "");
                    setFunctionalDivision(draft.functionalDivision || "");
                }
                setOwner(draft.owner || "");
                setBudgetFromDivision(draft.budgetFromDivision || "");
                setBudgetFromCoPSF(draft.budgetFromCoPSF || "");
                if (draft.indicatorQuarterlyTargets?.length) {
                    setIndicatorTargets(draft.indicatorQuarterlyTargets);
                    draftIndicatorsLoaded.current = true;
                }
                if (draft.actionItems?.length) {
                    setActionItems(draft.actionItems);
                }
                if (draft.activities) setActivities(draft.activities);
                if (draft.factors) setFactors(draft.factors);
            } catch (e) {
                console.error("Failed to load draft:", e);
            }
        }
        setAppMode(mode);
        setSearchParams({ program: selectedProgram, mode }, { replace: true });
    };

    const hasInputtedData = () => {
        return program || school || owner || budgetFromDivision || budgetFromCoPSF ||
            activities.some(a => a.name || a.physTarget || a.finTarget || a.physAcc || a.finAcc || a.actions) ||
            Object.values(factors).some(f => f.facilitating || f.hindering) ||
            actionItems.some(item => item.action);
    };

    const handleBack = () => {
        if (appMode === 'splash') {
            navigate('/');
        } else if (isEditing) {
            setIsEditing(false);
            setAppMode('readonly');
            setSearchParams({ program, mode: 'readonly' }, { replace: true });
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

    const handleEditPIR = () => {
        setIsEditing(true);
        setAppMode('wizard');
        setSearchParams({ program, mode: 'wizard' }, { replace: true });
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

    // Sync splash/form state when URL params change
    useEffect(() => {
        if (!autoStarted.current) return;
        const paramProgram = searchParams.get('program');
        const paramMode = searchParams.get('mode');
        if (!paramProgram) {
            setSplashSelectedProgram(null);
            if (appMode !== 'splash') { setAppMode('splash'); setProgram(''); }
        } else if (!paramMode) {
            setSplashSelectedProgram(paramProgram);
            if (appMode !== 'splash') { setAppMode('splash'); setProgram(''); }
        } else if (appMode === 'splash') {
            // URL params restored (e.g. browser back) — re-enter form
            handleStart(paramMode, paramProgram);
        }
    }, [searchParams]);

    const handleDeletePIR = () => {
        setModal({
            isOpen: true,
            type: 'warning',
            title: 'Delete Submitted PIR?',
            message: 'This will permanently delete your submitted PIR for this quarter. This cannot be undone.',
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                closeModal();
                try {
                    await axios.delete(`${import.meta.env.VITE_API_URL}/api/pirs/${pirId}`, { headers: authHeaders });
                    // Remove from completedPrograms and refresh
                    setCompletedPrograms(prev => prev.filter(p => p !== program));
                    setPirId(null);
                    setPirStatus(null);
                    setIsEditing(false);
                    setAppMode('splash');
                    setSearchParams({}, { replace: true });
                } catch (e) {
                    setModal({
                        isOpen: true,
                        type: 'warning',
                        title: 'Delete Failed',
                        message: e.response?.data?.error || 'Failed to delete the PIR. It may already be under review.',
                        confirmText: 'Dismiss',
                        onConfirm: closeModal,
                    });
                }
            },
        });
    };

    const handleViewAIP = async () => {
        if (!aipDocumentData) {
            try {
                const yearMatch = quarterString.match(/CY (\d{4})/);
                const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/aips`, {
                    params: { program_title: program, year },
                    headers: authHeaders
                });
                setAipDocumentData(res.data);
            } catch (e) {
                console.error("Failed to load AIP for preview:", e);
            }
        }
        setIsAIPPreviewOpen(true);
    };

    const handleSaveForLater = async () => {
        clearTimeout(saveTimerRef.current);
        setIsSaving(true);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/pirs/draft`, {
                program_title: program,
                quarter: quarterString,
                program_owner: owner,
                budget_from_division: budgetFromDivision,
                budget_from_co_psf: budgetFromCoPSF,
                functional_division: isDivisionPersonnel ? functionalDivision : null,
                indicator_quarterly_targets: indicatorTargets,
                action_items: actionItems.filter(item => item.action?.trim()),
                activity_reviews: activities.map(a => ({
                    aip_activity_id: a.fromAIP ? a.aip_activity_id : null,
                    complied: a.complied,
                    actual_tasks_conducted: a.actualTasksConducted,
                    contributory_performance_indicators: a.contributoryIndicators,
                    movs_expected_outputs: a.movsExpectedOutputs,
                    adjustments: a.adjustments,
                    is_unplanned: a.isUnplanned,
                    physTarget: a.physTarget,
                    finTarget: a.finTarget,
                    physAcc: a.physAcc,
                    finAcc: a.finAcc,
                    actions: a.actions,
                })),
                factors: Object.fromEntries(
                    FACTOR_TYPES.map(type => [type, {
                        facilitating: factors[type]?.facilitating ?? '',
                        hindering: factors[type]?.hindering ?? '',
                        recommendations: factors[type]?.recommendations ?? '',
                    }])
                ),
            }, { headers: authHeaders });
        } catch (e) {
            console.error("Failed to save draft:", e);
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
    useEffect(() => () => clearTimeout(saveTimerRef.current), []);

    // Draft state is already loaded from the server in the init useEffect above

    const handleAddActivity = useCallback(() => {
        const newId = crypto.randomUUID();
        setActivities(prev => [...prev, { id: newId, name: "", implementation_period: "", period_start_month: null, period_end_month: null, aip_activity_id: null, fromAIP: false, isUnplanned: false, complied: null, actualTasksConducted: "", contributoryIndicators: "", movsExpectedOutputs: "", adjustments: "", physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }]);
        setExpandedActivityId(newId);

        setIsAddingActivity(true);
        setTimeout(() => setIsAddingActivity(false), 1200);
    }, []);

    const handleAddUnplannedActivity = useCallback(() => {
        const newId = crypto.randomUUID();
        setActivities(prev => [...prev, { id: newId, name: "", implementation_period: "", period_start_month: null, period_end_month: null, aip_activity_id: null, fromAIP: false, isUnplanned: true, complied: null, actualTasksConducted: "", contributoryIndicators: "", movsExpectedOutputs: "", adjustments: "", physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }]);
        setExpandedActivityId(newId);
    }, []);

    const executeDelete = useCallback((id) => {
        setActivities(prev => {
            const row = prev.find(a => a.id === id);
            if (row?.fromAIP) {
                setRemovedAIPActivities(r =>
                    r.some(a => a.id === id) ? r : [...r, row]
                );
            }
            const newActivities = prev.filter(a => a.id !== id);
            setExpandedActivityId(curr => curr === id && newActivities.length > 0 ? newActivities[newActivities.length - 1].id : curr);
            return newActivities;
        });
        setModal(prev => ({ ...prev, isOpen: false }));
        setActivityToDelete(null);
    }, []);

    const handleRemoveActivity = useCallback((id) => {
        setActivities(prev => {
            const row = prev.find(a => a.id === id);
            const hasData = [row.name, row.physTarget, row.finTarget, row.physAcc, row.finAcc, row.actions].some(val => String(val).trim() !== '');

            if (hasData) {
                setModal({
                    isOpen: true,
                    type: 'warning',
                    title: 'Delete Activity?',
                    message: row.fromAIP
                        ? 'This activity contains data. It will be moved to the tray below so you can restore it later.'
                        : 'This activity contains data. Are you sure you want to permanently remove it?',
                    confirmText: 'Yes, Delete',
                    onConfirm: () => executeDelete(id)
                });
                return prev;
            } else {
                if (row?.fromAIP) {
                    setRemovedAIPActivities(r =>
                        r.some(a => a.id === id) ? r : [...r, row]
                    );
                }
                const newActivities = prev.filter(a => a.id !== id);
                setExpandedActivityId(curr => curr === id && newActivities.length > 0 ? newActivities[newActivities.length - 1].id : curr);
                return newActivities;
            }
        });
    }, [executeDelete]);

    const handleRestoreActivity = useCallback((id) => {
        setRemovedAIPActivities(prev => {
            const item = prev.find(a => a.id === id);
            if (item) setActivities(acts => [...acts, item]);
            return prev.filter(a => a.id !== id);
        });
    }, []);

    const handleActivityChange = useCallback((id, field, value) => {
        setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    }, []);

    const handleFactorChange = useCallback((type, category, value) => {
        setFactors(prev => ({
            ...prev,
            [type]: { ...prev[type], [category]: value }
        }));
    }, []);

    const calculateGap = useCallback((targetStr, accStr) => {
        const target = parseFloat(targetStr) || 0;
        const acc = parseFloat(accStr) || 0;
        if (target > 0) {
            if (acc >= target) return 0;
            return ((acc - target) / target) * 100;
        }
        return 0;
    }, []);

    const nextStep = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, totalSteps)), []);
    const prevStep = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 1)), []);

    const editSection = (stepNumber) => {
        if (appMode === 'full') return;
        setCurrentStep(stepNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmSubmit = async () => {
        const pirBody = {
            program_title: program,
            quarter: quarterString,
            program_owner: owner,
            budget_from_division: budgetFromDivision,
            budget_from_co_psf: budgetFromCoPSF,
            functional_division: isDivisionPersonnel ? functionalDivision : null,
            indicator_quarterly_targets: indicatorTargets,
            action_items: actionItems.filter(item => item.action?.trim()),
            activity_reviews: activities.map(a => ({
                aip_activity_id: a.fromAIP ? a.aip_activity_id : null,
                complied: a.complied,
                actual_tasks_conducted: a.actualTasksConducted,
                contributory_performance_indicators: a.contributoryIndicators,
                movs_expected_outputs: a.movsExpectedOutputs,
                adjustments: a.adjustments,
                is_unplanned: a.isUnplanned,
                physTarget: a.physTarget,
                finTarget: a.finTarget,
                physAcc: a.physAcc,
                finAcc: a.finAcc,
                actions: a.actions,
            })),
            factors: Object.fromEntries(
                FACTOR_TYPES.map(type => [type, {
                    facilitating: factors[type]?.facilitating ?? '',
                    hindering: factors[type]?.hindering ?? '',
                    recommendations: factors[type]?.recommendations ?? '',
                }])
            ),
        };

        try {
            if (isEditing && pirId) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/pirs/${pirId}`,
                    pirBody,
                    { headers: authHeaders }
                );
                setIsEditing(false);
                setPirStatus('Submitted');
                setModal({
                    isOpen: true,
                    type: 'success',
                    title: 'PIR Updated!',
                    message: 'Your changes have been saved.',
                    confirmText: 'View Submission',
                    onConfirm: () => { closeModal(); setAppMode('readonly'); setSearchParams({ program, mode: 'readonly' }, { replace: true }); }
                });
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/pirs`,
                    pirBody,
                    { headers: authHeaders }
                );
                setIsSubmitted(true);
                // Draft is promoted to Submitted in the backend — no separate delete needed
                setModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Success!',
                    message: 'The QPIR document has been saved to the database.',
                    confirmText: 'Back to Dashboard',
                    onConfirm: () => { closeModal(); navigate('/'); },
                    hideCancelButton: true,
                    extraAction: { text: 'View Programs', onClick: () => { closeModal(); navigate('/pir'); } }
                });
            }
        } catch (error) {
            console.error("Failed to submit PIR:", error);
            setModal({
                isOpen: true,
                type: 'warning',
                title: isEditing ? 'Update Failed' : 'Submission Failed',
                message: error.response?.data?.error || 'An error occurred while saving the PIR. Please ensure the associated AIP exists.',
                confirmText: 'Dismiss',
                onConfirm: closeModal
            });
        }
    };

    // ==========================================
    // RENDER APPLICATION WITH TRANSITIONS
    // ==========================================
    if (isLoading) return <PageLoader message="Loading PIR..." />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-base">
            <AnimatePresence mode="wait">
                {appMode === 'splash' ? (
                    <motion.div key="splash" {...motionProps}>
                        <FormHeader
                            title="Quarterly Performance Review"
                            programName={program}
                            onBack={handleBack}
                            theme="blue"
                        />
                        <ViewModeSelector
                            programs={programsWithAIPs}
                            programAbbreviations={programAbbreviations}
                            onStart={handleStart}
                            hasDraft={hasDraft}
                            draftInfo={draftInfo}
                            draftProgram={loadedDraftData?.program || null}
                            completedPrograms={completedPrograms}
                            theme="blue"
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
                ) : appMode === 'readonly' ? (
                    <motion.div key="readonly" {...motionProps}>
                        <FormHeader title="Quarterly Performance Review" programName={program} onBack={() => setAppMode('splash')} theme="blue" />
                        <div className="bg-slate-50 dark:bg-dark-base min-h-screen font-sans print:bg-white">
                            {/* Lock banner */}
                            <div className="max-w-5xl mx-auto px-4 pt-8 pb-4 print:hidden">
                                <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-sm flex-wrap">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex-1">
                                        This form has been submitted{pirStatus && pirStatus !== 'Submitted' ? ` — currently ${pirStatus.toLowerCase()} by reviewers` : ' and is read-only'}.
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {pirStatus === 'Submitted' && (
                                            <>
                                                <button
                                                    onClick={handleEditPIR}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={handleDeletePIR}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900/50 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                                    </svg>
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => {
                                                const s = document.createElement('style');
                                                s.textContent = '@media print { @page { size: A4 landscape; margin: 1cm; } }';
                                                document.head.appendChild(s);
                                                window.print();
                                                window.addEventListener('afterprint', () => s.remove(), { once: true });
                                            }}
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
                            {/* Document */}
                            <div className="max-w-7xl mx-auto px-4 pb-12">
                                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border p-8 print:shadow-none print:border-none print:p-0 print:rounded-none">
                                    <PIRDocument
                                        quarter={quarterString}
                                        supervisorName={supervisorName}
                                        supervisorTitle={supervisorTitle}
                                        program={program}
                                        school={school}
                                        owner={owner}
                                        budgetFromDivision={budgetFromDivision}
                                        budgetFromCoPSF={budgetFromCoPSF}
                                        functionalDivision={functionalDivision}
                                        indicatorTargets={indicatorTargets}
                                        activities={activities}
                                        factors={factors}
                                        actionItems={actionItems}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="form" {...motionProps}>
                        <div className="bg-slate-50 dark:bg-dark-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 font-sans relative print:py-0 print:bg-white print:text-black">
                            <FormHeader
                                title={isEditing ? 'Edit Submitted PIR' : 'Quarterly Performance Review'}
                                programName={program}
                                onSave={isEditing ? undefined : handleSaveForLater}
                                onBack={handleBack}
                                onHome={isEditing ? undefined : handleHome}
                                isSaving={isSaving}
                                isSaved={isSaved}
                                lastSavedTime={lastSavedTime}
                                theme="blue"
                                appMode={appMode}
                                toggleAppMode={() => {
                                    const newMode = appMode === 'wizard' ? 'full' : 'wizard';
                                    setAppMode(newMode);
                                    setSearchParams({ program, mode: newMode }, { replace: true });
                                }}
                            />

                            <DocumentPreviewModal
                                isOpen={isPreviewOpen}
                                onClose={() => setIsPreviewOpen(false)}
                                title="PIR Document Preview"
                                subtitle="Quarterly Program Implementation Review"
                                filename={`PIR_${quarterString.replace(/\s+/g, '_')}${program ? '_' + program.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') : ''}`}
                                landscape
                            >
                                <PIRDocument
                                    quarter={quarterString}
                                    supervisorName={supervisorName}
                                    supervisorTitle={supervisorTitle}
                                    program={program}
                                    school={school}
                                    owner={owner}
                                    budgetFromDivision={budgetFromDivision}
                                    budgetFromCoPSF={budgetFromCoPSF}
                                    functionalDivision={functionalDivision}
                                    indicatorTargets={indicatorTargets}
                                    activities={activities}
                                    factors={factors}
                                    actionItems={actionItems}
                                />
                            </DocumentPreviewModal>

                            <DocumentPreviewModal
                                isOpen={isAIPPreviewOpen}
                                onClose={() => setIsAIPPreviewOpen(false)}
                                title="Annual Implementation Plan"
                                subtitle={`AIP Reference — ${program}`}
                                filename={`AIP_${aipDocumentData?.year ?? ''}${aipDocumentData?.sipTitle ? '_' + aipDocumentData.sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') : ''}`}
                            >
                                {aipDocumentData && (
                                    <AIPDocument
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
                                )}
                            </DocumentPreviewModal>

                            {/* Floating AIP reference button */}
                            {program && (
                                <button
                                    onClick={handleViewAIP}
                                    className="fixed bottom-6 left-6 z-50 print:hidden flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl font-bold text-sm transition-all active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                    View AIP
                                </button>
                            )}




                            {/* MAIN CONTAINER */}
                            <div className="container mx-auto max-w-5xl relative z-10 mt-8 mb-12 print:hidden px-4 md:px-0">

                                {/* Independent Header Card (Wizard View) */}
                                {appMode === 'wizard' && (
                                    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-6 shadow-md mb-6">
                                        <FormBoxHeader
                                            title="Quarterly Performance Review"
                                            badge={quarterString}
                                            compact={true}
                                        />
                                    </div>
                                )}

                                <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] p-6 md:p-12 shadow-xl relative">

                                    {/* FULL VIEW HEADER */}
                                    {appMode === 'full' && (
                                        <FormBoxHeader
                                            title="Quarterly Performance Review"
                                            subtitle="Division Monitoring Evaluation and Adjustment"
                                            badge={quarterString}
                                        />
                                    )}
                                    {/* ============================================================== */}
                                    {/* WIZARD MODE: STEPPER & CARDS */}
                                    {/* ============================================================== */}
                                    {appMode === 'wizard' && (
                                        <WizardStepper
                                            steps={[
                                                { num: 1, label: "Profile" },
                                                { num: 2, label: "Indicators" },
                                                { num: 3, label: "M&E" },
                                                { num: 4, label: "Factors" },
                                                { num: 5, label: "Action Items" },
                                                { num: 6, label: "Finalize" }
                                            ]}
                                            currentStep={currentStep}
                                            theme="blue"
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
                                                    {/* SECTION 1: PROFILE (Shared by both Wizard Step 1 and Full Form) */}
                                                    {/* -------------------------------------------------------- */}
                                                    <PIRProfileSection
                                                        appMode={appMode}
                                                        currentStep={currentStep}
                                                        program={program}
                                                        isDivisionPersonnel={isDivisionPersonnel}
                                                        school={school}
                                                        user={user}
                                                        quarterString={quarterString}
                                                        owner={owner}
                                                        setOwner={setOwner}
                                                        ownerLocked={ownerLocked}
                                                        budgetFromDivision={budgetFromDivision}
                                                        setBudgetFromDivision={setBudgetFromDivision}
                                                        budgetFromCoPSF={budgetFromCoPSF}
                                                        setBudgetFromCoPSF={setBudgetFromCoPSF}
                                                        functionalDivision={functionalDivision}
                                                        setFunctionalDivision={setFunctionalDivision}
                                                    />

                                                    {/* -------------------------------------------------------- */}
                                                    {/* SECTION 2: PERFORMANCE INDICATORS (Wizard Step 2) */}
                                                    {/* -------------------------------------------------------- */}
                                                    <PIRIndicatorsSection
                                                        appMode={appMode}
                                                        currentStep={currentStep}
                                                        indicatorTargets={indicatorTargets}
                                                        setIndicatorTargets={setIndicatorTargets}
                                                    />

                                                    {/* -------------------------------------------------------- */}
                                                    {/* WIZARD ONLY: ACTIVITY CARDS (Step 3) */}
                                                    {/* -------------------------------------------------------- */}
                                                    <PIRMonitoringEvaluationSection
                                                        appMode={appMode}
                                                        currentStep={currentStep}
                                                        isLoadingActivities={isLoadingActivities}
                                                        activities={activities}
                                                        expandedActivityId={expandedActivityId}
                                                        setExpandedActivityId={setExpandedActivityId}
                                                        calculateGap={calculateGap}
                                                        handleRemoveActivity={handleRemoveActivity}
                                                        handleActivityChange={handleActivityChange}
                                                        handleAddActivity={handleAddActivity}
                                                        handleAddUnplannedActivity={handleAddUnplannedActivity}
                                                        isAddingActivity={isAddingActivity}
                                                        removedAIPActivities={removedAIPActivities}
                                                        handleRestoreActivity={handleRestoreActivity}
                                                    />

                                                    {/* -------------------------------------------------------- */}
                                                    {/* SECTION 4: FACTORS (Wizard Step 4 / Full Form) */}
                                                    {/* -------------------------------------------------------- */}
                                                    <PIRFactorsSection
                                                        appMode={appMode}
                                                        currentStep={currentStep}
                                                        FACTOR_TYPES={FACTOR_TYPES}
                                                        factors={factors}
                                                        handleFactorChange={handleFactorChange}
                                                    />

                                                    {/* -------------------------------------------------------- */}
                                                    {/* SECTION 5: ACTION ITEMS (Wizard Step 5 / Full Form) */}
                                                    {/* -------------------------------------------------------- */}
                                                    <PIRActionItemsSection
                                                        appMode={appMode}
                                                        currentStep={currentStep}
                                                        actionItems={actionItems}
                                                        setActionItems={setActionItems}
                                                    />

                                                    {/* -------------------------------------------------------- */}
                                                    {/* SECTION 6: SIGNATURES + FINALIZE */}
                                                    {/* -------------------------------------------------------- */}
                                                    <div className={`${(appMode === 'full' || currentStep === 6) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                                                        <SectionHeader
                                                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
                                                            title="Signatures"
                                                            subtitle="Finalize with necessary approvals."
                                                            theme="blue"
                                                            appMode={appMode}
                                                        />

                                                        <div className="bg-white dark:bg-dark-surface p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm mb-2 relative overflow-hidden">
                                                            <svg className="absolute inset-0 h-full w-full opacity-20 dark:opacity-40 stroke-slate-300 dark:stroke-dark-border" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%)' }} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines-pir" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines-pir)"></rect></svg>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                                                                <SignatureBlock
                                                                    label="Prepared by"
                                                                    name={owner}
                                                                    title="Program Owner"
                                                                    onNameChange={setOwner}
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

                                                    {appMode === 'wizard' && currentStep === 6 && (
                                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-200 mt-6">
                                                            <FinalizeCard
                                                                isSubmitted={isSubmitted}
                                                                onSubmit={handleConfirmSubmit}
                                                                onPreview={() => setIsPreviewOpen(true)}
                                                                theme="blue"
                                                                submitLabel={isEditing ? "Save Changes" : undefined}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Navigation Buttons for Wizard Mode */}
                                                {appMode === 'wizard' && (
                                                    <div className="mt-12 pt-6 border-t border-slate-200 dark:border-dark-border flex justify-between items-center">
                                                        <button
                                                            type="button"
                                                            onClick={prevStep}
                                                            disabled={currentStep === 1}
                                                            className={`group relative inline-flex h-12 items-center justify-center rounded-xl px-6 font-medium transition-colors gap-2 ${currentStep === 1
                                                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                                : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface shadow-sm border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-base active:scale-95'
                                                                }`}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                                            Back
                                                        </button>

                                                        {currentStep < totalSteps && (
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={nextStep}
                                                                    className="group relative inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-md transition-colors active:scale-95 hover:bg-slate-800 gap-2"
                                                                >
                                                                    Continue
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* FINAL ACTION BUTTONS (Below Full Form Only) */}
                                                {appMode === 'full' && (
                                                    <div className="mt-12 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg relative z-10">
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
                                                                onClick={handleConfirmSubmit}
                                                                disabled={isSubmitted}
                                                                className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-8 py-1 text-sm font-bold text-white transition-colors gap-3 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                                                {isSubmitted ? "Submitted" : isEditing ? "Save Changes" : "Confirm & Submit"}
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
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText}
                hideCancelButton={modal.hideCancelButton}
                extraAction={modal.extraAction}
            />
        </div>
    );
}

