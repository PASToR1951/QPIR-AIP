import React, { useState, useEffect } from 'react';

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
    programs = [],
    onStart,
    hasDraft = false,
    draftInfo = null,
    draftProgram = null,
    completedPrograms = [],
    theme = "pink",
}) => {
    const [stage, setStage] = useState('program');
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('az');

    const c = {
        pink: {
            glow: "bg-pink-500/15",
            glowSecondary: "bg-violet-400/10",
            accent: "text-pink-600",
            selectedBadge: "bg-pink-50 text-pink-700 border-pink-200 ring-1 ring-pink-100",
            searchFocus: "focus:ring-pink-200 focus:border-pink-300",
            rowPendingHover: "hover:border-l-pink-300 hover:bg-pink-50/30",
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
            filterInactive: "bg-white/70 text-slate-500 border-slate-200 hover:border-pink-200 hover:text-pink-700 hover:bg-pink-50/50",
            ghostNum: "text-pink-500/[0.04]",
        },
        blue: {
            glow: "bg-blue-500/15",
            glowSecondary: "bg-cyan-400/10",
            accent: "text-blue-600",
            selectedBadge: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100",
            searchFocus: "focus:ring-blue-200 focus:border-blue-300",
            rowPendingHover: "hover:border-l-blue-300 hover:bg-blue-50/30",
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
            filterInactive: "bg-white/70 text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-700 hover:bg-blue-50/50",
            ghostNum: "text-blue-500/[0.04]",
        },
    }[theme] || {};

    const filtered = search
        ? programs.filter(p => p.toLowerCase().includes(search.toLowerCase()))
        : programs;

    const submittedCount = completedPrograms.filter(p => programs.includes(p)).length;
    const hasDraftInList = draftProgram && programs.includes(draftProgram);
    const draftCount = hasDraftInList ? 1 : 0;
    const pendingCount = programs.length - submittedCount - draftCount;

    const statusRank = p => {
        if (completedPrograms.includes(p)) return 0;
        if (draftProgram === p) return 1;
        return 2;
    };

    const sortedFiltered = filtered
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

    const handlePickProgram = (p) => {
        setSelected(p);
        setStage('mode');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                    className="absolute inset-0 pointer-events-none grayscale mix-blend-multiply opacity-60"
                    style={{ backgroundImage: `url('/SDO_Facade.webp')`, backgroundSize: 'cover', backgroundPosition: 'center 25%' }}
                />
            </div>
            <div className={`fixed top-1/4 left-1/4 w-[36rem] h-[36rem] ${c.glow} rounded-full blur-[140px] pointer-events-none animate-pulse`} style={{ animationDuration: '5000ms' }} />
            <div className={`fixed bottom-1/3 right-1/4 w-[28rem] h-[28rem] ${c.glowSecondary} rounded-full blur-[120px] pointer-events-none animate-pulse`} style={{ animationDuration: '7000ms', animationDelay: '2s' }} />
        </>
    );

    // ── STAGE 1: PROGRAM SELECTION ──────────────────────────────────────────
    if (stage === 'program') {
        return (
            <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
                <Background />
                <div className="relative z-10 container mx-auto px-6 py-14 flex flex-col items-center">

                    {/* Header */}
                    <div className="text-center mb-9 max-w-md">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] mb-3 ${c.accent}`}>
                            {theme === 'blue' ? 'PIR Form' : 'AIP Form'}
                        </p>
                        <h1 className="text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
                            Select a Program
                        </h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            {theme === 'blue'
                                ? 'Only programs with a submitted AIP are available.'
                                : 'Choose the DepEd program this plan is aligned to.'}
                        </p>
                    </div>

                    {/* Search + Filter toolbar */}
                    {programs.length > 0 && (
                        <div className="w-full max-w-xl mb-4 flex flex-col gap-2.5">
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
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-sm text-slate-700 placeholder:text-slate-400 outline-none shadow-sm ring-1 ring-transparent transition-all ${c.searchFocus}`}
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
                                                sortFilter === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400',
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
                                        className="appearance-none pl-7 pr-6 py-1.5 rounded-lg border border-slate-200 bg-white/70 text-xs font-semibold text-slate-500 outline-none cursor-pointer hover:border-slate-300 transition-colors"
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
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-10 text-center max-w-sm shadow-sm">
                            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-700 mb-1.5 text-sm">
                                {theme === 'blue' ? 'No AIPs submitted yet' : 'No programs available'}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {theme === 'blue'
                                    ? 'Submit an Annual Implementation Plan first to unlock this form.'
                                    : 'No programs have been assigned to your account.'}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full max-w-xl relative">
                            {/* Ghost count watermark */}
                            <div className="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none overflow-hidden rounded-2xl">
                                <span className={`text-[11rem] font-black leading-none select-none ${c.ghostNum}`}>
                                    {programs.length}
                                </span>
                            </div>

                            {/* Program list */}
                            <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                                {sortedFiltered.map(p => {
                                    const isDraft = draftProgram === p;
                                    const isDone = completedPrograms.includes(p);

                                    return (
                                        <button
                                            key={p}
                                            onClick={() => handlePickProgram(p)}
                                            className={[
                                                'group w-full flex items-center gap-3.5 px-5 py-4 text-left',
                                                'border-l-[3px] transition-all duration-150',
                                                isDraft
                                                    ? 'border-l-amber-400 bg-amber-50/60 hover:bg-amber-50'
                                                    : isDone
                                                        ? 'border-l-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/50'
                                                        : `border-l-transparent ${c.rowPendingHover}`,
                                                'active:scale-[0.995]',
                                            ].join(' ')}
                                        >
                                            {/* Status indicator */}
                                            <div className="shrink-0">
                                                {isDone ? (
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 ring-1 ring-emerald-200 flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                                            <path d="M20 6 9 17l-5-5" />
                                                        </svg>
                                                    </div>
                                                ) : isDraft ? (
                                                    <div className="w-6 h-6 rounded-full bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6" />
                                                )}
                                            </div>

                                            {/* Program name */}
                                            <span className="flex-1 text-sm font-semibold text-slate-700 group-hover:text-slate-900 leading-snug transition-colors">
                                                {p}
                                            </span>

                                            {/* Right: badge + chevron */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isDraft && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                                        Draft
                                                    </span>
                                                )}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-slate-400 transition-colors -mr-0.5">
                                                    <path d="m9 18 6-6-6-6" />
                                                </svg>
                                            </div>
                                        </button>
                                    );
                                })}

                                {sortedFiltered.length === 0 && (
                                    <div className="py-10 text-center">
                                        {search ? (
                                            <>
                                                <p className="text-sm text-slate-400 font-medium">No programs match <span className="text-slate-500 font-semibold">&ldquo;{search}&rdquo;</span></p>
                                                <button onClick={() => setSearch('')} className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors">
                                                    Clear search
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-sm text-slate-400 font-medium">No {sortFilter} programs</p>
                                        )}
                                    </div>
                                )}
                            </div>
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
        <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
            <Background />
            <div className="relative z-10 container mx-auto px-6 flex flex-col items-center justify-center flex-1 py-14">
                <div className="max-w-2xl w-full">

                    {/* Back + selected chip */}
                    <div className="flex items-center justify-between mb-10">
                        <button
                            onClick={() => setStage('program')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Back
                        </button>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border truncate max-w-[65%] shadow-sm ${c.selectedBadge}`}>
                            {isCompleted && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-500">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            )}
                            {isDraftMatch && !isCompleted && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500">
                                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            )}
                            <span className="truncate">{selected}</span>
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                            Choose Your Workflow
                        </h1>
                        <p className="text-slate-400 text-sm">
                            How would you like to fill out this form?
                        </p>
                    </div>

                    {/* Draft banner */}
                    {hasDraft && draftInfo && isDraftMatch && (
                        <div className="mb-6 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3.5 shadow-sm">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-0.5">Draft Available</p>
                                <p className="text-xs text-amber-600/80">Last saved {new Date(draftInfo.lastSaved).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {/* Mode cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Wizard */}
                        <button
                            onClick={() => onStart('wizard', selected)}
                            className={`group bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-slate-100 ${c.modeBorder} p-7 text-left transition-all duration-300 shadow-sm hover:shadow-lg active:scale-[0.98] overflow-hidden relative`}
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 ${c.modeGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -mr-12 -mt-12`} />
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border transition-all duration-300 group-hover:scale-105 ${c.cardIconBase} ${c.cardIconHover} shadow-sm`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </div>
                            <h3 className={`text-xl font-black text-slate-900 mb-1.5 transition-colors ${c.modeTitleHover}`}>Step-by-Step</h3>
                            <p className="text-xs font-medium text-slate-400 mb-5 leading-relaxed">Guided sections one at a time. Great for first-timers.</p>
                            <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-colors ${c.modeCta}`}>
                                <span>Start Wizard</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Full Form */}
                        <button
                            onClick={() => onStart('full', selected)}
                            className="group bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:shadow-lg p-7 text-left transition-all duration-300 shadow-sm active:scale-[0.98] overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-100 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -mr-12 -mt-12" />
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500 border-slate-200 group-hover:from-slate-100 group-hover:to-slate-200 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <line x1="3" x2="21" y1="9" y2="9" />
                                    <line x1="9" x2="9" y1="21" y2="9" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-1.5 group-hover:text-slate-700 transition-colors">Full Form</h3>
                            <p className="text-xs font-medium text-slate-400 mb-5 leading-relaxed">All sections visible at once. Familiar paper-style layout.</p>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-slate-200 transition-colors">
                                <span>Open Form</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
