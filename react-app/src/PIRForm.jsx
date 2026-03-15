import React, { useState, useEffect } from 'react';
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
import { useAccessibility } from './context/AccessibilityContext';
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
    const motionProps = settings.reduceMotion
        ? { initial: false, animate: false, exit: false, transition: { duration: 0 } }
        : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.15, ease: 'easeOut' } };
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const isDivisionPersonnel = user?.role === 'Division Personnel';

    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [isMobile, setIsMobile] = useState(false);
    const [programList, setProgramList] = useState([]);
    const [programsWithAIPs, setProgramsWithAIPs] = useState([]);
    // schoolList/schoolMap only used for Division Personnel (manual school input if ever needed; currently unused)
    const [schoolMap, setSchoolMap] = useState({}); // name -> id lookup (School Users only)

    const [quarterString] = useState(() => {
        const date = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();
        if (month <= 2) return `1st Quarter CY ${year}`;
        if (month <= 5) return `2nd Quarter CY ${year}`;
        if (month <= 8) return `3rd Quarter CY ${year}`;
        return `4th Quarter CY ${year}`;
    });

    // Fetch programs and programs-with-AIPs in parallel
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [programsRes, withAIPsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs`, { headers: authHeaders }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs/with-aips`, { headers: authHeaders })
                ]);
                setProgramList(programsRes.data.map(p => p.title).sort());
                setProgramsWithAIPs(withAIPsRes.data.map(p => p.title));

                // School Users: pre-build schoolMap so activity fetch works
                if (!isDivisionPersonnel && user?.school_id) {
                    const schoolsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/schools`);
                    setSchoolMap(Object.fromEntries(schoolsRes.data.map(s => [s.name, s.id])));
                }
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
    // School Users: school is always their own school (pre-filled, not selectable)
    // Division Personnel: no school association
    const [school, setSchool] = useState(user?.school_name || "");
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

    // Auto-fetch AIP activities when program is selected (and school is available for School Users)
    useEffect(() => {
        if (!program) return;

        // School Users need their school ID; Division Personnel use their user ID
        const schoolId = isDivisionPersonnel ? null : (user?.school_id || schoolMap[school] || null);
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
                    setActivities(aipActivities.map(a => ({
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
                }
            } catch {
                // No AIP found - keep manual entry mode
            } finally {
                setIsLoadingActivities(false);
            }
        };

        fetchAIPActivities();
    }, [program, school, schoolMap, quarterString]);

    // Called when the user picks program + mode in the splash
    const handleStart = (mode, selectedProgram) => {
        setProgram(selectedProgram);
        if (hasDraft && loadedDraftData) {
            try {
                const draft = loadedDraftData;
                // Don't restore program from draft — user already selected it
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

    const fillDevData = () => {
        setProgram(programList[0] || "Alternative Learning System (ALS)");
        if (isDivisionPersonnel) setSchool(""); // Division Personnel have no school
        setOwner("Jane Doe");
        setFundSource("MOOE");
        setRawBudget("250000");
        setActivities([
            { id: crypto.randomUUID(), name: "Conduct Q1 Training", implementation_period: "January to March", aip_activity_id: null, fromAIP: false, physTarget: "50", finTarget: "125000", physAcc: "45", finAcc: "120000", actions: "Reschedule remaining participants to Q2" },
            { id: crypto.randomUUID(), name: "Procure Learning Materials", implementation_period: "April", aip_activity_id: null, fromAIP: false, physTarget: "500", finTarget: "125000", physAcc: "500", finAcc: "125000", actions: "Completed successfully" }
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
        setActivities([...activities, { id: newId, name: "", implementation_period: "", aip_activity_id: null, fromAIP: false, physTarget: "", finTarget: "", physAcc: "", finAcc: "", actions: "" }]);
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
                <motion.div key="splash" {...motionProps}>
                    <FormHeader
                        title="Quarterly Performance Review"
                        onBack={handleBack}
                        theme="blue"
                    />
                    <ViewModeSelector
                        programs={programsWithAIPs}
                        onStart={handleStart}
                        hasDraft={hasDraft}
                        draftInfo={draftInfo}
                        draftProgram={loadedDraftData?.program || null}
                        theme="blue"
                    />
                </motion.div>
            ) : (
                <motion.div key="form" {...motionProps}>
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
                        <WizardStepper 
                            steps={[
                                { num: 1, label: "Profile" },
                                { num: 2, label: "Financials" },
                                { num: 3, label: "M&E Progress" },
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
                                isBudgetFocused={isBudgetFocused}
                                setIsBudgetFocused={setIsBudgetFocused}
                                displayBudget={displayBudget}
                                rawBudget={rawBudget}
                                setRawBudget={setRawBudget}
                                fundSource={fundSource}
                                setFundSource={setFundSource}
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
                                fundSource={fundSource}
                                setFundSource={setFundSource}
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

                                <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-2 relative">
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

