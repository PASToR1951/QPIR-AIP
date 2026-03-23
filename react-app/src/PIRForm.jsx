import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import PIRFinancialsSection from './components/forms/pir/PIRFinancialsSection';
import PIRMonitoringEvaluationSection from './components/forms/pir/PIRMonitoringEvaluationSection';
import PIRFactorsSection from './components/forms/pir/PIRFactorsSection';

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
    const [programsWithAIPs, setProgramsWithAIPs] = useState([]);
    const [completedPrograms, setCompletedPrograms] = useState([]);
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
                ];
                requests.push(axios.get(`${import.meta.env.VITE_API_URL}/api/pirs/draft`, { headers: authHeaders }));
                const results = await Promise.allSettled(requests);
                const [withAIPsRes, withPIRsRes, draftRes] = results;
                if (withAIPsRes.status === 'fulfilled') setProgramsWithAIPs(withAIPsRes.value.data.map(p => p.title));
                if (withPIRsRes.status === 'fulfilled') setCompletedPrograms(withPIRsRes.value.data.map(p => p.title));
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

    // Form State
    const [program, setProgram] = useState("");
    // School Users: school is always their own school (pre-filled, not selectable)
    // Division Personnel: no school association
    const [school, setSchool] = useState(user?.school_name || "");
    const [owner, setOwner] = useState("");
    const [fundSource, setFundSource] = useState("");
    const [ownerLocked, setOwnerLocked] = useState(false);
    const [budgetLocked, setBudgetLocked] = useState(false);
    const [fundSourceLocked, setFundSourceLocked] = useState(false);

    const [rawBudget, setRawBudget] = useState("");
    const [isBudgetFocused, setIsBudgetFocused] = useState(false);

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

    const formatCurrency = (val) => {
        if (!val) return "";
        return `₱ ${parseFloat(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const displayBudget = isBudgetFocused ? rawBudget : formatCurrency(rawBudget);

    const [activities, setActivities] = useState([
        { id: crypto.randomUUID(), name: "", implementation_period: "", aip_activity_id: null, fromAIP: false, physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }
    ]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);

    // Add state to track which activity card is expanded (for Wizard)
    const [expandedActivityId, setExpandedActivityId] = useState(activities[0].id);

    const initialFactors = FACTOR_TYPES.reduce((acc, type) => {
        acc[type] = { facilitating: "", hindering: "" };
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
        setBudgetLocked(false);
        setFundSourceLocked(false);
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

                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/aips/activities`, { params });
                const aipActivities = res.data.activities;
                if (aipActivities && aipActivities.length > 0) {
                    // Filter to activities relevant to the current quarter
                    const qStart = (currentQuarterNum - 1) * 3 + 1;
                    const qEnd = currentQuarterNum * 3;
                    const relevantActivities = aipActivities.filter(a =>
                        a.period_start_month && a.period_end_month
                            ? (a.period_start_month <= qEnd && a.period_end_month >= qStart)
                            : true // Legacy data without structured months — show in all quarters
                    );
                    const activitiesToUse = relevantActivities.length > 0 ? relevantActivities : aipActivities;
                    setActivities(activitiesToUse.map(a => ({
                        id: crypto.randomUUID(),
                        name: a.activity_name,
                        implementation_period: a.implementation_period,
                        aip_activity_id: a.id,
                        fromAIP: true,
                        physTarget: "",
                        finTarget: "",
                        physAcc: "",
                        finAcc: "",
                        actions: ""
                    })));
                    // Budget and fund source are always locked from AIP when activities load
                    if (!rawBudget) { setRawBudget(res.data.total_budget > 0 ? String(res.data.total_budget) : ""); setBudgetLocked(true); }
                    if (!fundSource) { setFundSource(res.data.fund_source || ""); setFundSourceLocked(true); }
                }
                // Owner/Coordinator is locked from AIP if not already populated
                if (!owner && res.data.project_coordinator) { setOwner(res.data.project_coordinator); setOwnerLocked(true); }
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

        if (mode === 'readonly') {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/pirs`,
                    { params: { program_title: selectedProgram, quarter: quarterString }, headers: authHeaders }
                );
                const d = res.data;
                setSchool(d.school || "");
                setOwner(d.owner || "");
                setRawBudget(String(d.budget || ""));
                setFundSource(d.fundSource || "");
                if (d.activities) setActivities(d.activities);
                if (d.factors) setFactors(d.factors);
            } catch (e) {
                console.error("Failed to load submitted PIR:", e);
                return; // stay on splash if fetch fails
            }
            setAppMode('readonly');
            return;
        }

        if (hasDraft && loadedDraftData) {
            try {
                const draft = loadedDraftData;
                if (isDivisionPersonnel) setSchool(draft.school || "");
                setOwner(draft.owner || "");
                setFundSource(draft.fundSource || "");
                setRawBudget(draft.rawBudget || "");
                if (draft.activities) setActivities(draft.activities);
                if (draft.factors) setFactors(draft.factors);
            } catch (e) {
                console.error("Failed to load draft:", e);
            }
        }
        setAppMode(mode);
    };

    const hasInputtedData = () => {
        return program || school || owner || fundSource || rawBudget ||
            activities.some(a => a.name || a.physTarget || a.finTarget || a.physAcc || a.finAcc || a.actions) ||
            Object.values(factors).some(f => f.facilitating || f.hindering);
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
                total_budget: rawBudget,
                fund_source: fundSource,
                activity_reviews: activities,
                factors
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
        setActivities(prev => [...prev, { id: newId, name: "", implementation_period: "", aip_activity_id: null, fromAIP: false, physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }]);
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
            const hasData = [row.name, row.physTarget, row.finTarget, row.physAcc, row.finAcc, row.actions].some(val => String(val).trim() !== '');

            if (hasData) {
                setModal({
                    isOpen: true,
                    type: 'warning',
                    title: 'Delete Activity?',
                    message: 'This activity contains data. Are you sure you want to permanently remove it?',
                    confirmText: 'Yes, Delete',
                    onConfirm: () => executeDelete(id)
                });
                return prev;
            } else {
                const newActivities = prev.filter(a => a.id !== id);
                setExpandedActivityId(curr => curr === id && newActivities.length > 0 ? newActivities[newActivities.length - 1].id : curr);
                return newActivities;
            }
        });
    }, [executeDelete]);

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
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/pirs`,
                {
                    program_title: program,
                    quarter: quarterString,
                    program_owner: owner,
                    total_budget: rawBudget,
                    fund_source: fundSource,
                    activity_reviews: activities,
                    factors: factors
                },
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
                onConfirm: () => navigate('/')
            });
        } catch (error) {
            console.error("Failed to submit PIR:", error);
            setModal({
                isOpen: true,
                type: 'warning',
                title: 'Submission Failed',
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
                            onStart={handleStart}
                            hasDraft={hasDraft}
                            draftInfo={draftInfo}
                            draftProgram={loadedDraftData?.program || null}
                            completedPrograms={completedPrograms}
                            theme="blue"
                        />
                    </motion.div>
                ) : appMode === 'readonly' ? (
                    <motion.div key="readonly" {...motionProps}>
                        <FormHeader title="Quarterly Performance Review" programName={program} onBack={() => setAppMode('splash')} theme="blue" />
                        <div className="bg-slate-50 dark:bg-dark-base min-h-screen font-sans print:bg-white">
                            {/* Lock banner */}
                            <div className="max-w-5xl mx-auto px-4 pt-8 pb-4 print:hidden">
                                <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex-1">This form has been submitted and is read-only.</span>
                                    <button
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
                            {/* Document */}
                            <div className="max-w-5xl mx-auto px-4 pb-12">
                                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border p-8 print:shadow-none print:border-none print:p-0 print:rounded-none">
                                    <PIRDocument
                                        quarter={quarterString}
                                        program={program}
                                        school={school}
                                        owner={owner}
                                        budget={rawBudget}
                                        fundSource={fundSource}
                                        activities={activities}
                                        factors={factors}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="form" {...motionProps}>
                        <div className="bg-slate-50 dark:bg-dark-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 font-sans relative print:py-0 print:bg-white print:text-black">
                            <FormHeader
                                title="Quarterly Performance Review"
                                programName={program}
                                onSave={handleSaveForLater}
                                onBack={handleBack}
                                onHome={handleHome}
                                isSaving={isSaving}
                                isSaved={isSaved}
                                lastSavedTime={lastSavedTime}
                                theme="blue"
                                appMode={appMode}
                                toggleAppMode={() => setAppMode(appMode === 'wizard' ? 'full' : 'wizard')}
                            />

                            <DocumentPreviewModal
                                isOpen={isPreviewOpen}
                                onClose={() => setIsPreviewOpen(false)}
                                title="PIR Document Preview"
                                subtitle="Quarterly Program Implementation Review"
                            >
                                <PIRDocument
                                    quarter={quarterString}
                                    program={program}
                                    school={school}
                                    owner={owner}
                                    budget={rawBudget}
                                    fundSource={fundSource}
                                    activities={activities}
                                    factors={factors}
                                />
                            </DocumentPreviewModal>

                            <DocumentPreviewModal
                                isOpen={isAIPPreviewOpen}
                                onClose={() => setIsAIPPreviewOpen(false)}
                                title="Annual Implementation Plan"
                                subtitle={`AIP Reference — ${program}`}
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

                            <style>{`
                @media print {
                    @page { margin: 1cm; }
                    body { background-color: white !important; color: black !important; }
                    .print-reset { background: transparent !important; color: black !important; border-color: black !important; }
                }
            `}</style>



                            {/* Modal */}
                            <ConfirmationModal
                                isOpen={modal.isOpen}
                                onClose={closeModal}
                                onConfirm={modal.onConfirm}
                                type={modal.type}
                                title={modal.title}
                                message={modal.message}
                                confirmText={modal.confirmText}
                            />

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
                                                { num: 2, label: "Financials" },
                                                { num: 3, label: "M&E" },
                                                { num: 4, label: "Factors" },
                                                { num: 5, label: "Signatures" },
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
                                                        isBudgetFocused={isBudgetFocused}
                                                        setIsBudgetFocused={setIsBudgetFocused}
                                                        displayBudget={displayBudget}
                                                        rawBudget={rawBudget}
                                                        setRawBudget={setRawBudget}
                                                        budgetLocked={budgetLocked}
                                                        fundSource={fundSource}
                                                        setFundSource={setFundSource}
                                                        fundSourceLocked={fundSourceLocked}
                                                    />

                                                    {/* -------------------------------------------------------- */}
                                                    {/* SECTION 2: FINANCIAL INFORMATION (Wizard Step 2 Only) */}
                                                    {/* -------------------------------------------------------- */}
                                                    <PIRFinancialsSection
                                                        appMode={appMode}
                                                        currentStep={currentStep}
                                                        isBudgetFocused={isBudgetFocused}
                                                        setIsBudgetFocused={setIsBudgetFocused}
                                                        displayBudget={displayBudget}
                                                        rawBudget={rawBudget}
                                                        setRawBudget={setRawBudget}
                                                        budgetLocked={budgetLocked}
                                                        fundSource={fundSource}
                                                        setFundSource={setFundSource}
                                                        fundSourceLocked={fundSourceLocked}
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
                                                        isAddingActivity={isAddingActivity}
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
                                                    {/* SECTION 4: SIGNATURES (Shared) */}
                                                    {/* -------------------------------------------------------- */}
                                                    <div className={`${(appMode === 'full' || currentStep === 5) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
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

                                                    {/* -------------------------------------------------------- */}
                                                    {/* SECTION 6: FINAL REVIEW & SUBMIT */}
                                                    {/* -------------------------------------------------------- */}
                                                    {(appMode === 'full' || currentStep === 6) && (
                                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-200 mt-6">
                                                            {appMode === 'wizard' && (
                                                                <FinalizeCard
                                                                    isSubmitted={isSubmitted}
                                                                    onSubmit={handleConfirmSubmit}
                                                                    onPreview={() => setIsPreviewOpen(true)}
                                                                    theme="blue"
                                                                />
                                                            )}
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

