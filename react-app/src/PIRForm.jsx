import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FACTOR_TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];

import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { TextareaAuto } from './components/ui/TextareaAuto';
import { FormHeader } from './components/ui/FormHeader';
import FormBackground from './components/ui/FormBackground';
import { FormBoxHeader } from './components/ui/FormBoxHeader';
import { ViewModeSelector } from './components/ui/ViewModeSelector';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { DocumentPreviewModal } from './components/ui/DocumentPreviewModal';
import { PIRDocument } from './components/docs/PIRDocument';

export default function App() {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [isMobile, setIsMobile] = useState(false);
    const [programList, setProgramList] = useState([]);
    const [schoolList, setSchoolList] = useState([]);

    const [quarterString] = useState(() => {
        const date = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();
        if (month <= 2) return `1st Quarter CY ${year}`;
        if (month <= 5) return `2nd Quarter CY ${year}`;
        if (month <= 8) return `3rd Quarter CY ${year}`;
        return `4th Quarter CY ${year}`;
    });

    // Fetch programs and schools from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [programsRes, schoolsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/schools`)
                ]);
                setProgramList(programsRes.data.map(p => p.title).sort());
                setSchoolList(schoolsRes.data.map(s => s.name).sort());
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, []);

    // UI State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;
    const [activeFactorTab, setActiveFactorTab] = useState(FACTOR_TYPES[0]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    // Form State
    const [program, setProgram] = useState("");
    const [school, setSchool] = useState("");
    const [owner, setOwner] = useState("");
    const [fundSource, setFundSource] = useState("");

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
        { id: crypto.randomUUID(), name: "", physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }
    ]);

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

    // API - Check for Draft on mount
    useEffect(() => {
        const fetchDraft = async () => {
            if (user?.id) {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/drafts/PIR/${user.id}`);
                    if (res.data.hasDraft) {
                        setDraftInfo({ lastSaved: res.data.lastSaved });
                        setHasDraft(true);
                        setLoadedDraftData(res.data.draftData);
                    }
                } catch (e) {
                    console.error("Failed to read draft info:", e);
                }
            }
        };
        fetchDraft();
    }, [user?.id]);

    // Handlers
    const handleSelectMode = (mode) => {
        if (hasDraft && loadedDraftData) {
            try {
                const draft = loadedDraftData;
                setProgram(draft.program || "");
                setSchool(draft.school || "");
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

    const fillDevData = () => {
        setProgram(programList[0] || "Alternative Learning System (ALS)");
        setSchool(schoolList[0] || "Guihulngan National High School");
        setOwner("Jane Doe");
        setFundSource("MOOE");
        setRawBudget("250000");
        setActivities([
            { id: crypto.randomUUID(), name: "Conduct Q1 Training", physTarget: "50", finTarget: "125000", physAcc: "45", finAcc: "120000", actions: "Reschedule remaining participants to Q2" },
            { id: crypto.randomUUID(), name: "Procure Learning Materials", physTarget: "500", finTarget: "125000", physAcc: "500", finAcc: "125000", actions: "Completed successfully" }
        ]);
        const devFactors = { ...initialFactors };
        devFactors["Technical"] = { facilitating: "Strong local internet connectivity", hindering: "Occasional power interruptions" };
        devFactors["Institutional"] = { facilitating: "Supportive LGU", hindering: "" };
        setFactors(devFactors);
    };

    const handleSaveForLater = async () => {
        setIsSaving(true);
        const draft = {
            program,
            school,
            owner,
            fundSource,
            rawBudget,
            activities,
            factors,
            lastSaved: new Date().toISOString()
        };

        try {
            if (user?.id) {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/drafts`, {
                    user_id: user.id,
                    form_type: 'PIR',
                    draft_data: draft
                });
            }
        } catch (e) {
            console.error("Failed to save draft:", e);
        }

        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setLastSavedTime(timeString);
            setTimeout(() => setIsSaved(false), 3000);
        }, 800);
    };

    // Local Storage - Check for Draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('pir_draft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setDraftInfo({ lastSaved: draft.lastSaved });
                setHasDraft(true);
            } catch (e) {
                console.error("Failed to read draft info:", e);
            }
        }
    }, []);

    const handleAddActivity = () => {
        const newId = crypto.randomUUID();
        setActivities([...activities, { id: newId, name: "", physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }]);
        setExpandedActivityId(newId);

        setIsAddingActivity(true);
        setTimeout(() => setIsAddingActivity(false), 1200);
    };

    const executeDelete = (id) => {
        const newActivities = activities.filter(a => a.id !== id);
        setActivities(newActivities);
        if (expandedActivityId === id && newActivities.length > 0) {
            setExpandedActivityId(newActivities[newActivities.length - 1].id);
        }
        setActivityToDelete(null);
    };

    const handleRemoveActivity = (id) => {
        const row = activities.find(a => a.id === id);
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
        } else {
            executeDelete(id);
        }
    };

    const handleActivityChange = (id, field, value) => {
        setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleFactorChange = (type, category, value) => {
        setFactors({
            ...factors,
            [type]: { ...factors[type], [category]: value }
        });
    };

    const calculateGap = (targetStr, accStr) => {
        const target = parseFloat(targetStr) || 0;
        const acc = parseFloat(accStr) || 0;
        if (target > 0) {
            if (acc >= target) return 0;
            return ((acc - target) / target) * 100;
        }
        return 0;
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const editSection = (stepNumber) => {
        if (appMode === 'full') return;
        setCurrentStep(stepNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmSubmit = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/pirs`, {
                school_name: school,
                program_title: program,
                quarter: quarterString,
                program_owner: owner,
                total_budget: rawBudget,
                fund_source: fundSource,
                activity_reviews: activities,
                factors: factors
            });

            setIsSubmitted(true);
            if (user?.id) {
                try {
                    await axios.delete(`${import.meta.env.VITE_API_URL}/api/drafts/PIR/${user.id}`);
                } catch (e) {
                    console.error("Failed to delete draft:", e);
                }
            }
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
                confirmText: 'Try Again',
                onConfirm: () => { }
            });
        }
    };

    // ==========================================
    // RENDER APPLICATION WITH TRANSITIONS
    // ==========================================
    return (
        <AnimatePresence mode="wait">
            {appMode === 'splash' ? (
                <motion.div
                    key="splash"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <FormHeader
                        title="Quarterly Performance Review"
                        onBack={handleBack}
                        theme="blue"
                    />
                    <ViewModeSelector
                        onSelectMode={handleSelectMode}
                        hasDraft={hasDraft}
                        draftInfo={draftInfo}
                        theme="blue"
                    />
                </motion.div>
            ) : (
                <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="bg-slate-50 min-h-screen flex flex-col text-slate-800 font-sans relative print:py-0 print:bg-white print:text-black">
            <FormHeader
                title="Quarterly Performance Review"
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

            <style>{`
                @media print {
                    @page { margin: 1cm; }
                    body { background-color: white !important; color: black !important; }
                    .print-reset { background: transparent !important; color: black !important; border-color: black !important; }
                }
            `}</style>

            {/* Background rendered via portal — outside transform hierarchy */}
            <FormBackground orb="emerald" />


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
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-md mb-6">
                        <FormBoxHeader
                            title="Quarterly Performance Review"
                            badge={quarterString}
                            compact={true}
                        />
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-12 shadow-xl relative">

                    {/* View Mode & Dev Toggles (Desktop Only) */}
                    {!isMobile && import.meta.env.DEV && (
                        <div className="absolute top-6 right-8 z-20 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={fillDevData}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                Fill Dev Data
                            </button>
                        </div>
                    )}

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
                        <div className="mb-12 pt-6">
                            <div className="flex justify-between items-center max-w-2xl mx-auto px-4 relative">
                                <div className="absolute left-[10%] right-[10%] top-[14px] h-[2px] bg-slate-200 -z-0 hidden md:block rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
                                </div>
                                {[
                                    { num: 1, label: "Profile" },
                                    { num: 2, label: "Financials" },
                                    { num: 3, label: "M&E Progress" },
                                    { num: 4, label: "Factors" },
                                    { num: 5, label: "Signatures" },
                                    { num: 6, label: "Finalize" }
                                ].map((step) => (
                                    <div key={step.num} className="flex flex-col items-center gap-2 relative z-10 w-1/6">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors ${currentStep === step.num ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' :
                                                currentStep > step.num ? 'bg-blue-600 text-white ring-2 ring-white' : 'bg-white text-slate-400 border-2 border-slate-200'
                                            }`}>
                                            {currentStep > step.num ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : step.num}
                                        </div>
                                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${currentStep === step.num ? 'text-blue-700' : 'text-slate-400'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={(e) => e.preventDefault()}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={appMode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="min-h-[300px]">

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 1: PROFILE (Shared by both Wizard Step 1 and Full Form) */}
                            {/* -------------------------------------------------------- */}
                            <div className={`${(appMode === 'full' || currentStep === 1) ? 'block' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                                <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Program Profile</h2>
                                        {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Define the fundamental details of the program being evaluated.</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <Select theme="blue" label="Program Name" placeholder="Select Program" options={programList} value={program} onChange={(e) => setProgram(e.target.value)} />
                                    <Select theme="blue" label="School" placeholder="Select School" options={schoolList} value={school} onChange={(e) => setSchool(e.target.value)} />
                                    <Input theme="blue" label="Program Owner" placeholder="Name of owner" value={owner} onChange={(e) => setOwner(e.target.value)} />

                                    {appMode === 'full' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input theme="blue" label="Budget" placeholder="₱ 0.00" inputMode="decimal" value={displayBudget} onFocus={() => setIsBudgetFocused(true)} onBlur={() => setIsBudgetFocused(false)} onChange={(e) => setRawBudget(e.target.value.replace(/[^0-9.]/g, ''))} />
                                            <Select theme="blue" label="Fund Source" placeholder="Select Source" options={["MOOE", "SARO"]} value={fundSource} onChange={(e) => setFundSource(e.target.value)} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 2: FINANCIAL INFORMATION (Wizard Step 2 Only) */}
                            {/* -------------------------------------------------------- */}
                            {appMode === 'wizard' && currentStep === 2 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Financial Information</h2>
                                            <p className="text-sm text-slate-500 font-medium mt-0.5">Specify the budget and funding source for the program.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <Input theme="blue" label="Budget" placeholder="₱ 0.00" inputMode="decimal" value={displayBudget} onFocus={() => setIsBudgetFocused(true)} onBlur={() => setIsBudgetFocused(false)} onChange={(e) => setRawBudget(e.target.value.replace(/[^0-9.]/g, ''))} />
                                        <Select theme="blue" label="Fund Source" placeholder="Select Source" options={["MOOE", "SARO"]} value={fundSource} onChange={(e) => setFundSource(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* -------------------------------------------------------- */}
                            {/* WIZARD ONLY: ACTIVITY CARDS (Step 2) */}
                            {/* -------------------------------------------------------- */}
                            {appMode === 'wizard' && (
                                <div className={`${currentStep === 3 ? 'block' : 'hidden'}`}>
                                    <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Monitoring Evaluation</h2>
                                                <p className="text-sm text-slate-500 font-medium mt-0.5">Record activities, targets, and actual accomplishments.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {activities.map((act, index) => {
                                            const physGap = calculateGap(act.physTarget, act.physAcc);
                                            const finGap = calculateGap(act.finTarget, act.finAcc);
                                            const isExpanded = expandedActivityId === act.id;

                                            if (!isExpanded) {
                                                // COMPACT CARD VIEW
                                                return (
                                                    <div
                                                        key={act.id}
                                                        onClick={() => setExpandedActivityId(act.id)}
                                                        className="relative group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-colors cursor-pointer flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-4 overflow-hidden pr-4">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                                <span className="font-bold text-sm">{index + 1}</span>
                                                            </div>
                                                            <div className="flex flex-col truncate">
                                                                <span className="text-sm font-bold text-slate-800 truncate">
                                                                    {act.name || <span className="text-slate-400 italic font-normal">Untitled Activity...</span>}
                                                                </span>
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">
                                                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                                        Physical Gap: <span className={physGap < 0 ? 'text-red-500' : 'text-emerald-500'}>{physGap.toFixed(2)}%</span>
                                                                    </span>
                                                                    <span className="text-slate-300 hidden sm:block">|</span>
                                                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                                        Financial Gap: <span className={finGap < 0 ? 'text-red-500' : 'text-emerald-500'}>{finGap.toFixed(2)}%</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {activities.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveActivity(act.id); }}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                </button>
                                                            )}
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // EXPANDED CARD VIEW
                                            return (
                                                <div key={act.id} className="relative group bg-white border-2 border-blue-200 rounded-3xl shadow-md overflow-hidden ring-4 ring-blue-50">
                                                    <div
                                                        onClick={() => setExpandedActivityId(null)}
                                                        className="flex items-center justify-between p-5 md:px-8 bg-slate-50/80 hover:bg-blue-50/50 transition-colors border-b border-slate-100 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                                                                <span className="font-bold text-xs">{index + 1}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Editing Activity</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {activities.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveActivity(act.id); }}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                    title="Remove Activity"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                                </button>
                                                            )}
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 bg-blue-100 transition-colors">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 md:p-8 flex flex-col gap-6">
                                                        <div>
                                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Activity Name / Description</label>
                                                            <TextareaAuto
                                                                placeholder="Describe the activity here..."
                                                                className="w-full text-lg font-semibold text-slate-800 placeholder:text-slate-300 border-b border-transparent focus:border-blue-500 transition-colors py-1"
                                                                value={act.name}
                                                                onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                            <div className="flex flex-col gap-4">
                                                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                                    Physical Targets
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm focus-within:border-blue-300 transition-colors group/input">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-focus-within/input:text-blue-600">Target</label>
                                                                        <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800" placeholder="0" value={act.physTarget} onChange={(e) => handleActivityChange(act.id, 'physTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                    </div>
                                                                    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm focus-within:border-blue-300 transition-colors group/input">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-focus-within/input:text-blue-600">Accomplished</label>
                                                                        <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800" placeholder="0" value={act.physAcc} onChange={(e) => handleActivityChange(act.id, 'physAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                    </div>
                                                                </div>
                                                                <div className={`flex justify-between items-center px-4 py-2.5 rounded-xl border ${physGap < 0 ? 'bg-red-50 border-red-100' : 'bg-slate-100 border-slate-200'}`}>
                                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Physical Gap</span>
                                                                    <span className={`font-mono text-sm font-bold ${physGap < 0 ? 'text-red-600' : 'text-slate-600'}`}>{physGap.toFixed(2)}%</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-4 relative">
                                                                <div className="hidden md:block absolute -left-3 top-2 bottom-2 w-px bg-slate-200"></div>
                                                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                    Financial Targets
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm focus-within:border-emerald-300 transition-colors group/input">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-focus-within/input:text-emerald-600">Target</label>
                                                                        <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800" placeholder="0" value={act.finTarget} onChange={(e) => handleActivityChange(act.id, 'finTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                    </div>
                                                                    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm focus-within:border-emerald-300 transition-colors group/input">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-focus-within/input:text-emerald-600">Accomplished</label>
                                                                        <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800" placeholder="0" value={act.finAcc} onChange={(e) => handleActivityChange(act.id, 'finAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                    </div>
                                                                </div>
                                                                <div className={`flex justify-between items-center px-4 py-2.5 rounded-xl border ${finGap < 0 ? 'bg-red-50 border-red-100' : 'bg-slate-100 border-slate-200'}`}>
                                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Financial Gap</span>
                                                                    <span className={`font-mono text-sm font-bold ${finGap < 0 ? 'text-red-600' : 'text-slate-600'}`}>{finGap.toFixed(2)}%</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-colors">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                                                Actions to Address Gap
                                                            </label>
                                                            <TextareaAuto
                                                                placeholder="What steps will be taken?"
                                                                className="w-full text-sm font-medium text-slate-700 min-h-[40px]"
                                                                value={act.actions}
                                                                onChange={(e) => handleActivityChange(act.id, 'actions', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={handleAddActivity}
                                            className={`group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-8 font-bold shadow-sm border-2 active:scale-95 transition-colors gap-2 ${isAddingActivity
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    : 'bg-white text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-50'
                                                }`}
                                        >
                                            {isAddingActivity ? (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    Activity Added!
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                    Add Another Activity
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* -------------------------------------------------------- */}
                            {/* FULL MODE ONLY: INTERACTIVE ACTIVITIES TABLE */}
                            {/* -------------------------------------------------------- */}
                            {appMode === 'full' && (
                                <div className="mb-16">
                                    <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Monitoring Evaluation & Adjustment</h2>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-visible overflow-x-auto pb-4">
                                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                            <table className="w-full min-w-[800px] border-collapse text-sm">
                                                <thead>
                                                    <tr className="text-center select-none bg-slate-50 border-b border-slate-200">
                                                        <th rowSpan="2" className="border-r border-slate-200 p-4 w-1/4 text-xs font-bold text-slate-600 uppercase tracking-wider">Activity Name</th>
                                                        <th colSpan="2" className="border-r border-slate-200 p-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Target</th>
                                                        <th colSpan="2" className="border-r border-slate-200 p-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Accomplishment</th>
                                                        <th colSpan="2" className="border-r border-slate-200 p-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Gap (%)</th>
                                                        <th rowSpan="2" className="p-4 w-1/5 text-xs font-bold text-slate-600 uppercase tracking-wider">Actions to Address Gap</th>
                                                        <th rowSpan="2" className="border-none w-14"></th>
                                                    </tr>
                                                    <tr className="text-center select-none bg-white border-b border-slate-200">
                                                        <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Physical</th>
                                                        <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Financial</th>
                                                        <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Physical</th>
                                                        <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Financial</th>
                                                        <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Physical</th>
                                                        <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Financial</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white">
                                                    {activities.map((act, index) => {
                                                        const physGap = calculateGap(act.physTarget, act.physAcc);
                                                        const finGap = calculateGap(act.finTarget, act.finAcc);
                                                        const isLast = index === activities.length - 1;

                                                        return (
                                                            <tr key={act.id} className={`group hover:bg-slate-50 transition-colors ${!isLast ? 'border-b border-slate-200' : ''}`}>
                                                                <td className="border-r border-slate-200 p-3 align-top">
                                                                    <TextareaAuto placeholder="Describe activity..." className="font-medium text-slate-700 w-full bg-transparent p-1 focus:bg-white border border-transparent focus:border-slate-300 rounded-md" value={act.name} onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-1 align-top">
                                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 h-full min-h-[44px] bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded-md" value={act.physTarget} onChange={(e) => handleActivityChange(act.id, 'physTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-1 align-top">
                                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 h-full min-h-[44px] bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded-md" value={act.finTarget} onChange={(e) => handleActivityChange(act.id, 'finTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-1 align-top">
                                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 h-full min-h-[44px] bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded-md" value={act.physAcc} onChange={(e) => handleActivityChange(act.id, 'physAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-1 align-top">
                                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 h-full min-h-[44px] bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded-md" value={act.finAcc} onChange={(e) => handleActivityChange(act.id, 'finAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-1 align-top bg-slate-50/50">
                                                                    <input type="text" readOnly tabIndex={-1} className="w-full text-center font-bold outline-none font-mono text-sm select-none pointer-events-none bg-transparent h-full min-h-[44px]" style={{ color: physGap < 0 ? '#ef4444' : '#64748b' }} value={`${physGap.toFixed(2)}%`} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-1 align-top bg-slate-50/50">
                                                                    <input type="text" readOnly tabIndex={-1} className="w-full text-center font-bold outline-none font-mono text-sm select-none pointer-events-none bg-transparent h-full min-h-[44px]" style={{ color: finGap < 0 ? '#ef4444' : '#64748b' }} value={`${finGap.toFixed(2)}%`} />
                                                                </td>
                                                                <td className="p-3 align-top">
                                                                    <TextareaAuto placeholder="Resolutions..." className="font-medium text-slate-700 w-full bg-transparent p-1 focus:bg-white border border-transparent focus:border-slate-300 rounded-md" value={act.actions} onChange={(e) => handleActivityChange(act.id, 'actions', e.target.value)} />
                                                                </td>
                                                                <td className="border-none p-0 w-0 relative bg-white">
                                                                    {activities.length > 1 && (
                                                                        <button type="button" onClick={() => handleRemoveActivity(act.id)} className="absolute -right-14 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm hover:border-red-200 hover:text-red-500 hover:bg-red-50 focus:outline-none transition-colors z-10 opacity-0 group-hover:opacity-100" title="Delete Row">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-start">
                                        <button type="button" onClick={handleAddActivity} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            Add Activity Row
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* -------------------------------------------------------- */}
                            {/* WIZARD ONLY: FACTORS (Steps 3 and 4) */}
                            {/* -------------------------------------------------------- */}
                            {appMode === 'wizard' && currentStep === 4 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m17 5-5-3-5 3" /><path d="m17 19-5 3-5-3" /><path d="M2 12h20" /><path d="m5 7-3 5 3 5" /><path d="m19 7 3 5-3 5" /></svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Implementation Factors</h2>
                                                <p className="text-sm text-slate-500 font-medium mt-0.5">
                                                    Identify Institutional, Technical, Infrastructure, Learning Resources, Environmental, and other factors.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {FACTOR_TYPES.map((type) => (
                                            <div key={type} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
                                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                    <span className="w-8 h-px bg-blue-200"></span>
                                                    {type} Factors
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-1">Facilitating</label>
                                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                                            <TextareaAuto
                                                                className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none min-h-[80px]"
                                                                placeholder={`What helped in ${type.toLowerCase()} aspect?`}
                                                                value={factors[type].facilitating}
                                                                onChange={(e) => handleFactorChange(type, 'facilitating', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-rose-600 uppercase tracking-widest px-1">Hindering</label>
                                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500 transition-all">
                                                            <TextareaAuto
                                                                className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none min-h-[80px]"
                                                                placeholder={`What were the challenges in ${type.toLowerCase()}?`}
                                                                value={factors[type].hindering}
                                                                onChange={(e) => handleFactorChange(type, 'hindering', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* -------------------------------------------------------- */}
                            {/* FULL MODE ONLY: INTERACTIVE FACTORS GRID */}
                            {/* -------------------------------------------------------- */}
                            {appMode === 'full' && (
                                <div className="mb-16">
                                    <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" /><path d="m14 7 3 3" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Facilitating & Hindering Factors</h2>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto pb-2">
                                        <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden min-w-[600px]">
                                            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 font-bold text-center text-sm uppercase tracking-wider">
                                                <div className="p-3 border-r border-slate-200 text-emerald-700">Facilitating Factors</div>
                                                <div className="p-3 text-rose-700">Hindering Factors</div>
                                            </div>

                                            {FACTOR_TYPES.map((type, idx) => (
                                                <div key={type} className={`grid grid-cols-2 bg-white ${idx !== FACTOR_TYPES.length - 1 ? 'border-b border-slate-200' : ''}`}>
                                                    <div className="p-4 border-r border-slate-200 relative group hover:bg-slate-50/50 transition-colors">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute top-3 left-4">{type}</span>
                                                        <TextareaAuto
                                                            className="mt-5 w-full text-sm font-medium text-slate-700 bg-transparent p-1 focus:bg-white border border-transparent focus:border-slate-300 rounded min-h-[40px]"
                                                            value={factors[type].facilitating}
                                                            onChange={(e) => handleFactorChange(type, 'facilitating', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="p-4 relative group hover:bg-slate-50/50 transition-colors">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute top-3 left-4">{type}</span>
                                                        <TextareaAuto
                                                            className="mt-5 w-full text-sm font-medium text-slate-700 bg-transparent p-1 focus:bg-white border border-transparent focus:border-slate-300 rounded min-h-[40px]"
                                                            value={factors[type].hindering}
                                                            onChange={(e) => handleFactorChange(type, 'hindering', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 4: SIGNATURES (Shared) */}
                            {/* -------------------------------------------------------- */}
                            <div className={`${(appMode === 'full' || currentStep === 5) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Signatures</h2>
                                            {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Finalize with necessary approvals.</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-2 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                                        <div className="flex flex-col">
                                            <p className="text-xs text-left mb-8 select-none text-slate-500 font-bold uppercase tracking-widest">Prepared by</p>
                                            <input type="text" className="w-full border-b-2 border-slate-200 focus:border-blue-500 transition-colors text-center font-black uppercase text-lg outline-none bg-transparent pb-2 text-slate-800 placeholder:text-slate-300" placeholder="NAME OF PROGRAM OWNER" value={owner} onChange={(e) => setOwner(e.target.value)} />
                                            <p className="text-xs mt-3 select-none text-slate-500 text-center font-semibold uppercase tracking-widest">Program Owner</p>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs text-left mb-8 select-none text-slate-500 font-bold uppercase tracking-widest">Noted</p>
                                            <input type="text" className="w-full border-b-2 border-slate-200 text-center font-black uppercase text-lg pointer-events-none select-none bg-transparent pb-2 text-slate-800" value="DR. ENRIQUE Q. RETES, EdD" readOnly tabIndex={-1} />
                                            <p className="text-xs mt-3 select-none text-slate-500 text-center font-semibold uppercase tracking-widest">Chief Education Supervisor</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* -------------------------------------------------------- */}
                            {/* SECTION 6: FINAL REVIEW & SUBMIT */}
                            {/* -------------------------------------------------------- */}
                            {(appMode === 'full' || currentStep === 6) && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
                                    {appMode === 'wizard' && (
                                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-slate-100 shadow-sm mb-12 flex flex-col items-center justify-center text-center group relative overflow-hidden transition-all hover:border-blue-200">
                                            <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 mb-2">Final Review</h3>
                                            <p className="text-sm text-slate-500 font-medium mb-8 max-w-sm">Please review the generated document preview below before final submission.</p>

                                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsPreviewOpen(true)}
                                                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    Preview Document
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleConfirmSubmit}
                                                    disabled={isSubmitted}
                                                    className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                                    {isSubmitted ? "Submitted" : "Confirm & Submit"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons for Wizard Mode */}
                        {appMode === 'wizard' && (
                            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    className={`group relative inline-flex h-12 items-center justify-center rounded-xl px-6 font-medium transition-colors gap-2 ${currentStep === 1
                                            ? 'text-slate-300 cursor-not-allowed'
                                            : 'text-slate-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95'
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
                            <div className="mt-12 bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg relative z-10">
                                <h3 className="text-slate-800 font-bold text-xl mb-6">Ready to finalize your review?</h3>

                                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => setIsPreviewOpen(true)}
                                        className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white border-2 border-slate-200 px-8 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95 w-full sm:w-auto shadow-sm"
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
    );
}

