import React, { useState, useEffect } from 'react';

/**
 * ViewModeSelector — 2-stage splash screen
 *  Stage 1: Select a program from the available list
 *  Stage 2: Choose form workflow (Wizard or Full Form)
 *
 * Props:
 *   programs      string[]  — list of program titles to display
 *   onStart       (mode, program) => void  — called when user picks mode
 *   hasDraft      bool      — whether a saved draft exists
 *   draftInfo     object    — { lastSaved } metadata
 *   draftProgram  string    — the program stored in the draft (used to badge)
 *   theme         "pink" | "blue"
 */
export const ViewModeSelector = ({
    programs = [],
    onStart,
    hasDraft = false,
    draftInfo = null,
    draftProgram = null,
    theme = "pink",
}) => {
    const [stage, setStage] = useState('program');
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');

    const c = {
        pink: {
            glow: "bg-pink-600/20",
            iconWrap: "bg-pink-50 border-pink-200 text-pink-600",
            draftWrap: "bg-pink-50 border-pink-200 text-pink-600",
            draftBadge: "bg-pink-100 text-pink-700 border-pink-200",
            selectedBadge: "bg-pink-100 text-pink-800 border-pink-200",
            searchFocus: "focus:ring-pink-300 focus:border-pink-400",
            cardDraft: "border-pink-300 bg-pink-50/60",
            cardHover: "hover:border-pink-200 hover:shadow-md",
            cardIconBase: "bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 border-pink-200 shadow-pink-100/50",
            cardIconHover: "group-hover:from-pink-500 group-hover:to-pink-600 group-hover:text-white group-hover:border-pink-500",
            modeBorder: "hover:border-pink-200",
            modeGlow: "bg-pink-50",
            modeTitleHover: "group-hover:text-pink-600",
            modeCta: "text-pink-600 bg-pink-50 group-hover:bg-pink-100",
        },
        blue: {
            glow: "bg-blue-600/20",
            iconWrap: "bg-blue-50 border-blue-200 text-blue-600",
            draftWrap: "bg-blue-50 border-blue-200 text-blue-600",
            draftBadge: "bg-blue-100 text-blue-700 border-blue-200",
            selectedBadge: "bg-blue-100 text-blue-800 border-blue-200",
            searchFocus: "focus:ring-blue-300 focus:border-blue-400",
            cardDraft: "border-blue-300 bg-blue-50/60",
            cardHover: "hover:border-blue-200 hover:shadow-md",
            cardIconBase: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200 shadow-blue-100/50",
            cardIconHover: "group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white group-hover:border-blue-500",
            modeBorder: "hover:border-blue-200",
            modeGlow: "bg-blue-50",
            modeTitleHover: "group-hover:text-blue-600",
            modeCta: "text-blue-600 bg-blue-50 group-hover:bg-blue-100",
        },
    }[theme] || {};

    const filtered = search
        ? programs.filter(p => p.toLowerCase().includes(search.toLowerCase()))
        : programs;

    const handlePickProgram = (p) => {
        setSelected(p);
        setStage('mode');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Auto-select wizard on mobile when reaching mode stage
    useEffect(() => {
        if (stage === 'mode' && selected) {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onStart('wizard', selected);
            }
        }
    }, [stage, selected]);

    const Background = () => (
        <>
            <div className="fixed inset-0 bg-slate-50 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-100 pointer-events-none grayscale mix-blend-multiply"
                    style={{ backgroundImage: `url('/SDO_Facade.webp')`, backgroundSize: 'cover', backgroundPosition: 'center 25%' }}
                />
            </div>
            <div className={`fixed top-1/4 left-1/4 w-[30rem] h-[30rem] ${c.glow} rounded-full blur-[120px] pointer-events-none animate-pulse`} style={{ animationDuration: '4000ms' }} />
            <div className="fixed bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '4000ms', animationDelay: '2s' }} />
        </>
    );

    // ── STAGE 1: PROGRAM SELECTION ──────────────────────────────────────────
    if (stage === 'program') {
        return (
            <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
                <Background />
                <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center">
                    {/* Header */}
                    <div className="text-center mb-10 max-w-lg">
                        <div className={`inline-flex items-center justify-center p-3 rounded-2xl mb-5 shadow-inner border ${c.iconWrap}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 pb-2 mb-3">
                            Select Program
                        </h1>
                        <p className="text-slate-500 font-medium text-sm md:text-base">
                            {theme === 'blue'
                                ? 'Only programs with a submitted AIP are shown.'
                                : 'Choose the DepEd program this plan is aligned to.'}
                        </p>
                    </div>

                    {/* Search */}
                    {programs.length > 5 && (
                        <div className="w-full max-w-md mb-6">
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search programs…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className={`w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/90 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none shadow-sm ring-1 ring-transparent focus:ring-2 ${c.searchFocus} transition-all`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {programs.length === 0 ? (
                        <div className="bg-white/90 border border-slate-200 rounded-[2rem] p-10 text-center max-w-sm shadow-sm">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-700 mb-2">
                                {theme === 'blue' ? 'No AIPs submitted yet' : 'No programs available'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {theme === 'blue'
                                    ? 'Submit an Annual Implementation Plan first to unlock this form.'
                                    : 'No programs have been assigned to your account.'}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(p => (
                                <button
                                    key={p}
                                    onClick={() => handlePickProgram(p)}
                                    className={`group relative bg-white/90 border-2 rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97] shadow-sm ${c.cardHover} ${draftProgram === p ? c.cardDraft : 'border-slate-100'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border shadow-sm transition-all duration-300 group-hover:scale-110 ${c.cardIconBase} ${c.cardIconHover}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 leading-snug">{p}</p>
                                    {draftProgram === p && (
                                        <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${c.draftBadge}`}>
                                            Draft
                                        </span>
                                    )}
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <p className="col-span-full text-center py-8 text-sm text-slate-400 font-medium">
                                    No programs match "{search}"
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── STAGE 2: MODE SELECTION ─────────────────────────────────────────────
    const isDraftMatch = draftProgram && draftProgram === selected;

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
            <Background />
            <div className="relative z-10 container mx-auto px-6 flex flex-col items-center justify-center flex-1 py-12">
                <div className="max-w-2xl w-full">
                    {/* Back + Selected Program chip */}
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => setStage('program')}
                            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Change Program
                        </button>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border truncate max-w-[60%] ${c.selectedBadge}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                            <span className="truncate">{selected}</span>
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900 mb-2">
                            Choose Your Workflow
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Select how you'd like to complete your form.
                        </p>
                    </div>

                    {/* Draft banner */}
                    {hasDraft && draftInfo && isDraftMatch && (
                        <div className={`mb-6 p-4 border rounded-2xl flex items-center gap-3 ${c.draftWrap}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider mb-0.5">Draft Available</div>
                                <p className="text-xs text-slate-600">Last saved: {new Date(draftInfo.lastSaved).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {/* Mode cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Wizard */}
                        <button
                            onClick={() => onStart('wizard', selected)}
                            className={`group bg-white rounded-[2rem] border-2 border-slate-100 ${c.modeBorder} p-8 text-left transition-all duration-500 shadow-sm hover:shadow-xl active:scale-[0.98] overflow-hidden relative`}
                        >
                            <div className={`absolute top-0 right-0 w-48 h-48 ${c.modeGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-16 -mt-16`} />
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-md transition-all duration-500 group-hover:scale-110 ${c.cardIconBase} ${c.cardIconHover}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </div>
                            <h3 className={`text-2xl font-black text-slate-900 mb-2 transition-colors ${c.modeTitleHover}`}>Step-by-Step</h3>
                            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">Guided sections, one at a time. Great for first-timers.</p>
                            <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition-colors ${c.modeCta}`}>
                                <span>Start Wizard</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Full Form */}
                        <button
                            onClick={() => onStart('full', selected)}
                            className="group bg-white rounded-[2rem] border-2 border-slate-100 hover:border-slate-300 p-8 text-left transition-all duration-500 shadow-sm hover:shadow-xl active:scale-[0.98] overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-slate-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-16 -mt-16" />
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-md transition-all duration-500 group-hover:scale-110 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 border-slate-200 shadow-slate-100/50 group-hover:from-slate-200 group-hover:to-slate-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <line x1="3" x2="21" y1="9" y2="9" />
                                    <line x1="9" x2="9" y1="21" y2="9" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">Full Form</h3>
                            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">Classic paper-style layout, all sections visible at once.</p>
                            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                                <span>Open Form</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewModeSelector;
