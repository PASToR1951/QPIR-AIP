import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';

export default React.memo(function AIPGoalsTargetsSection({
    appMode,
    objectives, handleObjectiveChange, addObjective, removeObjective,
    indicators, handleIndicatorChange, addIndicator, removeIndicator
}) {
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
                                    className="w-full bg-transparent p-2 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg text-sm text-slate-800 dark:text-slate-100 transition-all"
                                    placeholder={`Enter objective ${i + 1}...`}
                                    value={obj}
                                    onChange={(e) => handleObjectiveChange(i, e.target.value)}
                                />
                                {objectives.length > 1 && (
                                    <button type="button" onClick={() => removeObjective(i)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors mt-1" title="Remove Objective">
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
                                        className="w-full bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 transition-all"
                                        placeholder="e.g. Percentage of teachers..."
                                        value={ind.description}
                                        onChange={(e) => handleIndicatorChange(i, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-48 shrink-0">
                                    <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Annual Target</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 transition-all outline-none"
                                        placeholder="e.g. 100%"
                                        value={ind.target}
                                        onChange={(e) => handleIndicatorChange(i, 'target', e.target.value)}
                                    />
                                </div>
                                {indicators.length > 1 && (
                                    <div className="flex items-end pb-1">
                                        <button type="button" onClick={() => removeIndicator(i)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" title="Remove Indicator">
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
