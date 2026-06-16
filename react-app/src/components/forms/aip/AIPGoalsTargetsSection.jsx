import React, { useEffect, useRef } from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';
import { useFormShellContext } from '../../../forms/shared/formShellContext.jsx';
import { selectAipIndicators, selectAipObjectives, useAipDispatch, useAipSelector } from '../../../forms/aip/aipContext.jsx';

export default React.memo(function AIPGoalsTargetsSection() {
    const { appMode } = useFormShellContext();
    const dispatch = useAipDispatch();
    const objectives = useAipSelector(selectAipObjectives);
    const indicators = useAipSelector(selectAipIndicators);
    const metrics = useAipSelector((state) => state.metrics);
    const objectiveRefs = useRef([]);
    const indicatorRefs = useRef([]);
    const metricFields = [
        { field: 'kpis', label: 'KPIs' },
        { field: 'baseline', label: 'Baseline' },
        { field: 'quarterlyTarget', label: 'Target' },
    ];

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
                <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border p-6 rounded-2xl">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none mb-3 block">Objective/s</label>
                    <div className="space-y-3">
                        {objectives.map((objective, index) => (
                            <div key={index} className="flex gap-3 items-start bg-white dark:bg-dark-surface p-3 rounded-xl border border-slate-200 dark:border-dark-border group transition-all hover:border-pink-300">
                                <div className="mt-2.5 text-slate-400 dark:text-slate-500 font-bold w-6 text-center text-sm select-none">{index + 1}.</div>
                                <TextareaAuto
                                    ref={(element) => {
                                        objectiveRefs.current[index] = element;
                                    }}
                                    className="w-full bg-transparent p-2 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg text-sm text-slate-800 dark:text-slate-100 transition-all"
                                    placeholder={`Enter objective ${index + 1}...`}
                                    value={objective}
                                    onChange={(event) => dispatch({ type: 'SET_OBJECTIVE', payload: { index, value: event.target.value } })}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            dispatch({ type: 'SET_OBJECTIVE', payload: { index, value: event.target.value } });
                                            dispatch({ type: 'ADD_OBJECTIVE' });
                                        }
                                    }}
                                />
                                {objectives.length > 1 && (
                                    <button type="button" onClick={() => dispatch({ type: 'REMOVE_OBJECTIVE', payload: { index } })} className="mt-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/30" title="Remove Objective">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => dispatch({ type: 'ADD_OBJECTIVE' })} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-dark-border rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all flex items-center justify-center gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Objective
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border p-6 rounded-2xl">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none mb-3 block">Performance Indicator/s (OVI)</label>
                    <div className="space-y-4">
                        {indicators.map((indicator, index) => {
                            const isEmpty = !indicator.description.trim() && !indicator.target.trim();
                            return (
                            <div key={index} className="flex flex-col gap-4 bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border group transition-all hover:border-pink-300 relative">
                                <div className="absolute -left-3 -top-3 bg-pink-100 text-pink-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-dark-surface shadow-sm">
                                    {index + 1}
                                </div>
                                {/* Action buttons — top right */}
                                <div className="absolute -top-2.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: 'DUPLICATE_INDICATOR', payload: { index } })}
                                        disabled={isEmpty}
                                        className={`flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm transition-colors ${
                                            isEmpty
                                                ? 'bg-slate-100 dark:bg-dark-border border-slate-200 dark:border-dark-border text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-300 dark:hover:bg-blue-950/30'
                                        }`}
                                        title={isEmpty ? 'Fill in the indicator to duplicate' : 'Duplicate Indicator'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    </button>
                                    {indicators.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => dispatch({ type: 'REMOVE_INDICATOR', payload: { index } })}
                                            className="flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-300 dark:hover:bg-red-950/30"
                                            title="Delete Indicator"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-grow">
                                        <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Indicator Description</label>
                                        <TextareaAuto
                                            ref={(element) => {
                                                indicatorRefs.current[index] = element;
                                            }}
                                            className="w-full bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 transition-all"
                                            placeholder="e.g. Percentage of teachers..."
                                            value={indicator.description}
                                            onChange={(event) => dispatch({ type: 'SET_INDICATOR', payload: { index, field: 'description', value: event.target.value } })}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' && !event.shiftKey) {
                                                    event.preventDefault();
                                                    dispatch({ type: 'SET_INDICATOR', payload: { index, field: 'description', value: event.target.value } });
                                                    dispatch({ type: 'ADD_INDICATOR' });
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
                                                value={indicator.target}
                                                onChange={(event) => {
                                                    const raw = event.target.value.replace(/[^0-9.]/g, '');
                                                    const numericValue = parseFloat(raw);
                                                    const nextValue = !Number.isNaN(numericValue) && numericValue > 100 ? '100' : raw;
                                                    dispatch({ type: 'SET_INDICATOR', payload: { index, field: 'target', value: nextValue } });
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        dispatch({ type: 'ADD_INDICATOR' });
                                                    }
                                                }}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none select-none">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                        <button type="button" onClick={() => dispatch({ type: 'ADD_INDICATOR' })} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-dark-border rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all flex items-center justify-center gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Indicator
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border p-6 rounded-2xl">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none mb-3 block">KPI Metrics</label>
                    <div className="grid gap-4 md:grid-cols-3">
                        {metricFields.map(({ field, label }) => (
                            <div key={field}>
                                <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 transition-all outline-none"
                                    placeholder="0"
                                    value={metrics[field]}
                                    onChange={(event) => dispatch({
                                        type: 'SET_METRIC',
                                        payload: {
                                            field,
                                            value: event.target.value.replace(/\D/g, ''),
                                        },
                                    })}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
})
