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
    "DRRM", "OK sa DepED", "Enhanced School Sports", "Guidance and Counseling Program",
    "Mental Health and Psychosocial Support", "Fitness and Wellness", "Education in Emergencies (Alternative Delivery Modality)",
    "School-Based Management Program", "Client Feedback Program", "School Utilities and Services Maintenance Program",
    "School-Based Repair and Maintenance", "Fiscal Management", "Performance Management Program",
    "Procurement Management Program", "Adopt-a-School Program", "PTA Affairs Management", "Development Planning Program",
    "Program Implementation Review", "PRAISE/Rewards and Incentives", "EBEIS, LIS, School Information Management Program",
    "Crucial Resources Inventory Program", "Office Management (incl. Records) and Housekeeping Program",
    "Advocacy, Info Education and Communications Program"
].sort();

const SCHOOL_LIST = [
    "Mckinley CES", "FTAMES", "MTVES", "Daniel T. Anog NHS", "P. Zamora ES", "T. Hill ES", "T. Hill NHS", 
    "Bakid ES", "Bakid NHS", "Mabunga ES", "Mabunga NHS", "GSCS", "GNHS-POBLACION", "Buenavista ES", 
    "Agulang ES", "Magsaysay ES", "Malusay ES", "Mandi-i ES", "Nagsaha ES", "Planas ES", "Tominhao ES", 
    "Villegas ES", "Villegas NHS", "Buenavista NHS", "Magsaysay NHS ", "Planas NHS", "Hinogpayan ES", 
    "Balogo ES", "Banwague ES", "Banwague NHS", "Dadiangao ES", "Hinakpan ES", "Binobohan NHS", 
    "Maculos NHS", "DPVMES", "Hilaitan ES", "Busay ES", "Cabal-asan ES", "PSLMES", "GNHS-Hilaitan (JHS)", 
    "GSVS NHS", "Maniak ES", "JBES", "Calabaclabacan CES", "Benil-iwan ES", "Bongao ES", "Budlasan ES", 
    "Panagtugas ES", "Trinidad ES", "Trinidad NHS", "Calupaan ES", "Maximina LTHS", "VCES", "Banban ES", 
    "Don Esperidion VES", "Don Julian DVVMES", "Guba ES", "Malangsa ES", "Mampayao ES (Malangsa Ext.)", 
    "Molobolo ES", "Puan ES", "Tabon ES", "Guba NHS", "VNHS (JHS)"
].sort();

const FACTOR_TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];

import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { TextareaAuto } from './components/ui/TextareaAuto';
import { FormHeader } from './components/ui/FormHeader';
import { FormBoxHeader } from './components/ui/FormBoxHeader';
import { ViewModeSelector } from './components/ui/ViewModeSelector';

export default function App() {
    // App Mode State: 'splash', 'wizard', or 'full'
    const [appMode, setAppMode] = useState('splash');
    const [isMobile, setIsMobile] = useState(false);
    const [quarterString] = useState(() => {
        const date = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();
        if (month <= 2) return `1st Quarter CY ${year}`;
        if (month <= 5) return `2nd Quarter CY ${year}`;
        if (month <= 8) return `3rd Quarter CY ${year}`;
        return `4th Quarter CY ${year}`;
    });

    // UI Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;
    const [activeFactorTab, setActiveFactorTab] = useState(FACTOR_TYPES[0]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    // Save Status State
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

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

    // Handlers
    const handleSelectMode = (mode) => {
        if (hasDraft) {
            const savedDraft = localStorage.getItem('pir_draft');
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
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
        }
        setAppMode(mode);
    };

    const handleBack = () => {
        if (appMode === 'splash') {
            if (window.confirm("Return to Dashboard? Any unsaved changes will be lost.")) {
                window.location.href = '/';
            }
        } else {
            setAppMode('splash');
        }
    };

    const handleSaveForLater = () => {
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
        localStorage.setItem('pir_draft', JSON.stringify(draft));

        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
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
            setActivityToDelete(id);
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
    
    const handleConfirmSubmit = () => {
        setIsSubmitted(true);
        setTimeout(() => {
            alert("Success! The QPIR document has been saved to the database.");
        }, 300);
    };

    // ==========================================
    // RENDER SPLASH SCREEN (View Mode Selector)
    // ==========================================
    if (appMode === 'splash') {
        return (
            <>
                <FormHeader 
                    title="Quarterly Performance Review" 
                    onSave={handleSaveForLater} 
                    onBack={handleBack}
                    isSaving={isSaving}
                    isSaved={isSaved}
                    theme="blue" 
                />
                <ViewModeSelector
                    onSelectMode={handleSelectMode}
                    hasDraft={hasDraft}
                    draftInfo={draftInfo}
                    theme="blue"
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
                title="Quarterly Performance Review" 
                onSave={handleSaveForLater} 
                onBack={handleBack}
                isSaving={isSaving}
                isSaved={isSaved}
                theme="blue" 
            />
            
            {/* Aceternity Grid Background with Radial Mask */}
            <div className="absolute inset-0 bg-white bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none z-0 print:hidden"></div>

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
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-md mb-6">
                        <FormBoxHeader 
                            title="Quarterly Performance Review"
                            badge={quarterString}
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
                                className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1.5"
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
                                { num: 2, label: "Activities" },
                                { num: 3, label: "Factors" },
                                { num: 4, label: "Review" }
                            ].map((step) => (
                                <div key={step.num} className="flex flex-col items-center gap-3 relative z-10 w-1/4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors ${
                                        currentStep === step.num ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 
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
                                <Select theme="blue" label="Program Name" placeholder="Select Program" options={PROGRAM_LIST} value={program} onChange={(e) => setProgram(e.target.value)} />
                                <Select theme="blue" label="School" placeholder="Select School" options={SCHOOL_LIST} value={school} onChange={(e) => setSchool(e.target.value)} />
                                <Input theme="blue" label="Program Owner" placeholder="Name of owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input theme="blue" label="Budget" placeholder="₱ 0.00" inputMode="decimal" value={displayBudget} onFocus={() => setIsBudgetFocused(true)} onBlur={() => setIsBudgetFocused(false)} onChange={(e) => setRawBudget(e.target.value.replace(/[^0-9.]/g, ''))} />
                                    <Select theme="blue" label="Fund Source" placeholder="Select Source" options={["MOOE", "SARO"]} value={fundSource} onChange={(e) => setFundSource(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* WIZARD ONLY: ACTIVITY CARDS (Step 2) */}
                        {/* -------------------------------------------------------- */}
                        {appMode === 'wizard' && (
                            <div className={`${currentStep === 2 ? 'block' : 'hidden'}`}>
                                <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                            </button>
                                                        )}
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                            </button>
                                                        )}
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 bg-blue-100 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
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
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
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
                                        className={`group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-8 font-bold shadow-sm border-2 active:scale-95 transition-colors gap-2 ${
                                            isAddingActivity 
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
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
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
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
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
                        {/* WIZARD ONLY: FACTORS TABS (Step 3) */}
                        {/* -------------------------------------------------------- */}
                        {appMode === 'wizard' && (
                            <div className={`${currentStep === 3 ? 'block' : 'hidden'}`}>
                                <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                    <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Facilitating & Hindering Factors</h2>
                                        <p className="text-sm text-slate-500 font-medium mt-0.5">Select a category to detail internal and external factors.</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                                    {FACTOR_TYPES.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setActiveFactorTab(type)}
                                            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-colors border ${
                                                activeFactorTab === type
                                                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800 shadow-sm'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="flex flex-col gap-4 relative z-10">
                                        <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                            Facilitating Factors
                                        </label>
                                        <TextareaAuto 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-700 focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 transition-colors min-h-[160px]"
                                            placeholder={`Enter positive factors for ${activeFactorTab}...`}
                                            value={factors[activeFactorTab].facilitating}
                                            onChange={(e) => handleFactorChange(activeFactorTab, 'facilitating', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4 relative z-10">
                                        <label className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                                            Hindering Factors
                                        </label>
                                        <TextareaAuto 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-700 focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-colors min-h-[160px]"
                                            placeholder={`Enter challenges for ${activeFactorTab}...`}
                                            value={factors[activeFactorTab].hindering}
                                            onChange={(e) => handleFactorChange(activeFactorTab, 'hindering', e.target.value)}
                                        />
                                    </div>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg>
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
                        <div className={`${(appMode === 'full' || currentStep === 4) ? 'block' : 'hidden'}`}>
                            <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Finalize Document</h2>
                                    {appMode === 'wizard' && <p className="text-sm text-slate-500 font-medium mt-0.5">Review signatures and submit. Scroll down to preview the printable layout.</p>}
                                </div>
                            </div>

                            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-2">
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
                                    {currentStep === 3 && FACTOR_TYPES.indexOf(activeFactorTab) < FACTOR_TYPES.length - 1 && (
                                        <button 
                                            type="button" 
                                            onClick={nextStep}
                                            className="text-sm font-medium text-slate-400 hover:text-slate-600 px-3 transition-colors hidden sm:block"
                                        >
                                            Skip to Review
                                        </button>
                                    )}
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (currentStep === 3 && FACTOR_TYPES.indexOf(activeFactorTab) < FACTOR_TYPES.length - 1) {
                                                setActiveFactorTab(FACTOR_TYPES[FACTOR_TYPES.indexOf(activeFactorTab) + 1]);
                                            } else {
                                                nextStep();
                                            }
                                        }}
                                        className="group relative inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-md transition-colors active:scale-95 hover:bg-slate-800 gap-2"
                                    >
                                        {currentStep === 3 && FACTOR_TYPES.indexOf(activeFactorTab) < FACTOR_TYPES.length - 1 
                                            ? "Next Category" 
                                            : "Continue"}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>

            {/* ========================================= */}
            {/* PRINT LAYOUT & ON-SCREEN DOCUMENT PREVIEW */}
            {/* ========================================= */}
            <div className={`print:block print:p-0 print:shadow-none print:m-0 print:bg-transparent ${appMode === 'wizard' && currentStep === 4 ? 'block container mx-auto max-w-[210mm] bg-white text-black shadow-md border border-slate-200 p-8 md:p-12 mb-12 relative' : 'hidden'} ${appMode === 'full' ? 'print:block hidden' : ''}`}>
                
                {/* Print Header */}
                <div className="text-center mb-8 font-serif print-reset">
                    <p className="text-sm">Republic of the Philippines</p>
                    <p className="text-sm font-bold">Department of Education</p>
                    <p className="text-sm">NEGROS ISLAND REGION</p>
                    <p className="text-sm">Division of Guihulngan City</p>
                    <br/>
                    <h1 className="text-lg font-bold uppercase underline decoration-2 underline-offset-4 tracking-wide">Quarterly Performance Implementation Review (QPIR)</h1>
                    <p className="text-sm mt-1 italic">Quarterly Division Monitoring Evaluation and Adjustment</p>
                    <p className="text-base font-bold mt-2">{quarterString}</p>
                </div>

                {/* Print Section A */}
                <div 
                    onClick={() => editSection(1)} 
                    className={`mb-4 relative group rounded-xl p-4 -mx-4 transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none print-reset ${appMode === 'wizard' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                    {appMode === 'wizard' && (
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md print:hidden flex items-center gap-1.5 z-10 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            Edit Section
                        </div>
                    )}
                    <div className="border-b-2 border-black pb-4">
                        <h2 className="font-bold text-base mb-3 uppercase tracking-wide">A. Program Profile</h2>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                            <div className="flex border-b border-black pb-1">
                                <span className="font-bold w-1/3">Program:</span>
                                <span className="w-2/3">{program || "\u00A0"}</span>
                            </div>
                            <div className="flex border-b border-black pb-1">
                                <span className="font-bold w-1/3">School:</span>
                                <span className="w-2/3">{school || "\u00A0"}</span>
                            </div>
                            <div className="flex border-b border-black pb-1">
                                <span className="font-bold w-1/3">Owner:</span>
                                <span className="w-2/3">{owner || "\u00A0"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex border-b border-black pb-1">
                                    <span className="font-bold w-1/2">Budget:</span>
                                    <span className="w-1/2">{formatCurrency(rawBudget) || "\u00A0"}</span>
                                </div>
                                <div className="flex border-b border-black pb-1">
                                    <span className="font-bold w-1/2">Source:</span>
                                    <span className="w-1/2">{fundSource || "\u00A0"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Section C */}
                <div 
                    onClick={() => editSection(2)} 
                    className={`mb-4 relative group rounded-xl p-4 -mx-4 transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none print-reset ${appMode === 'wizard' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                    {appMode === 'wizard' && (
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md print:hidden flex items-center gap-1.5 z-10 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            Edit Section
                        </div>
                    )}
                    <div className="pb-2">
                        <h2 className="font-bold text-base mb-2 uppercase tracking-wide">C. Quarterly Monitoring Evaluation & Adjustment</h2>
                        <table className="w-full border-collapse text-[11px] border border-black table-fixed">
                            <thead>
                                <tr className="text-center font-bold bg-slate-100 print:bg-transparent">
                                    <th rowSpan="2" className="border border-black p-2 w-[22%]">Activity</th>
                                    <th colSpan="2" className="border border-black p-1">Target</th>
                                    <th colSpan="2" className="border border-black p-1">Accomplished</th>
                                    <th colSpan="2" className="border border-black p-1">Gap (%)</th>
                                    <th rowSpan="2" className="border border-black p-2 w-[22%]">Actions</th>
                                </tr>
                                <tr className="text-center font-bold bg-slate-100 print:bg-transparent">
                                    <th className="border border-black p-1 w-[8%]">Phys</th>
                                    <th className="border border-black p-1 w-[8%]">Fin</th>
                                    <th className="border border-black p-1 w-[8%]">Phys</th>
                                    <th className="border border-black p-1 w-[8%]">Fin</th>
                                    <th className="border border-black p-1 w-[8%]">Phys</th>
                                    <th className="border border-black p-1 w-[8%]">Fin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.map((act) => {
                                    const physGap = calculateGap(act.physTarget, act.physAcc);
                                    const finGap = calculateGap(act.finTarget, act.finAcc);
                                    return (
                                        <tr key={act.id}>
                                            <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.name}</td>
                                            <td className="border border-black p-1 text-center align-top">{act.physTarget}</td>
                                            <td className="border border-black p-1 text-center align-top">{act.finTarget}</td>
                                            <td className="border border-black p-1 text-center align-top">{act.physAcc}</td>
                                            <td className="border border-black p-1 text-center align-top">{act.finAcc}</td>
                                            <td className="border border-black p-1 text-center font-bold align-top" style={{ color: physGap < 0 ? 'red' : 'inherit' }}>{physGap.toFixed(2)}%</td>
                                            <td className="border border-black p-1 text-center font-bold align-top" style={{ color: finGap < 0 ? 'red' : 'inherit' }}>{finGap.toFixed(2)}%</td>
                                            <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.actions}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Print Section D */}
                <div 
                    onClick={() => editSection(3)} 
                    className={`mb-4 page-break-inside-avoid relative group rounded-xl p-4 -mx-4 transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none print-reset ${appMode === 'wizard' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                    {appMode === 'wizard' && (
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md print:hidden flex items-center gap-1.5 z-10 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            Edit Section
                        </div>
                    )}
                    <div>
                        <h2 className="font-bold text-base mb-2 uppercase tracking-wide">D. Facilitating and Hindering Factors</h2>
                        <div className="border border-black text-xs">
                            <div className="grid grid-cols-2 font-bold text-center border-b border-black bg-slate-100 print:bg-transparent">
                                <div className="p-2 border-r border-black">Facilitating Factors</div>
                                <div className="p-2">Hindering Factors</div>
                            </div>
                            {FACTOR_TYPES.map((type, idx) => (
                                <div key={type} className={`grid grid-cols-2 ${idx !== FACTOR_TYPES.length - 1 ? 'border-b border-black' : ''}`}>
                                    <div className="p-2 border-r border-black relative pt-5 min-h-[40px]">
                                        <span className="text-[9px] font-bold uppercase text-slate-500 absolute top-1 left-2 tracking-widest print:text-black">{type}</span>
                                        <div className="whitespace-pre-wrap leading-tight">{factors[type].facilitating}</div>
                                    </div>
                                    <div className="p-2 relative pt-5 min-h-[40px]">
                                        <span className="text-[9px] font-bold uppercase text-slate-500 absolute top-1 left-2 tracking-widest print:text-black">{type}</span>
                                        <div className="whitespace-pre-wrap leading-tight">{factors[type].hindering}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Print Signatures */}
                <div 
                    onClick={() => editSection(4)} 
                    className={`page-break-inside-avoid relative group rounded-xl p-4 -mx-4 transition-colors print:hover:bg-transparent print:p-0 print:mx-0 print:rounded-none mt-4 mb-4 print-reset ${appMode === 'wizard' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                    {appMode === 'wizard' && (
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md print:hidden flex items-center gap-1.5 z-10 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            Edit Section
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-16 mt-8">
                        <div className="text-center">
                            <p className="text-sm text-left mb-8 font-medium">Prepared by:</p>
                            <div className="border-b border-black font-bold uppercase text-sm pb-1 min-h-[24px]">
                                {owner}
                            </div>
                            <p className="text-xs mt-1 font-medium">Program Owner</p>
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
                            Document Successfully Saved to Database!
                        </div>
                    ) : (
                        <h3 className="text-slate-800 font-bold text-xl mb-6">Ready to finalize your document?</h3>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        
                        <button 
                            type="button" 
                            onClick={handleConfirmSubmit} 
                            disabled={isSubmitted} 
                            className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-900 px-8 py-1 text-sm font-bold text-white transition-colors gap-3 hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
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
