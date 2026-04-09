import React, { useRef, useEffect } from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';

export default React.memo(function AIPGoalsTargetsSection({
    appMode,
    objectives, handleObjectiveChange, addObjective, removeObjective,
    indicators, handleIndicatorChange, addIndicator, removeIndicator
}) {
    const objectiveRefs = useRef([]);
    const indicatorRefs = useRef([]);

    useEffect(() => {
        objectiveRefs.current[objectives.length - 1]?.focus();
    }, [objectives.length]);

    useEffect(() => {
        indicatorRefs.current[indicators.length - 1]?.focus();
    }, [indicators.length]);

    return (
        <>
            <SectionHeader
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>}
                title="Goals & Targets"
                subtitle="Establish the objectives and specific performance indicators."
                theme="pink"
                appMode={appMode}
            />
            <div className="space-y-8">
                {/* Objectives - Dynamic List */}
                <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border p-6 rounded-2xl">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none mb-3 block">Objective/s</label>
                    <div className="space-y-3">
                        {objectives.map((obj, i) => (
                            <div key={i} className="flex gap-3 items-start bg-white dark:bg-dark-surface p-3 rounded-xl border border-slate-200 dark:border-dark-border group transition-all hover:border-pink-300">
                                <div className="mt-2.5 text-slate-400 dark:text-slate-500 font-bold w-6 text-center text-sm select-none">{i + 1}.</div>
                                <TextareaAuto
                                    ref={el => objectiveRefs.current[i] = el}
                                    className="w-full bg-transparent p-2 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg text-sm text-slate-800 dark:text-slate-100 transition-all"
                                    placeholder={`Enter objective ${i + 1}...`}
                                    value={obj}
                                    onChange={(e) => handleObjectiveChange(i, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleObjectiveChange(i, e.target.value);
                                            addObjective();
                                        }
                                    }}
                                />
                                {objectives.length > 1 && (
                                    <button type="button" onClick={() => removeObjective(i)} className="mt-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/30" title="Remove Objective">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addObjective} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-dark-border rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all flex items-center justify-center gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Objective
                        </button>
                    </div>
                </div>

                {/* Indicators - Dynamic List with Per-Item Targets */}
                <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border p-6 rounded-2xl">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none mb-3 block">Performance Indicator/s (OVI)</label>
                    <div className="space-y-4">
                        {indicators.map((ind, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-4 bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border group transition-all hover:border-pink-300 relative">
                                <div className="absolute -left-3 -top-3 bg-pink-100 text-pink-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-dark-surface shadow-sm">
                                    {i + 1}
                                </div>
                                <div className="flex-grow">
                                    <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Indicator Description</label>
                                    <TextareaAuto
                                        ref={el => indicatorRefs.current[i] = el}
                                        className="w-full bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 transition-all"
                                        placeholder="e.g. Percentage of teachers..."
                                        value={ind.description}
                                        onChange={(e) => handleIndicatorChange(i, 'description', e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleIndicatorChange(i, 'description', e.target.value);
                                                addIndicator();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="w-full md:w-48 shrink-0">
                                    <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Annual Target</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className="w-full bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg px-3 py-2 pr-7 text-sm text-slate-800 dark:text-slate-100 transition-all outline-none"
                                            placeholder="0"
                                            value={ind.target}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9.]/g, '');
                                                const num = parseFloat(raw);
                                                if (!isNaN(num) && num > 100) {
                                                    handleIndicatorChange(i, 'target', '100');
                                                } else {
                                                    handleIndicatorChange(i, 'target', raw);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addIndicator();
                                                }
                                            }}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none select-none">%</span>
                                    </div>
                                </div>
                                {indicators.length > 1 && (
                                    <div className="flex items-end pb-1">
                                        <button type="button" onClick={() => removeIndicator(i)} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/30" title="Remove Indicator">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addIndicator} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-dark-border rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all flex items-center justify-center gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Indicator
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
})
