import React, { useState, useEffect } from 'react';

const PROGRAM_LIST = [
    "CFSS", "DORP", "Early Registration/Oplan Balik Eskwela", "ALS (For school-based ALS)", "IPED",
    "Kindergarten Education", "Inclusive Education for LDS", "Learning Resource Materials Development and QA for LDS",
    "Adopt-a-School for LDS", "Alternative Delivery Modality for LDS", "Curriculum/Learning Area Programs",
    "Curricular Support Programs", "Reading Remediation", "Instructional Supervisory Program",
    "Continuing Professional Development for Teachers", "Learning Action Cells", "Learning Outcomes Assessment Program",
    "Learning Intervention Program", "Learning Materials Development and Quality Assurance Program",
    "Basic Education Research Program", "Learning Resource Centers Program", "Programs for SHS: Immersion",
    "National Certification", "SHS Tracking", "Child Protection Program", "Youth Development Program/SSG/SPG",
    "DRRM", "OK sa DepED", "Enhanced School Sports", "Guidance and Counseling Program"
].sort();

// The official AIP Phases derived from the template
const PHASES = ["Planning", "Implementation", "Monitoring and Evaluation"];

import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { TextareaAuto } from './components/ui/TextareaAuto';
import { FormHeader } from './components/ui/FormHeader';
import { FormBoxHeader } from './components/ui/FormBoxHeader';
import { ViewModeSelector } from './components/ui/ViewModeSelector';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { DocumentPreviewModal } from './components/ui/DocumentPreviewModal';
import { AIPDocument } from './components/docs/AIPDocument';

export default function App() {
    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [isMobile, setIsMobile] = useState(false);
    const currentYear = new Date().getFullYear();

    // UI State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Save Status State
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Modal State
    const [modal, setModal] = useState({ 
        isOpen: false, 
        type: 'warning', 
        title: '', 
        message: '', 
        confirmText: 'Confirm', 
        onConfirm: () => {} 
    });

    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    // Form State: Profile & Goals
    const [pillar, setPillar] = useState("");
    const [depedProgram, setDepedProgram] = useState("");
    const [sipTitle, setSipTitle] = useState("");
    const [projectCoord, setProjectCoord] = useState("");

    const [objectives, setObjectives] = useState("");
    const [indicators, setIndicators] = useState("");
    const [annualTarget, setAnnualTarget] = useState("");

    // Form State: Activities
    const [activities, setActivities] = useState([
        { id: crypto.randomUUID(), phase: "Planning", name: "", period: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Implementation", name: "", period: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" },
        { id: crypto.randomUUID(), phase: "Monitoring and Evaluation", name: "", period: "", persons: "", outputs: "", budgetAmount: "", budgetSource: "" }
    ]);

    // Draft State Tracking for ViewModeSelector
    const [hasDraft, setHasDraft] = useState(false);
    const [draftInfo, setDraftInfo] = useState(null);

    // Local Storage - Check for Draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('aip_draft');
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

    // Load Draft Data when a mode is chosen (if draft exists)
    const handleSelectMode = (mode) => {
        if (hasDraft) {
            const savedDraft = localStorage.getItem('aip_draft');
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    setPillar(draft.pillar || "");
                    setDepedProgram(draft.depedProgram || "");
                    setSipTitle(draft.sipTitle || "");
                    setProjectCoord(draft.projectCoord || "");
                    setObjectives(draft.objectives || "");
                    setIndicators(draft.indicators || "");
                    setAnnualTarget(draft.annualTarget || "");
                    if (draft.activities) setActivities(draft.activities);
                } catch (e) {
                    console.error("Failed to load draft:", e);
                }
            }
        }
        setAppMode(mode);
    };

    const handleBack = () => {
        if (appMode === 'splash') {
            setModal({
                isOpen: true,
                type: 'warning',
                title: 'Exit to Dashboard?',
                message: 'Any unsaved changes will be lost. Are you sure you want to leave?',
                confirmText: 'Yes, Exit',
                onConfirm: () => window.location.href = '/'
            });
        } else {
            setAppMode('splash');
        }
    };

    const handleHome = () => {
        setModal({
            isOpen: true,
            type: 'warning',
            title: 'Return to Home?',
            message: 'Any unsaved changes will be lost. Are you sure you want to return to the dashboard?',
            confirmText: 'Yes, Home',
            onConfirm: () => window.location.href = '/'
        });
    };

    const handleSaveForLater = () => {
        setIsSaving(true);
        const draft = {
            pillar,
            depedProgram,
            sipTitle,
            projectCoord,
            objectives,
            indicators,
            annualTarget,
            activities,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('aip_draft', JSON.stringify(draft));
        
        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            setModal({
                isOpen: true,
                type: 'success',
                title: 'Draft Saved',
                message: 'Your progress has been saved locally. You can resume later.',
                confirmText: 'Got it',
                onConfirm: () => {}
            });
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

    const handleConfirmSubmit = () => {
        setIsSubmitted(true);
        setTimeout(() => {
            setModal({
                isOpen: true,
                type: 'success',
                title: 'Success!',
                message: 'The Annual Implementation Plan has been saved to the database.',
                confirmText: 'Back to Dashboard',
                onConfirm: () => window.location.href = '/'
            });
        }, 300);
    };

    // ==========================================
    // RENDER SPLASH SCREEN (View Mode Selector)
    // ==========================================
    if (appMode === 'splash') {
        return (
            <>
                <FormHeader 
                    title="Annual Implementation Plan" 
                    onBack={handleBack}
                    theme="pink" 
                />
                <ViewModeSelector
                    onSelectMode={handleSelectMode}
                    hasDraft={hasDraft}
                    draftInfo={draftInfo}
                    theme="pink"
                />
            </>
        );
    }

    // ==========================================
    // RENDER MAIN APPLICATION
    // ==========================================
    return (
        <div className="bg-slate-50 min-h-screen flex flex-col text-slate-800 font-sans relative print:py-0 print:bg-white print:text-black">
            <FormHeader 
                title="Annual Implementation Plan" 
                onSave={handleSaveForLater} 
                onBack={handleBack}
                onHome={handleHome}
                isSaving={isSaving}
                isSaved={isSaved}
                theme="pink" 
            />

            <DocumentPreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)}
                title="AIP Document Preview"
                subtitle="Annual Implementation Plan Cycle 2026"
            >
                <AIPDocument 
                    pillar={pillar}
                    depedProgram={depedProgram}
                    sipTitle={sipTitle}
                    projectCoord={projectCoord}
                    objectives={objectives}
                    indicators={indicators}
                    annualTarget={annualTarget}
                    activities={activities}
                />
            </DocumentPreviewModal>

            {/* Aceternity Grid Background */}
            <div className="absolute inset-0 bg-white bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none z-0 print:hidden"></div>

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
                            badge={`CY ${currentYear}`}
                            compact={true}
                        />
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-12 shadow-xl relative">

                    {/* View Mode Toggle (Desktop Only) */}
                    {!isMobile && (
                        <div className="absolute top-6 right-8 z-20">
                            <button 
                                onClick={() => setAppMode(appMode === 'wizard' ? 'full' : 'wizard')}
                                className="text-xs font-semibold text-slate-500 hover:text-pink-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                {appMode === 'wizard' ? (
                                    <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg> Switch to Full View</>
                                ) : (
                                    <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg> Switch to Wizard</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* FULL VIEW HEADER */}
                    {appMode === 'full' && (
                        <FormBoxHeader
                            title="Annual Implementation Plan"
                            badge={`CY ${currentYear}`}
                        />
                    )}
                {/* ============================================================== */}
                {/* WIZARD MODE: STEPPER */}
                {/* ============================================================== */}
                {appMode === 'wizard' && (
                    <div className="mb-12 pt-6">
                        <div className="flex justify-between items-center max-w-2xl mx-auto px-4 relative">
                            <div className="absolute left-[10%] right-[10%] top-[14px] h-[2px] bg-slate-200 -z-0 hidden md:block rounded-full overflow-hidden">
                                <div className="h-full bg-pink-500 transition-all duration-300 ease-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
                            </div>
                            {[
                                { num: 1, label: "Alignment" },
                                { num: 2, label: "Targets" },
                                { num: 3, label: "Action Plan" },
                                { num: 4, label: "M&E" },
                                { num: 5, label: "Signatures" },
                                { num: 6, label: "Finalize" }
                            ].map((step) => (
                                <div key={step.num} className="flex flex-col items-center gap-2 relative z-10 w-1/6">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors ${
                                        currentStep === step.num ? 'bg-pink-600 text-white shadow-md ring-4 ring-pink-100' :
                                        currentStep > step.num ? 'bg-pink-600 text-white ring-2 ring-white' : 'bg-white text-slate-400 border-2 border-slate-200'
                                    }`}>
                                        {currentStep > step.num ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        ) : step.num}
                                    </div>
                                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${currentStep === step.num ? 'text-pink-700' : 'text-slate-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()}>

                    <div className="min-h-[300px]">

                        {/* -------------------------------------------------------- */}
                        {/* SECTION 1: PROFILE / ALIGNMENT */}
                        {/* -------------------------------------------------------- */}
                        <div className={`${(appMode === 'full' || currentStep === 1) ? 'block' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                            <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                <div className="p-2.5 bg-pink-50 text-pink-600 border border-pink-100 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Strategic Alignment</h2>
                                    {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Define the core strategic direction of the project.</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input theme="pink" label="Pillar / Strategic Direction" placeholder="Enter Strategic Direction..." value={pillar} onChange={(e) => setPillar(e.target.value)} />
                                <Select theme="pink" label="DepEd Program Aligned" placeholder="Select Program Alignment" options={PROGRAM_LIST} value={depedProgram} onChange={(e) => setDepedProgram(e.target.value)} />
                                <Input theme="pink" label="School Improvement Project / Title" placeholder="Enter SIP Title..." value={sipTitle} onChange={(e) => setSipTitle(e.target.value)} />
                                <Input theme="pink" label="Project Coordinator" placeholder="Name of Coordinator..." value={projectCoord} onChange={(e) => setProjectCoord(e.target.value)} />
                            </div>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* SECTION 2: GOALS AND TARGETS */}
                        {/* -------------------------------------------------------- */}
                        <div className={`${(appMode === 'full' || currentStep === 2) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                            <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                <div className="p-2.5 bg-pink-50 text-pink-600 border border-pink-100 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Goals & Targets</h2>
                                    {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Establish the objectives and specific performance indicators.</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                                <div className="flex flex-col gap-1.5 w-full group">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-pink-600 transition-colors">Objective/s</label>
                                    <TextareaAuto className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 shadow-sm min-h-[80px]" placeholder="List primary objectives..." value={objectives} onChange={(e) => setObjectives(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5 w-full group">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-pink-600 transition-colors">Performance Indicator/s (OVI)</label>
                                        <TextareaAuto className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 shadow-sm min-h-[60px]" placeholder="Measurable indicators..." value={indicators} onChange={(e) => setIndicators(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5 w-full group">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-pink-600 transition-colors">Annual Target</label>
                                        <TextareaAuto className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 shadow-sm min-h-[60px]" placeholder="State your annual target..." value={annualTarget} onChange={(e) => setAnnualTarget(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* SECTION 3: ACTION PLAN & BUDGET */}
                        {/* -------------------------------------------------------- */}
                        <div className={`${(appMode === 'full' || currentStep === 3 || currentStep === 4) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-pink-50 text-pink-600 border border-pink-100 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                            {appMode === 'wizard' && currentStep === 3 ? "Action Plan (Phase 1 & 2)" : "Monitoring & Evaluation (Phase 3)"}
                                        </h2>
                                        {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">
                                            {currentStep === 3 ? "Define Planning and Implementation activities." : "Define Monitoring and Evaluation activities."}
                                        </p>}
                                    </div>
                                </div>
                            </div>

                            {/* WIZARD MODE: Activity Cards View */}
                            {appMode === 'wizard' && (
                                <div className="space-y-4">
                                    {(currentStep === 3 ? PHASES.slice(0, 2) : PHASES.slice(2)).map((phase, pIdx) => {
                                        const phaseActivities = activities.filter(a => a.phase === phase);
                                        const actualIndex = currentStep === 3 ? pIdx + 1 : 3;
                                        return (
                                            <div key={phase} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                                <h3 className="text-sm font-bold text-pink-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs">{actualIndex}</span>
                                                    {phase}
                                                </h3>
                                                {phaseActivities.length === 0 ? (
                                                    <p className="text-sm text-slate-400 italic pl-8">No activities yet. Click "Add Activity" below.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {phaseActivities.map((act, aIdx) => (
                                                            <div key={act.id} className={`bg-white border rounded-xl p-4 transition-all ${expandedActivityId === act.id ? 'border-pink-300 shadow-md ring-2 ring-pink-100' : 'border-slate-200 hover:border-slate-300'}`}>
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-400 text-xs">{actualIndex}.{aIdx + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedActivityId(expandedActivityId === act.id ? null : act.id)}
                                                                            className="text-sm font-semibold text-slate-700 hover:text-pink-600 transition-colors text-left"
                                                                        >
                                                                            {act.name || "Untitled Activity"}
                                                                        </button>
                                                                    </div>
                                                                    {activities.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveActivity(act.id)}
                                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                                            title="Delete Activity"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {expandedActivityId === act.id && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                                                                        <div>
                                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Implementation Period</label>
                                                                            <TextareaAuto placeholder="e.g. Jan-Mar" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" value={act.period} onChange={(e) => handleActivityChange(act.id, 'period', e.target.value)} />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Persons Involved</label>
                                                                            <TextareaAuto placeholder="e.g. Teachers" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" value={act.persons} onChange={(e) => handleActivityChange(act.id, 'persons', e.target.value)} />
                                                                        </div>
                                                                        <div className="md:col-span-2">
                                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Outputs</label>
                                                                            <TextareaAuto placeholder="Expected output" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" value={act.outputs} onChange={(e) => handleActivityChange(act.id, 'outputs', e.target.value)} />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Amount</label>
                                                                            <input type="text" inputMode="decimal" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800 font-mono" placeholder="₱ 0.00" value={act.budgetAmount} onChange={(e) => handleActivityChange(act.id, 'budgetAmount', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Source</label>
                                                                            <input type="text" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" placeholder="Budget source" value={act.budgetSource} onChange={(e) => handleActivityChange(act.id, 'budgetSource', e.target.value)} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddActivityPhase(phase)}
                                                    className="mt-3 text-xs font-bold text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 origin-left"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                    Add Activity to {phase}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* FULL MODE: Table View */}
                            {appMode === 'full' && (
                            <div className="overflow-visible overflow-x-auto pb-4">
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-w-[1000px]">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="text-left select-none bg-slate-50 border-b border-slate-200">
                                                <th rowSpan="2" className="border-r border-slate-200 p-3 w-[30%] text-xs font-bold text-slate-600 uppercase tracking-wider">Activities to be Conducted</th>
                                                <th rowSpan="2" className="border-r border-slate-200 p-3 w-[15%] text-xs font-bold text-slate-600 uppercase tracking-wider">Implementation Period</th>
                                                <th rowSpan="2" className="border-r border-slate-200 p-3 w-[15%] text-xs font-bold text-slate-600 uppercase tracking-wider">Persons Involved</th>
                                                <th rowSpan="2" className="border-r border-slate-200 p-3 w-[15%] text-xs font-bold text-slate-600 uppercase tracking-wider">Outputs</th>
                                                <th colSpan="2" className="border-r border-slate-200 p-3 w-[20%] text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Budgetary Requirement</th>
                                                <th rowSpan="2" className="border-none w-10"></th>
                                            </tr>
                                            <tr className="text-center select-none bg-white border-b border-slate-200">
                                                <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/50">Amount</th>
                                                <th className="border-r border-slate-200 p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/50">Source</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {PHASES.map((phase, pIdx) => {
                                                const phaseActivities = activities.filter(a => a.phase === phase);
                                                return (
                                                    <React.Fragment key={phase}>
                                                        {/* Phase Header Row */}
                                                        <tr className="bg-pink-50/50 border-b border-slate-200">
                                                            <td colSpan="7" className="p-3 font-bold text-pink-800 text-xs uppercase tracking-wider">
                                                                {pIdx + 1}. {phase}
                                                            </td>
                                                        </tr>

                                                        {/* Activity Rows for this Phase */}
                                                        {phaseActivities.map((act, aIdx) => (
                                                            <tr key={act.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-100">
                                                                <td className="border-r border-slate-200 p-2 align-top">
                                                                    <div className="flex gap-2 items-start w-full">
                                                                        <span className="font-bold text-slate-400 text-xs mt-1.5 shrink-0 select-none">{pIdx + 1}.{aIdx + 1}</span>
                                                                        <TextareaAuto placeholder="Describe activity..." className="font-medium text-slate-700 w-full bg-transparent p-1 focus:bg-white border border-transparent focus:border-slate-300 rounded" value={act.name} onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)} />
                                                                    </div>
                                                                </td>
                                                                <td className="border-r border-slate-200 p-2 align-top">
                                                                    <TextareaAuto placeholder="e.g. Jan-Mar" className="font-medium text-slate-700 w-full bg-transparent p-1 text-center focus:bg-white border border-transparent focus:border-slate-300 rounded" value={act.period} onChange={(e) => handleActivityChange(act.id, 'period', e.target.value)} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-2 align-top">
                                                                    <TextareaAuto placeholder="e.g. Teachers" className="font-medium text-slate-700 w-full bg-transparent p-1 text-center focus:bg-white border border-transparent focus:border-slate-300 rounded" value={act.persons} onChange={(e) => handleActivityChange(act.id, 'persons', e.target.value)} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-2 align-top">
                                                                    <TextareaAuto placeholder="Expected output" className="font-medium text-slate-700 w-full bg-transparent p-1 text-center focus:bg-white border border-transparent focus:border-slate-300 rounded" value={act.outputs} onChange={(e) => handleActivityChange(act.id, 'outputs', e.target.value)} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-2 align-top bg-slate-50/30">
                                                                    <input type="text" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded p-1" placeholder="0" value={act.budgetAmount} onChange={(e) => handleActivityChange(act.id, 'budgetAmount', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                                </td>
                                                                <td className="border-r border-slate-200 p-2 align-top bg-slate-50/30">
                                                                    <input type="text" className="w-full text-center outline-none text-sm font-medium text-slate-700 bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded p-1" placeholder="Source" value={act.budgetSource} onChange={(e) => handleActivityChange(act.id, 'budgetSource', e.target.value)} />
                                                                </td>
                                                                <td className="border-none p-0 w-0 relative bg-white">
                                                                    {activities.length > 1 && (
                                                                        <button type="button" onClick={() => handleRemoveActivity(act.id)} className="absolute -right-12 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm hover:border-red-200 hover:text-red-500 hover:bg-red-50 focus:outline-none transition-colors z-10 opacity-0 group-hover:opacity-100" title="Delete Row">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Add Activity Button explicitly for this Phase */}
                                                        <tr className="border-b-2 border-slate-200 bg-white group transition-colors">
                                                            <td colSpan="7" className="p-2">
                                                                <button type="button" onClick={() => handleAddActivityPhase(phase)} className="text-[11px] font-bold text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 origin-left">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                    Add Activity to {phase}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            )}
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* SECTION 5: SIGNATURES */}
                        {/* -------------------------------------------------------- */}
                        {(appMode === 'full' || currentStep === 5) && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-pink-50 text-pink-600 border border-pink-100 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Signatures</h2>
                                            {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Finalize with necessary approvals.</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-2 relative overflow-hidden">
                                <svg className="absolute inset-0 h-full w-full opacity-30 stroke-slate-200 mask-image:linear-gradient(to_bottom,transparent,black)" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines)"></rect></svg>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                                    <div className="flex flex-col">
                                        <p className="text-xs text-left mb-8 select-none text-slate-500 font-bold uppercase tracking-widest">Prepared by</p>
                                        <input type="text" className="w-full border-b-2 border-slate-200 focus:border-pink-500 transition-colors text-center font-black uppercase text-lg outline-none bg-transparent pb-2 text-slate-800 placeholder:text-slate-300" placeholder="NAME OF COORDINATOR" value={projectCoord} onChange={(e) => setProjectCoord(e.target.value)} />
                                        <p className="text-xs mt-3 select-none text-slate-500 text-center font-semibold uppercase tracking-widest">Project Coordinator</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs text-left mb-8 select-none text-slate-500 font-bold uppercase tracking-widest">Noted</p>
                                        <input type="text" className="w-full border-b-2 border-slate-200 text-center font-black uppercase text-lg pointer-events-none select-none bg-transparent pb-2 text-slate-800" value="DR. ENRIQUE Q. RETES, EdD" readOnly tabIndex={-1} />
                                        <p className="text-xs mt-3 select-none text-slate-500 text-center font-semibold uppercase tracking-widest">Chief Education Supervisor</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* -------------------------------------------------------- */}
                        {/* SECTION 6: FINAL REVIEW & SUBMIT */}
                        {/* -------------------------------------------------------- */}
                        {(appMode === 'full' || currentStep === 6) && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {appMode === 'wizard' && (
                                    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-slate-100 shadow-sm mb-12 flex flex-col items-center justify-center text-center group relative overflow-hidden transition-all hover:border-pink-200">
                                        <div className="absolute inset-0 bg-pink-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-6 text-pink-600 border border-pink-100 group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-2">Final Document Review</h3>
                                        <p className="text-sm text-slate-500 font-medium mb-8 max-w-sm">You've completed all sections. Review the generated layout below to ensure everything is correct before final submission.</p>

                                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setIsPreviewOpen(true)}
                                                className="px-8 py-4 bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 hover:bg-pink-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                Back
                            </button>

                            {currentStep < totalSteps && (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors active:scale-95 shadow-md"
                                >
                                    Continue
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
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
                </form>
            </div>
        </div>

        </div>
    );
}
