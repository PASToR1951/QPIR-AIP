import React, { useState, useEffect } from 'react';
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
    const [year, setYear] = useState(String(new Date().getFullYear()));

    // UI State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [programList, setProgramList] = useState([]);
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
        onConfirm: () => { }
    });

    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    // Form State: Profile & Goals
    const [outcome, setOutcome] = useState("");
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
        { id: crypto.randomUUID(), phase: "Planning", name: "", period: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Implementation", name: "", period: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Monitoring and Evaluation", name: "", period: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }
    ]);

    // Draft State Tracking for ViewModeSelector
    const [hasDraft, setHasDraft] = useState(false);
    const [draftInfo, setDraftInfo] = useState(null);

    // Fetch programs and completed (submitted) programs in parallel
    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const [programsRes, completedRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs`, { headers: authHeaders }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/programs/with-aips`, { headers: authHeaders }),
                ]);
                setProgramList(programsRes.data.map(p => p.title).sort());
                setCompletedPrograms(completedRes.data.map(p => p.title));
            } catch (error) {
                console.error("Failed to fetch programs:", error);
            }
        };
        fetchPrograms();
    }, []);

    const [loadedDraftData, setLoadedDraftData] = useState(null);

    // API - Check for Draft on mount
    useEffect(() => {
        const fetchDraft = async () => {
            if (user?.id) {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/drafts/AIP/${user.id}`);
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

    // Called when the user picks program + mode in the splash
    const handleStart = (mode, selectedProgram) => {
        setDepedProgram(selectedProgram);
        if (hasDraft && loadedDraftData) {
            try {
                const draft = loadedDraftData;
                setOutcome(draft.outcome || "");
                setYear(draft.year || String(new Date().getFullYear()));
                // Don't restore program from draft — user already selected it
                setSipTitle(draft.sipTitle || "");
                setProjectCoord(draft.projectCoord || "");
                setObjectives(draft.objectives || [""]);
                setIndicators(draft.indicators || [{ description: "", target: "" }]);
                setPreparedByName(draft.preparedByName || "");
                setPreparedByTitle(draft.preparedByTitle || "");
                setApprovedByName(draft.approvedByName || "");
                setApprovedByTitle(draft.approvedByTitle || "");
                if (draft.activities) setActivities(draft.activities);
            } catch (e) {
                console.error("Failed to load draft:", e);
            }
        }
        setAppMode(mode);
    };

    // Objective handlers
    const handleObjectiveChange = (index, value) => {
        setObjectives(prev => prev.map((obj, i) => i === index ? value : obj));
    };
    const addObjective = () => setObjectives(prev => [...prev, ""]);
    const removeObjective = (index) => setObjectives(prev => prev.filter((_, i) => i !== index));

    // Indicator handlers
    const handleIndicatorChange = (index, field, value) => {
        setIndicators(prev => prev.map((ind, i) => i === index ? { ...ind, [field]: value } : ind));
    };
    const addIndicator = () => setIndicators(prev => [...prev, { description: "", target: "" }]);
    const removeIndicator = (index) => setIndicators(prev => prev.filter((_, i) => i !== index));

    const hasInputtedData = () => {
        return outcome || depedProgram || sipTitle || projectCoord ||
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
        setIsSaving(true);
        const draft = {
            outcome,
            year,
            depedProgram,
            sipTitle,
            projectCoord,
            objectives,
            indicators,
            preparedByName,
            preparedByTitle,
            approvedByName,
            approvedByTitle,
            activities,
            lastSaved: new Date().toISOString()
        };

        try {
            if (user?.id) {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/drafts`, {
                    user_id: user.id,
                    form_type: 'AIP',
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

    const [expandedActivityId, setExpandedActivityId] = useState(activities[0].id);

    // Resize Listener
    useEffect(() => {
        const checkMobile = () => {
            const mobileStatus = window.innerWidth < 768;
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
    const handleAddActivity = () => {
        // Defaults to the last phase created
        const lastPhase = activities.length > 0 ? activities[activities.length - 1].phase : "Planning";
        handleAddActivityPhase(lastPhase);
    };

    const handleAddActivityPhase = (targetPhase) => {
        const newId = crypto.randomUUID();
        setActivities([...activities, { id: newId, phase: targetPhase, name: "", period: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }]);
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
        } else {
            executeDelete(id);
        }
    };
    const handleActivityChange = (id, field, value) => {
        setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a));
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
              `${import.meta.env.VITE_API_URL}/api/aips`,
              {
                program_title: depedProgram,
                year: parseInt(year),
                outcome,
                sip_title: sipTitle,
                project_coordinator: projectCoord,
                objectives,
                indicators,
                prepared_by_name: preparedByName,
                prepared_by_title: preparedByTitle,
                approved_by_name: approvedByName,
                approved_by_title: approvedByTitle,
                activities
              },
              { headers: authHeaders }
            );

            setIsSubmitted(true);
            if (user?.id) {
                try {
                    await axios.delete(`${import.meta.env.VITE_API_URL}/api/drafts/AIP/${user.id}`);
                } catch (e) {
                    console.error("Failed to delete draft:", e);
                }
            }
            setModal({
                isOpen: true,
                type: 'success',
                title: 'Success!',
                message: 'The Annual Implementation Plan has been saved to the database.',
                confirmText: 'Back to Dashboard',
                onConfirm: () => navigate('/')
            });
        } catch (error) {
            console.error("Failed to submit AIP:", error);
            setModal({
                isOpen: true,
                type: 'warning',
                title: 'Submission Failed',
                message: error.response?.data?.error || 'An error occurred while saving the AIP. Please try again.',
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
                        title="Annual Implementation Plan"
                        onBack={handleBack}
                        theme="pink"
                    />
                    <ViewModeSelector
                        programs={programList}
                        onStart={handleStart}
                        hasDraft={hasDraft}
                        draftInfo={draftInfo}
                        draftProgram={loadedDraftData?.depedProgram || null}
                        completedPrograms={completedPrograms}
                        theme="pink"
                    />
                </motion.div>
            ) : (
                <motion.div key="form" {...motionProps}>
                    <div className="bg-slate-50 min-h-screen flex flex-col text-slate-800 font-sans relative print:py-0 print:bg-white print:text-black">
            <FormHeader
                title="Annual Implementation Plan"
                onSave={handleSaveForLater}
                onBack={handleBack}
                onHome={handleHome}
                isSaving={isSaving}
                isSaved={isSaved}
                lastSavedTime={lastSavedTime}
                theme="pink"
                appMode={appMode}
                toggleAppMode={() => setAppMode(appMode === 'wizard' ? 'full' : 'wizard')}
            />

            <DocumentPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="AIP Document Preview"
                subtitle={`Annual Implementation Plan Cycle ${year}`}
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
                            title="Annual Implementation Plan"
                            badge={`CY ${year}`}
                            compact={true}
                        />
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-12 shadow-xl relative">

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
                                    setOutcome={setOutcome}
                                    year={year}
                                    setYear={setYear}
                                    depedProgram={depedProgram}
                                    sipTitle={sipTitle}
                                    setSipTitle={setSipTitle}
                                    projectCoord={projectCoord}
                                    setProjectCoord={setProjectCoord}
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

                                    <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-2 relative overflow-hidden">
                                        <svg className="absolute inset-0 h-full w-full opacity-30 stroke-slate-200 mask-image:linear-gradient(to_bottom,transparent,black)" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines)"></rect></svg>

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
                            <div className="mt-12 flex justify-between items-center pt-6 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Back
                                </button>

                                {currentStep < totalSteps && (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors active:scale-95 shadow-md"
                                    >
                                        Continue
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </button>
                                )}
                            </div>
                        )}
                        {/* FINAL ACTION BUTTONS (Below Full Form Only) */}
                        {appMode === 'full' && (
                            <div className="print:hidden mt-12 bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg relative z-10">
                                <h3 className="text-slate-800 font-bold text-xl mb-6">Ready to finalize your plan?</h3>

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
    );
}
