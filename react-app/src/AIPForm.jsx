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

export default function App() {
    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [isMobile, setIsMobile] = useState(false);
    const currentYear = new Date().getFullYear();

    // UI Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

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

    // Local Storage - Load Draft
    useEffect(() => {
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
                // If there's a draft, skip splash
                setAppMode('wizard');
            } catch (e) {
                console.error("Failed to load draft:", e);
            }
        }
    }, []);

    const handleSaveForLater = () => {
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
        alert("Draft saved successfully to local storage!");
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
            setActivityToDelete(id);
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
            alert("Success! The Annual Implementation Plan has been saved to the database.");
        }, 300);
    };

    // ==========================================
    // RENDER SPLASH SCREEN
    // ==========================================
    if (appMode === 'splash') {
        return (
            <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
                <FormHeader title="AIP: Annual Implementation Plan" onSave={handleSaveForLater} theme="emerald" />
                
                <div className="flex-1 flex items-center justify-center relative">
                    {/* Aceternity Grid Background */}
                <div className="absolute inset-0 bg-white bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-0"></div>
                {/* Glowing Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 container mx-auto px-6 flex flex-col items-center">
                    <div className="bg-white/90 border border-slate-200 rounded-[2rem] p-8 md:p-14 shadow-xl text-center max-w-2xl w-full mx-auto ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-700">
                        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-2xl mb-6 shadow-inner border border-emerald-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-slate-900 pb-2 mb-3">
                            Annual Implementation Plan
                        </h1>
                        <p className="text-slate-500 font-medium mb-10 text-sm md:text-base px-4">
                            Strategic Planning and Development Tracking for {currentYear}
                            {!isMobile && <span className="block mt-2 font-normal text-slate-400">Choose how you would like to complete your AIP.</span>}
                        </p>

                        {isMobile ? (
                            <button 
                                onClick={() => setAppMode('wizard')} 
                                className="w-full inline-flex h-14 items-center justify-center rounded-2xl bg-emerald-600 px-8 font-bold text-white shadow-md hover:bg-emerald-700 transition-colors active:scale-95 gap-3"
                            >
                                Start AIP
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setAppMode('wizard')} 
                                    className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white border-2 border-emerald-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-400 hover:bg-emerald-50/50 transition-all active:scale-95 text-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Step-by-Step Wizard</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Guided, focused sections</p>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => setAppMode('full')} 
                                    className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 text-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Full Form View</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Classic paper layout</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

    // ==========================================
    // RENDER MAIN APPLICATION
    // ==========================================
    return (
        <div className="bg-slate-50 min-h-screen flex flex-col text-slate-800 font-sans relative overflow-hidden print:py-0 print:bg-white print:text-black">
            <FormHeader title="AIP: Annual Implementation Plan" onSave={handleSaveForLater} theme="emerald" />
            
            {/* Aceternity Grid Background */}
            <div className="absolute inset-0 bg-white bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none z-0 print:hidden"></div>

            <style>{`
                @media print {
                    @page { margin: 1cm; }
                    body { background-color: white !important; color: black !important; }
                    .print-reset { background: transparent !important; color: black !important; border-color: black !important; }
                }
            `}</style>
            
            {/* MAIN CONTAINER */}
            <div className="container mx-auto max-w-5xl bg-white border border-slate-200 rounded-[2rem] p-6 md:p-12 shadow-xl print:hidden mb-12 relative z-10 mt-8">
                
                {/* View Mode Toggle (Desktop Only) */}
                {!isMobile && (
                    <div className="absolute top-6 right-8 z-20">
                        <button 
                            onClick={() => setAppMode(appMode === 'wizard' ? 'full' : 'wizard')}
                            className="text-xs font-semibold text-slate-500 hover:text-emerald-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1.5"
                        >
                            {appMode === 'wizard' ? (
                                <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg> Switch to Full View</>
                            ) : (
                                <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg> Switch to Wizard</>
                            )}
                        </button>
                    </div>
                )}

                {/* HEADER */}
                <FormBoxHeader 
                    title="Annual Implementation Plan" 
                    badge={`CY ${currentYear}`} 
                />

                {/* ============================================================== */}
                {/* WIZARD MODE: STEPPER & CARDS */}
                {/* ============================================================== */}
                {appMode === 'wizard' && (
                    <div className="mb-12 pt-6">
                        <div className="flex justify-between items-center max-w-2xl mx-auto px-4 relative">
                            <div className="absolute left-[10%] right-[10%] top-[14px] h-[2px] bg-slate-200 -z-0 hidden md:block rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
                            </div>
                            {[
                                { num: 1, label: "Alignment" },
                                { num: 2, label: "Targets" },
                                { num: 3, label: "Action Plan" },
                                { num: 4, label: "Review" }
                            ].map((step) => (
                                <div key={step.num} className="flex flex-col items-center gap-3 relative z-10 w-1/4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors ${
                                        currentStep === step.num ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100' : 
                                        currentStep > step.num ? 'bg-emerald-600 text-white ring-2 ring-white' : 'bg-white text-slate-400 border-2 border-slate-200'
                                    }`}>
                                        {currentStep > step.num ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        ) : step.num}
                                    </div>
                                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${currentStep === step.num ? 'text-emerald-700' : 'text-slate-400'}`}>
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
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Strategic Alignment</h2>
                                    {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Define the core strategic direction of the project.</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input theme="emerald" label="Pillar / Strategic Direction" placeholder="Enter Strategic Direction..." value={pillar} onChange={(e) => setPillar(e.target.value)} />
                                <Select theme="emerald" label="DepEd Program Aligned" placeholder="Select Program Alignment" options={PROGRAM_LIST} value={depedProgram} onChange={(e) => setDepedProgram(e.target.value)} />
                                <Input theme="emerald" label="School Improvement Project / Title" placeholder="Enter SIP Title..." value={sipTitle} onChange={(e) => setSipTitle(e.target.value)} />
                                <Input theme="emerald" label="Project Coordinator" placeholder="Name of Coordinator..." value={projectCoord} onChange={(e) => setProjectCoord(e.target.value)} />
                            </div>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* SECTION 2: GOALS AND TARGETS */}
                        {/* -------------------------------------------------------- */}
                        <div className={`${(appMode === 'full' || currentStep === 2) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                            <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Goals & Targets</h2>
                                    {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Establish the objectives and specific performance indicators.</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                                <div className="flex flex-col gap-1.5 w-full group">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-emerald-600 transition-colors">Objective/s</label>
                                    <TextareaAuto className="w-full bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 shadow-sm min-h-[80px]" placeholder="List primary objectives..." value={objectives} onChange={(e) => setObjectives(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5 w-full group">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-emerald-600 transition-colors">Performance Indicator/s (OVI)</label>
                                        <TextareaAuto className="w-full bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 shadow-sm min-h-[60px]" placeholder="Measurable indicators..." value={indicators} onChange={(e) => setIndicators(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5 w-full group">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-emerald-600 transition-colors">Annual Target</label>
                                        <TextareaAuto className="w-full bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 shadow-sm min-h-[60px]" placeholder="State your annual target..." value={annualTarget} onChange={(e) => setAnnualTarget(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* WIZARD ONLY: ACTIVITY CARDS (Step 3) */}
                        {/* -------------------------------------------------------- */}
                        {appMode === 'wizard' && (
                            <div className={`${currentStep === 3 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}`}>
                                <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Action Plan & Budget</h2>
                                            <p className="text-sm text-slate-500 font-medium mt-0.5">Detail the activities categorized by Planning, Implementation, and M&E.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {activities.map((act, index) => {
                                        const isExpanded = expandedActivityId === act.id;

                                        if (!isExpanded) {
                                            // COMPACT CARD VIEW
                                            return (
                                                <div 
                                                    key={act.id} 
                                                    onClick={() => setExpandedActivityId(act.id)}
                                                    className="relative group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-colors cursor-pointer flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-4 overflow-hidden pr-4">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                            <span className="font-bold text-sm">{index + 1}</span>
                                                        </div>
                                                        <div className="flex flex-col truncate">
                                                            <span className="text-sm font-bold text-slate-800 truncate flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase tracking-wider">{act.phase}</span>
                                                                {act.name || <span className="text-slate-400 italic font-normal">Untitled Activity...</span>}
                                                            </span>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">
                                                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                                    Period: <span className="text-slate-700">{act.period || '--'}</span>
                                                                </span>
                                                                <span className="text-slate-300 hidden sm:block">|</span>
                                                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                                    Budget: <span className="text-emerald-600">{act.budgetAmount ? formatCurrency(act.budgetAmount) : '--'}</span>
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                            </button>
                                                        )}
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // EXPANDED CARD VIEW
                                        return (
                                            <div key={act.id} className="relative group bg-white border-2 border-emerald-200 rounded-3xl shadow-md overflow-hidden ring-4 ring-emerald-50">
                                                <div 
                                                    onClick={() => setExpandedActivityId(null)}
                                                    className="flex items-center justify-between p-5 md:px-8 bg-slate-50/80 hover:bg-emerald-50/50 transition-colors border-b border-slate-100 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                            </button>
                                                        )}
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-600 bg-emerald-100 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 md:p-8 flex flex-col gap-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
                                                        <Select theme="emerald" 
                                                            label="Phase / Category" 
                                                            options={PHASES} 
                                                            value={act.phase} 
                                                            onChange={(e) => handleActivityChange(act.id, 'phase', e.target.value)} 
                                                        />
                                                        <Input theme="emerald" 
                                                            label="Activity Name" 
                                                            placeholder="Describe the activity..." 
                                                            value={act.name} 
                                                            onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)} 
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <Input theme="emerald" 
                                                            label="Implementation Period" 
                                                            placeholder="e.g. Jan - March" 
                                                            value={act.period} 
                                                            onChange={(e) => handleActivityChange(act.id, 'period', e.target.value)} 
                                                        />
                                                        <Input theme="emerald" 
                                                            label="Persons Involved" 
                                                            placeholder="Teachers, Staff..." 
                                                            value={act.persons} 
                                                            onChange={(e) => handleActivityChange(act.id, 'persons', e.target.value)} 
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1.5 w-full group">
                                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-emerald-600 transition-colors">Outputs</label>
                                                        <TextareaAuto 
                                                            className="w-full bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl px-4 py-3 text-sm text-slate-800 shadow-sm" 
                                                            placeholder="Expected outputs..." 
                                                            value={act.outputs} 
                                                            onChange={(e) => handleActivityChange(act.id, 'outputs', e.target.value)} 
                                                        />
                                                    </div>

                                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
                                                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Budgetary Requirements
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm focus-within:border-emerald-300 transition-colors group/input">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-focus-within/input:text-emerald-600">Amount</label>
                                                                <input type="text" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800" placeholder="₱ 0.00" value={act.budgetAmount} onChange={(e) => handleActivityChange(act.id, 'budgetAmount', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                            </div>
                                                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm focus-within:border-emerald-300 transition-colors group/input">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 group-focus-within/input:text-emerald-600">Source</label>
                                                                <input type="text" className="w-full bg-transparent outline-none font-sans text-sm font-semibold text-slate-800 mt-1" placeholder="e.g. MOOE" value={act.budgetSource} onChange={(e) => handleActivityChange(act.id, 'budgetSource', e.target.value)} />
                                                            </div>
                                                        </div>
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
                                        className={`group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-8 font-bold shadow-sm border-2 active:scale-95 transition-colors gap-2 duration-300 ${
                                            isAddingActivity 
                                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                            : 'bg-white text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50'
                                        }`}
                                    >
                                        {isAddingActivity ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-in zoom-in duration-300"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Activity Added!
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90 duration-300"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                Add Another Activity
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* -------------------------------------------------------- */}
                        {/* FULL MODE ONLY: INTERACTIVE ACTIVITIES TABLE - TRUE TO FORM */}
                        {/* -------------------------------------------------------- */}
                        {appMode === 'full' && (
                            <div className="mb-16">
                                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Action Plan & Budget</h2>
                                            <p className="text-sm text-slate-500 font-medium mt-0.5">Group activities by Planning, Implementation, and M&E.</p>
                                        </div>
                                    </div>
                                </div>
                                
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
                                                            <tr className="bg-emerald-50/50 border-b border-slate-200">
                                                                <td colSpan="7" className="p-3 font-bold text-emerald-800 text-xs uppercase tracking-wider">
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
                                                                    <button type="button" onClick={() => handleAddActivityPhase(phase)} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 origin-left">
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
                            </div>
                        )}

                        {/* -------------------------------------------------------- */}
                        {/* SECTION 4: SIGNATURES (Shared) */}
                        {/* -------------------------------------------------------- */}
                        <div className={`${(appMode === 'full' || currentStep === 4) ? 'block' : 'hidden'}`}>
                            <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Finalize Document</h2>
                                    {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Review signatures and submit. Scroll down to preview the printable layout.</p>}
                                </div>
                            </div>

                            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-2 relative overflow-hidden">
                                <svg className="absolute inset-0 h-full w-full opacity-30 stroke-slate-200 mask-image:linear-gradient(to_bottom,transparent,black)" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines)"></rect></svg>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                                    <div className="flex flex-col">
                                        <p className="text-xs text-left mb-8 select-none text-slate-500 font-bold uppercase tracking-widest">Prepared by</p>
                                        <input type="text" className="w-full border-b-2 border-slate-200 focus:border-emerald-500 transition-colors text-center font-black uppercase text-lg outline-none bg-transparent pb-2 text-slate-800 placeholder:text-slate-300" placeholder="NAME OF COORDINATOR" value={projectCoord} onChange={(e) => setProjectCoord(e.target.value)} />
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

                    </div>

                    {/* WIZARD NAVIGATION BUTTONS */}
                    {appMode === 'wizard' && (
                        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center">
                            <button 
                                type="button" 
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className={`group relative inline-flex h-12 items-center justify-center rounded-xl px-6 font-medium transition-colors gap-2 ${
                                    currentStep === 1 
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
                </form>
            </div>

            {/* ========================================= */}
            {/* PRINT LAYOUT & ON-SCREEN DOCUMENT PREVIEW */}
            {/* ========================================= */}
            <div className={`print:block print:p-0 print:shadow-none print:m-0 print:bg-transparent ${appMode === 'wizard' && currentStep === 4 ? 'block container mx-auto max-w-[210mm] bg-white text-black shadow-md border border-slate-200 p-8 md:p-12 mb-12 relative' : 'hidden'} ${appMode === 'full' ? 'print:block hidden' : ''}`}>
                
                {/* Print Header */}
                <div className="text-center mb-8 font-serif print-reset">
                    <h1 className="text-lg font-bold uppercase underline decoration-2 underline-offset-4 tracking-wide">ANNUAL IMPLEMENTATION PLAN FOR {currentYear}</h1>
                </div>

                {/* Print Section: Profile & Goals */}
                <div 
                    onClick={() => editSection(1)} 
                    className={`mb-6 relative group rounded-xl p-4 -mx-4 transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none print-reset ${appMode === 'wizard' ? 'cursor-pointer hover:bg-emerald-50/50' : ''}`}
                >
                    {appMode === 'wizard' && (
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md print:hidden flex items-center gap-1.5 z-10 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            Edit Section
                        </div>
                    )}
                    <div className="text-[12px] space-y-1">
                        <div className="flex border-b border-dotted border-black pb-1">
                            <span className="font-bold w-[25%]">Pillar/Strategic Direction:</span>
                            <span className="w-[75%]">{pillar || "\u00A0"}</span>
                        </div>
                        <div className="flex border-b border-dotted border-black pb-1">
                            <span className="font-bold w-[25%]">DepEd Program Aligned:</span>
                            <span className="w-[75%]">{depedProgram || "\u00A0"}</span>
                        </div>
                        <div className="flex border-b border-dotted border-black pb-1">
                            <span className="font-bold w-[25%]">School Improvement Project/Title:</span>
                            <span className="w-[45%]">{sipTitle || "\u00A0"}</span>
                            <span className="font-bold w-[10%]">Project Coord:</span>
                            <span className="w-[20%]">{projectCoord || "\u00A0"}</span>
                        </div>
                        
                        <div onClick={(e) => { e.stopPropagation(); editSection(2); }} className={`pt-2 ${appMode === 'wizard' ? 'cursor-pointer hover:bg-emerald-100/50 -mx-2 px-2 py-1 rounded transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none' : ''}`}>
                            <div className="flex border-b border-dotted border-black pb-1">
                                <span className="font-bold w-[25%] align-top">Objective/s:</span>
                                <span className="w-[75%] whitespace-pre-wrap">{objectives || "\u00A0"}</span>
                            </div>
                            <div className="flex border-b border-dotted border-black pb-1">
                                <span className="font-bold w-[25%] align-top">Performance Indicator/s (OVI):</span>
                                <span className="w-[45%] whitespace-pre-wrap">{indicators || "\u00A0"}</span>
                                <span className="font-bold w-[10%] align-top">Annual Target:</span>
                                <span className="w-[20%] whitespace-pre-wrap">{annualTarget || "\u00A0"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Section: Activities */}
                <div 
                    onClick={() => editSection(3)} 
                    className={`mb-4 relative group rounded-xl p-4 -mx-4 transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none print-reset ${appMode === 'wizard' ? 'cursor-pointer hover:bg-emerald-50/50' : ''}`}
                >
                    {appMode === 'wizard' && (
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md print:hidden flex items-center gap-1.5 z-10 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            Edit Section
                        </div>
                    )}
                    <div className="pb-2">
                        <table className="w-full border-collapse text-[11px] border border-black table-fixed">
                            <thead>
                                <tr className="text-center font-bold bg-slate-100 print:bg-transparent">
                                    <th rowSpan="2" className="border border-black p-2 w-[35%]">Activities to be Conducted</th>
                                    <th rowSpan="2" className="border border-black p-2 w-[15%]">Implementation Period</th>
                                    <th rowSpan="2" className="border border-black p-2 w-[15%]">Persons Involved</th>
                                    <th rowSpan="2" className="border border-black p-2 w-[15%]">Outputs</th>
                                    <th colSpan="2" className="border border-black p-1 w-[20%]">Budgetary Requirement</th>
                                </tr>
                                <tr className="text-center font-bold bg-slate-100 print:bg-transparent">
                                    <th className="border border-black p-1">Amount</th>
                                    <th className="border border-black p-1">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PHASES.map((phase, pIdx) => {
                                    const phaseActivities = activities.filter(a => a.phase === phase);
                                    return (
                                        <React.Fragment key={phase}>
                                            <tr className="bg-slate-50 print:bg-transparent font-bold">
                                                <td colSpan="6" className="border border-black p-1 px-2">{pIdx + 1}. {phase}</td>
                                            </tr>
                                            {phaseActivities.map((act, aIdx) => (
                                                <tr key={act.id}>
                                                    <td className="border border-black p-2 align-top break-words">
                                                        <div className="flex gap-1.5 items-start">
                                                            <span className="font-semibold shrink-0">{pIdx + 1}.{aIdx + 1}</span> 
                                                            <span>{act.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="border border-black p-2 align-top text-center">{act.period}</td>
                                                    <td className="border border-black p-2 align-top text-center">{act.persons}</td>
                                                    <td className="border border-black p-2 align-top text-center">{act.outputs}</td>
                                                    <td className="border border-black p-2 align-top text-right font-mono">{act.budgetAmount ? formatCurrency(act.budgetAmount) : ''}</td>
                                                    <td className="border border-black p-2 align-top text-center">{act.budgetSource}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Print Signatures */}
                <div 
                    onClick={() => editSection(4)} 
                    className={`page-break-inside-avoid relative group rounded-xl p-4 -mx-4 transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none mt-4 mb-4 print-reset ${appMode === 'wizard' ? 'cursor-pointer hover:bg-emerald-50/50' : ''}`}
                >
                    {appMode === 'wizard' && (
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md print:hidden flex items-center gap-1.5 z-10 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            Edit Section
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-16 mt-8">
                        <div className="text-center">
                            <p className="text-sm text-left mb-8 font-medium">Prepared by:</p>
                            <div className="border-b border-black font-bold uppercase text-sm pb-1 min-h-[24px]">
                                {projectCoord}
                            </div>
                            <p className="text-xs mt-1 font-medium">Project Coordinator</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-left mb-8 font-medium">Noted:</p>
                            <div className="border-b border-black font-bold uppercase text-sm pb-1 min-h-[24px]">
                                DR. ENRIQUE Q. RETES, EdD
                            </div>
                            <p className="text-xs mt-1 font-medium">Chief Education Supervisor</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================= */}
            {/* FINAL ACTION BUTTONS (Below Preview/Full Form) */}
            {/* ========================================= */}
            {(appMode === 'full' || currentStep === 4) && (
                <div className="print:hidden container mx-auto max-w-[210mm] bg-white border border-slate-200 rounded-[2rem] p-8 mb-16 flex flex-col items-center justify-center text-center shadow-lg relative z-10">
                    {isSubmitted ? (
                        <div className="mb-6 px-6 py-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-bold flex items-center gap-3 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            AIP Successfully Saved to Database!
                        </div>
                    ) : (
                        <h3 className="text-slate-800 font-bold text-xl mb-6">Ready to finalize your plan?</h3>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        
                        <button 
                            type="button" 
                            onClick={handleConfirmSubmit} 
                            disabled={isSubmitted} 
                            className="inline-flex h-14 items-center justify-center rounded-2xl bg-emerald-600 px-8 py-1 text-sm font-bold text-white transition-colors gap-3 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            {isSubmitted ? "Submitted" : "Confirm & Submit"}
                        </button>
                        
                        <button type="button" onClick={() => window.print()} className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white border-2 border-slate-200 px-8 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-colors active:scale-95 w-full sm:w-auto shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            Print PDF
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* CUSTOM DELETE CONFIRMATION MODAL          */}
            {/* ========================================= */}
            {activityToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Delete Activity?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">This activity card contains data. Are you sure you want to permanently remove it?</p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setActivityToDelete(null)}
                                className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => executeDelete(activityToDelete)}
                                className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 transition-colors active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
