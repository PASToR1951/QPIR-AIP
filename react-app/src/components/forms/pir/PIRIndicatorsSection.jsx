import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';
import { useFormShellContext } from '../../../forms/shared/formShellContext.jsx';
import { selectIndicatorTargets, usePirDispatch, usePirSelector } from '../../../forms/pir/pirContext.jsx';
import { getProjectTerminology } from '../../../lib/projectTerminology.js';

export default React.memo(function PIRIndicatorsSection({ usesSchoolTerminology = true }) {
    const { appMode, currentStep } = useFormShellContext();
    const dispatch = usePirDispatch();
    const indicatorTargets = usePirSelector(selectIndicatorTargets);
    const projectTerminology = getProjectTerminology(usesSchoolTerminology);

    if (appMode !== 'full' && currentStep !== 2) return null;

    const handleChange = (index, value) => {
        dispatch({ type: 'UPDATE_INDICATOR_TARGET', payload: { index, value } });
    };

    return (
        <div className={`${(appMode === 'full' || currentStep === 2) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
            {appMode === 'wizard' && (
                <SectionHeader
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
                    title="Performance Indicators"
                    subtitle="Review AIP indicators and set quarterly targets for this reporting period."
                    theme="blue"
                    appMode={appMode}
                />
            )}

            {appMode === 'full' && (
                <div className="mb-6 flex items-center gap-3 border-b border-slate-200 dark:border-dark-border pb-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-100 dark:border-blue-900 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">B. Performance Indicators</h2>
                </div>
            )}

            {indicatorTargets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-dark-base border border-dashed border-slate-200 dark:border-dark-border rounded-3xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 mb-3"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No performance indicators found for this AIP.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You may continue to the next section.</p>
                </div>
            ) : (
                <>
                <div className="space-y-4 md:hidden">
                    {indicatorTargets.map((ind, i) => (
                        <div key={i} className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-4 shadow-sm">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Indicator {i + 1}</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ind.description}</p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-dark-base dark:text-slate-300">
                                    Annual: {ind.annual_target ? `${ind.annual_target}%` : '—%'}
                                </span>
                            </div>

                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                This Quarter's Target
                            </label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 px-3 py-3 focus-within:border-blue-300 focus-within:bg-blue-50/40 dark:bg-dark-base dark:focus-within:bg-blue-950/10">
                                <TextareaAuto
                                    className="min-h-[40px] flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none dark:text-slate-100"
                                    placeholder="Enter quarterly target..."
                                    value={ind.quarterly_target}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                />
                                <span className="shrink-0 text-sm font-bold text-slate-400 dark:text-slate-500">%</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm overflow-hidden min-w-[600px]">
                        <div className="grid grid-cols-[1fr_140px_180px] bg-slate-50 dark:bg-dark-base border-b border-slate-200 dark:border-dark-border">
                            <div className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-dark-border">
                                Annual Performance Indicator
                                <span className="block text-[10px] font-normal normal-case tracking-normal text-slate-400 mt-0.5">
                                    Refer to the {projectTerminology.aipReferenceLabel}
                                </span>
                            </div>
                            <div className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center border-r border-slate-200 dark:border-dark-border">Annual Target</div>
                            <div className="p-3 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-center">
                                This Quarter's Target
                                <span className="block text-[10px] font-semibold text-blue-400 normal-case tracking-normal mt-0.5">Fill in below</span>
                            </div>
                        </div>

                        {indicatorTargets.map((ind, i) => (
                            <div key={i} className={`grid grid-cols-[1fr_140px_180px] ${i !== indicatorTargets.length - 1 ? 'border-b border-slate-200 dark:border-dark-border' : ''}`}>
                                <div className="p-4 text-sm text-slate-700 dark:text-slate-200 font-medium border-r border-slate-200 dark:border-dark-border">
                                    {ind.description}
                                </div>
                                <div className="p-4 text-sm text-slate-600 dark:text-slate-300 text-center font-mono border-r border-slate-200 dark:border-dark-border flex items-center justify-center">
                                    {ind.annual_target ? `${ind.annual_target}%` : '—%'}
                                </div>
                                <div className="p-3 focus-within:bg-blue-50/40 dark:focus-within:bg-blue-950/10 transition-colors">
                                    <div className="flex items-center gap-1">
                                        <TextareaAuto
                                            className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent outline-none min-h-[40px] placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                            placeholder="Enter quarterly target..."
                                            value={ind.quarterly_target}
                                            onChange={(e) => handleChange(i, e.target.value)}
                                        />
                                        <span className="text-sm font-bold text-slate-400 dark:text-slate-500 shrink-0">%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}
        </div>
    );
});
