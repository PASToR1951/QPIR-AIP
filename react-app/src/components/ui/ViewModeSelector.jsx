import React, { useState, useEffect, useMemo, useCallback } from 'react';

const THEME_CLASSES = {
    pink: {
        glow: "bg-pink-500/15",
        glowSecondary: "bg-violet-400/10",
        accent: "text-pink-600",
        selectedBadge: "bg-pink-50 text-pink-700 border-pink-200 ring-1 ring-pink-100",
        searchFocus: "focus:ring-pink-200 focus:border-pink-300",
        rowPendingHover: "hover:border-l-pink-400 hover:bg-pink-100/60",
        rowPendingHoverText: "group-hover:text-pink-900",
        cardPendingHover: "hover:border-pink-300 hover:bg-pink-50/70 hover:shadow-pink-100/40",
        modeBorder: "hover:border-pink-200 hover:shadow-pink-100/40",
        modeGlow: "bg-pink-50",
        modeTitleHover: "group-hover:text-pink-600",
        modeCta: "text-pink-600 bg-pink-50 group-hover:bg-pink-100",
        cardIconBase: "bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 border-pink-200",
        cardIconHover: "group-hover:from-pink-500 group-hover:to-pink-600 group-hover:text-white group-hover:border-pink-500",
        statsDone: "text-emerald-600",
        statsDraft: "text-amber-600",
        statsTotal: "text-slate-400",
        filterActive: "bg-pink-600 text-white border-pink-600 shadow-sm",
        filterInactive: "bg-white/70 dark:bg-dark-surface/70 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-pink-200 hover:text-pink-700 hover:bg-pink-50/50",
        ghostNum: "text-pink-500/[0.04]",
    },
    blue: {
        glow: "bg-blue-500/15",
        glowSecondary: "bg-cyan-400/10",
        accent: "text-blue-600",
        selectedBadge: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100",
        searchFocus: "focus:ring-blue-200 focus:border-blue-300",
        rowPendingHover: "hover:border-l-blue-400 hover:bg-blue-100/60",
        rowPendingHoverText: "group-hover:text-blue-900",
        cardPendingHover: "hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-blue-100/40",
        modeBorder: "hover:border-blue-200 hover:shadow-blue-100/40",
        modeGlow: "bg-blue-50",
        modeTitleHover: "group-hover:text-blue-600",
        modeCta: "text-blue-600 bg-blue-50 group-hover:bg-blue-100",
        cardIconBase: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200",
        cardIconHover: "group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white group-hover:border-blue-500",
        statsDone: "text-emerald-600",
        statsDraft: "text-amber-600",
        statsTotal: "text-slate-400",
        filterActive: "bg-blue-600 text-white border-blue-600 shadow-sm",
        filterInactive: "bg-white/70 dark:bg-dark-surface/70 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-blue-200 hover:text-blue-700 hover:bg-blue-50/50",
        ghostNum: "text-blue-500/[0.04]",
    },
};

/**
 * ViewModeSelector — 2-stage splash screen
 *  Stage 1: Select a program from the available list
 *  Stage 2: Choose form workflow (Wizard or Full Form)
 *
 * Props:
 *   programs          string[]  — list of program titles to display
 *   onStart           (mode, program) => void  — called when user picks mode
 *   hasDraft          bool      — whether a saved draft exists
 *   draftInfo         object    — { lastSaved } metadata
 *   draftProgram      string    — the program stored in the draft (shown with pencil badge)
 *   completedPrograms string[]  — programs already submitted (shown with checkmark)
 *   theme             "pink" | "blue"
 */
export const ViewModeSelector = ({
    programs: rawPrograms = [],
    onStart,
    hasDraft = false,
    draftInfo = null,
    draftProgram: rawDraftProgram = null,
    completedPrograms: rawCompletedPrograms = [],
    theme = "pink",
}) => {
    // ── SIMULATION: demo data shown when no real programs are passed ──────────
    const _DEMO = {
        programs: [
            'Alternative Learning System (ALS)',
            'Senior High School (SHS) Program',
            'Kindergarten Education Program',
            'Special Education (SPED)',
            'Basic Education Research Fund (BERF)',
        ],
        draftProgram: 'Senior High School (SHS) Program',
        completedPrograms: ['Alternative Learning System (ALS)', 'Basic Education Research Fund (BERF)'],
    };
    const _isDemo = rawPrograms.length === 0;
    const programs         = _isDemo ? _DEMO.programs          : rawPrograms;
    const draftProgram     = _isDemo ? _DEMO.draftProgram      : rawDraftProgram;
    const completedPrograms = _isDemo ? _DEMO.completedPrograms : rawCompletedPrograms;
    // ─────────────────────────────────────────────────────────────────────────
    const [stage, setStage] = useState('program');
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('status');

    const c = THEME_CLASSES[theme] || THEME_CLASSES.pink;

    const { submittedCount, draftCount, pendingCount } = useMemo(() => {
        const submittedCount = completedPrograms.filter(p => programs.includes(p)).length;
        const hasDraftInList = draftProgram && programs.includes(draftProgram);
        return { 
            submittedCount, 
            draftCount: hasDraftInList ? 1 : 0, 
            pendingCount: programs.length - submittedCount - (hasDraftInList ? 1 : 0) 
        };
    }, [completedPrograms, draftProgram, programs]);

    const sortedFiltered = useMemo(() => {
        const filtered = search
            ? programs.filter(p => p.toLowerCase().includes(search.toLowerCase()))
            : programs;

        const statusRank = p => {
            if (draftProgram === p) return 0;
            if (completedPrograms.includes(p)) return 1;
            return 2;
        };

        return filtered
            .filter(p => {
                if (sortFilter === 'done') return completedPrograms.includes(p);
                if (sortFilter === 'draft') return draftProgram === p;
                if (sortFilter === 'pending') return !completedPrograms.includes(p) && draftProgram !== p;
                return true;
            })
            .sort((a, b) => {
                if (sortOrder === 'status') return statusRank(a) - statusRank(b);
                if (sortOrder === 'za') return b.localeCompare(a);
                return a.localeCompare(b); // 'az' default
            });
    }, [search, sortFilter, sortOrder, programs, completedPrograms, draftProgram]);

    const handlePickProgram = useCallback((p) => {
        if (completedPrograms.includes(p)) {
            onStart('readonly', p);
            return;
        }
        setSelected(p);
        setStage('mode');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [completedPrograms, onStart]);

    useEffect(() => {
        if (stage === 'mode' && selected) {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onStart('wizard', selected);
            }
        }
    }, [stage, selected, onStart]);

    const Background = () => (
        <>
            <div className="fixed inset-0 bg-slate-50 dark:bg-dark-base bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-0">
                <div
                    className="absolute inset-0 pointer-events-none grayscale mix-blend-multiply opacity-60 backdrop-blur-none"
                    style={{ backgroundImage: `url('/SDO_Facade.webp')`, backgroundSize: 'cover', backgroundPosition: 'center 25%', filter: 'blur(3px)', transform: 'scale(1.05)' }}
                />
            </div>
            <div className={`fixed top-1/4 left-1/4 w-[36rem] h-[36rem] ${c.glow} rounded-full blur-[140px] pointer-events-none animate-pulse`} style={{ animationDuration: '5000ms' }} />
            <div className={`fixed bottom-1/3 right-1/4 w-[28rem] h-[28rem] ${c.glowSecondary} rounded-full blur-[120px] pointer-events-none animate-pulse`} style={{ animationDuration: '7000ms', animationDelay: '2s' }} />
        </>
    );

    // ── STAGE 1: PROGRAM SELECTION ──────────────────────────────────────────
    if (stage === 'program') {
        return (
            <div className="bg-slate-50 dark:bg-dark-base min-h-screen flex flex-col font-sans relative overflow-hidden">
                <Background />
                <div className="relative z-10 container mx-auto px-6 py-14 flex flex-col items-center">

                    {/* Header */}
                    <div className="text-center mb-9 max-w-md">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] mb-3 ${c.accent}`}>
                            {theme === 'blue' ? 'PIR Form' : 'AIP Form'}
                        </p>
                        <h1 className="text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight mb-3">
                            Select a Program
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            {theme === 'blue'
                                ? 'Only programs with a submitted AIP are available.'
                                : 'Choose the DepEd program this plan is aligned to.'}
                        </p>
                    </div>

                    {/* Search + Filter toolbar */}
                    {programs.length > 0 && (
                        <div className="w-full max-w-2xl mb-4 flex flex-col gap-2.5">
                            {/* Search */}
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search programs…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-sm ring-1 ring-transparent transition-all ${c.searchFocus}`}
                                />
                            </div>

                            {/* Filter tabs + Sort */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {[
                                        { key: 'all',     label: 'All',     count: programs.length },
                                        { key: 'done',    label: 'Done',    count: submittedCount },
                                        { key: 'draft',   label: 'Draft',   count: draftCount },
                                        { key: 'pending', label: 'Pending', count: pendingCount },
                                    ].map(({ key, label, count }) => (
                                        <button
                                            key={key}
                                            onClick={() => setSortFilter(key)}
                                            className={[
                                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150',
                                                sortFilter === key ? c.filterActive : c.filterInactive,
                                            ].join(' ')}
                                        >
                                            {label}
                                            <span className={[
                                                'text-[10px] font-black px-1 rounded',
                                                sortFilter === key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-400 dark:text-slate-500',
                                            ].join(' ')}>
                                                {count}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Sort order */}
                                <div className="relative shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <path d="M3 6h18M7 12h10M11 18h2" />
                                    </svg>
                                    <select
                                        value={sortOrder}
                                        onChange={e => setSortOrder(e.target.value)}
                                        className="appearance-none pl-7 pr-6 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface/70 text-xs font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-dark-border transition-colors"
                                    >
                                        <option value="az">A → Z</option>
                                        <option value="za">Z → A</option>
                                        <option value="status">By Status</option>
                                    </select>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {programs.length === 0 ? (
                        <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border border-slate-200/80 dark:border-dark-border rounded-2xl p-10 text-center max-w-sm shadow-sm">
                            <div className="w-11 h-11 bg-slate-100 dark:bg-dark-border rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm">
                                {theme === 'blue' ? 'No AIPs submitted yet' : 'No programs available'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {theme === 'blue'
                                    ? 'Submit an Annual Implementation Plan first to unlock this form.'
                                    : 'No programs have been assigned to your account.'}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl relative">
                            {/* Program cards */}
                            {sortedFiltered.length === 0 ? (
                                <div className="py-10 text-center">
                                    {search ? (
                                        <>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No programs match <span className="text-slate-500 dark:text-slate-400 font-semibold">&ldquo;{search}&rdquo;</span></p>
                                            <button onClick={() => setSearch('')} className="mt-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors">
                                                Clear search
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No {sortFilter} programs</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {sortedFiltered.map(p => {
                                        const isDraft = draftProgram === p;
                                        const isDone = completedPrograms.includes(p);

                                        return (
                                            <button
                                                key={p}
                                                onClick={() => handlePickProgram(p)}
                                                className={[
                                                    'group w-full flex flex-col gap-3 p-4 rounded-2xl text-left',
                                                    'border-2 transition-all duration-150 shadow-sm active:scale-[0.97]',
                                                    isDraft
                                                        ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 hover:border-amber-400 hover:shadow-amber-100/50'
                                                        : isDone
                                                            ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100/50'
                                                            : `border-slate-200/80 dark:border-dark-border bg-slate-100/60 dark:bg-dark-surface/60 backdrop-blur-sm shadow-sm ${c.cardPendingHover}`,
                                                ].join(' ')}
                                            >
                                                {/* Status badge — always visible at top */}
                                                <span className={`self-start text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                                    isDraft
                                                        ? 'text-amber-700 bg-amber-100 border-amber-300'
                                                        : isDone
                                                            ? 'text-emerald-700 bg-emerald-100 border-emerald-300'
                                                            : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-dark-border border-slate-200 dark:border-dark-border'
                                                }`}>
                                                    {isDraft ? 'Draft' : isDone ? 'Submitted' : 'Pending'}
                                                </span>

                                                {/* Program name */}
                                                <span className={`text-sm font-bold leading-snug transition-colors ${
                                                    isDraft ? 'text-amber-900 dark:text-amber-200' : isDone ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-100'
                                                }`}>
                                                    {p}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── STAGE 2: MODE SELECTION ─────────────────────────────────────────────
    const isDraftMatch = draftProgram && draftProgram === selected;
    const isCompleted = completedPrograms.includes(selected);

    return (
        <div className="bg-slate-50 dark:bg-dark-base min-h-screen flex flex-col font-sans relative overflow-hidden">
            <Background />
            <div className="relative z-10 container mx-auto px-6 flex flex-col items-center justify-center flex-1 py-10 md:py-16 lg:py-20">
                <div className="max-w-xl md:max-w-2xl lg:max-w-3xl w-full">

                    {/* Back link */}
                    <button
                        onClick={() => setStage('program')}
                        className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100/80 dark:bg-dark-surface/80 hover:bg-slate-200/80 dark:hover:bg-dark-border backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/60 dark:border-dark-border transition-all uppercase tracking-wider mb-6 md:mb-10 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        Programs
                    </button>

                    {/* Hero card — program context + heading */}
                    <div className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-slate-200/80 dark:border-dark-border shadow-sm p-6 md:p-8 lg:p-10 mb-5 md:mb-6">
                        <div className="flex items-start gap-4 lg:gap-5 mb-5 md:mb-6">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border shrink-0 ${c.cardIconBase}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1 md:mb-1.5">
                                    {theme === 'blue' ? 'Quarterly PIR' : 'Annual AIP'} for
                                </p>
                                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug break-words">
                                    {selected}
                                </h2>
                            </div>
                        </div>

                        {/* Draft banner — inline */}
                        {hasDraft && draftInfo && isDraftMatch && (
                            <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl md:rounded-2xl mb-5 md:mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
                                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                <p className="text-xs md:text-sm text-amber-700">
                                    <span className="font-bold">Draft saved</span>
                                    <span className="text-amber-600/70"> — {new Date(draftInfo.lastSaved).toLocaleString()}</span>
                                </p>
                            </div>
                        )}

                        {/* Divider + prompt */}
                        <div className="border-t border-slate-100 dark:border-dark-border pt-5 md:pt-6">
                            <p className="text-base md:text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">How would you like to work?</p>
                            <p className="text-sm md:text-base text-slate-400 dark:text-slate-500">Pick a layout that fits your style.</p>
                        </div>
                    </div>

                    {/* Mode cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                        {/* Wizard */}
                        <button
                            onClick={() => onStart('wizard', selected)}
                            className={`group bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-2xl lg:rounded-3xl border-2 border-slate-100 dark:border-dark-border ${c.modeBorder} p-6 md:p-7 lg:p-8 text-left transition-all duration-200 shadow-sm hover:shadow-lg active:scale-[0.97] overflow-hidden relative`}
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 lg:w-52 lg:h-52 ${c.modeGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -mr-12 -mt-12`} />

                            {/* Icon row */}
                            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 ${c.cardIconBase} ${c.cardIconHover} shadow-sm`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className={`text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 leading-none transition-colors ${c.modeTitleHover}`}>Step-by-Step</h3>
                                    <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium mt-1">Guided wizard</p>
                                </div>
                            </div>

                            {/* Feature list */}
                            <ul className="space-y-2 md:space-y-2.5 mb-6 md:mb-7">
                                {['One section at a time', 'Progress tracking', 'Great for first-timers'].map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" className={c.accent} />
                                        </svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <div className={`inline-flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors ${c.modeCta}`}>
                                <span>Start Wizard</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Full Form */}
                        <button
                            onClick={() => onStart('full', selected)}
                            className="group bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-2xl lg:rounded-3xl border-2 border-slate-100 dark:border-dark-border hover:border-slate-200 dark:hover:border-dark-border hover:shadow-lg p-6 md:p-7 lg:p-8 text-left transition-all duration-200 shadow-sm active:scale-[0.97] overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 lg:w-52 lg:h-52 bg-slate-100 dark:bg-dark-border rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -mr-12 -mt-12" />

                            {/* Icon row */}
                            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-border dark:to-dark-border text-slate-500 dark:text-slate-400 border-slate-200 dark:border-dark-border group-hover:from-slate-100 group-hover:to-slate-200 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                        <line x1="3" x2="21" y1="9" y2="9" />
                                        <line x1="9" x2="9" y1="21" y2="9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 leading-none group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Full Form</h3>
                                    <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium mt-1">Classic layout</p>
                                </div>
                            </div>

                            {/* Feature list */}
                            <ul className="space-y-2 md:space-y-2.5 mb-6 md:mb-7">
                                {['All sections at once', 'Quick scroll navigation', 'Familiar paper layout'].map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" className="text-slate-400 dark:text-slate-500" />
                                        </svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <div className="inline-flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-dark-border transition-colors">
                                <span>Open Form</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
