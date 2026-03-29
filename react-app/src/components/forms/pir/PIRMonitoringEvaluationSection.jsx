import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';

export default React.memo(function PIRMonitoringEvaluationSection({
    appMode,
    currentStep,
    isLoadingActivities,
    activities,
    expandedActivityId, setExpandedActivityId,
    calculateGap,
    handleRemoveActivity,
    handleActivityChange,
    handleAddActivity,
    handleAddUnplannedActivity,
    isAddingActivity
}) {
    if (appMode !== 'full' && currentStep !== 3) return null;

    const renderActivityCard = (act, index) => {
        const physGap = calculateGap(act.physTarget, act.physAcc);
        const finGap = calculateGap(act.finTarget, act.finAcc);
        const isExpanded = expandedActivityId === act.id;

        if (!isExpanded) {
            return (
                <div
                    key={act.id}
                    onClick={() => setExpandedActivityId(act.id)}
                    className="relative group bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-colors cursor-pointer flex items-center justify-between"
                >
                    <div className="flex items-center gap-4 overflow-hidden pr-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <span className="font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {act.name || <span className="text-slate-400 dark:text-slate-500 italic font-normal">Untitled Activity...</span>}
                            </span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                                {act.implementation_period && (
                                    <span className="flex items-center gap-1 whitespace-nowrap text-blue-500 normal-case font-semibold tracking-normal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        {act.implementation_period}
                                    </span>
                                )}
                                {act.implementation_period && <span className="text-slate-300 dark:text-slate-600 hidden sm:block">|</span>}
                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                    Physical Gap: <span className={physGap < 0 ? 'text-red-500' : 'text-emerald-500'}>{physGap.toFixed(2)}%</span>
                                </span>
                                <span className="text-slate-300 dark:text-slate-600 hidden sm:block">|</span>
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
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                        )}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>
            );
        }

        // EXPANDED CARD
        return (
            <div key={act.id} className="relative group bg-white dark:bg-dark-surface border-2 border-blue-200 dark:border-dark-border rounded-3xl shadow-md overflow-hidden ring-4 ring-blue-50 dark:ring-blue-950/20">
                <div
                    onClick={() => setExpandedActivityId(null)}
                    className="flex items-center justify-between p-5 md:px-8 bg-slate-50/80 dark:bg-dark-base/80 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors border-b border-slate-100 dark:border-dark-border cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                            <span className="font-bold text-xs">{index + 1}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Editing Activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {activities.length > 1 && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveActivity(act.id); }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Remove Activity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        )}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 bg-blue-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Activity Name / Description</label>
                            {act.fromAIP && act.implementation_period && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 px-2.5 py-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    {act.implementation_period}
                                </span>
                            )}
                        </div>
                        {act.fromAIP ? (
                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 py-1 border-b border-slate-200 dark:border-dark-border">
                                {act.name}
                            </p>
                        ) : (
                            <TextareaAuto
                                placeholder="Describe the activity here..."
                                className="w-full text-lg font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 border-b border-transparent focus:border-blue-500 transition-colors py-1"
                                value={act.name}
                                onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)}
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-dark-base p-5 rounded-2xl border border-slate-200 dark:border-dark-border">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Physical Targets
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-3 shadow-sm focus-within:border-blue-300 transition-colors group/input">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 group-focus-within/input:text-blue-600">Target</label>
                                    <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800 dark:text-slate-100" placeholder="0" value={act.physTarget} onChange={(e) => handleActivityChange(act.id, 'physTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                </div>
                                <div className="bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-3 shadow-sm focus-within:border-blue-300 transition-colors group/input">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 group-focus-within/input:text-blue-600">Accomplished</label>
                                    <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800 dark:text-slate-100" placeholder="0" value={act.physAcc} onChange={(e) => handleActivityChange(act.id, 'physAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                </div>
                            </div>
                            <div className={`flex justify-between items-center px-4 py-2.5 rounded-xl border ${physGap < 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-100' : 'bg-slate-100 dark:bg-dark-border border-slate-200 dark:border-dark-border'}`}>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Physical Gap</span>
                                <span className={`font-mono text-sm font-bold ${physGap < 0 ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>{physGap.toFixed(2)}%</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 relative">
                            <div className="hidden md:block absolute -left-3 top-2 bottom-2 w-px bg-slate-200 dark:bg-dark-border"></div>
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Financial Targets
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-3 shadow-sm focus-within:border-emerald-300 transition-colors group/input">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 group-focus-within/input:text-emerald-600">Target</label>
                                    <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800 dark:text-slate-100" placeholder="0" value={act.finTarget} onChange={(e) => handleActivityChange(act.id, 'finTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                </div>
                                <div className="bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-3 shadow-sm focus-within:border-emerald-300 transition-colors group/input">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 group-focus-within/input:text-emerald-600">Accomplished</label>
                                    <input type="number" inputMode="decimal" className="w-full bg-transparent outline-none font-mono text-base font-semibold text-slate-800 dark:text-slate-100" placeholder="0" value={act.finAcc} onChange={(e) => handleActivityChange(act.id, 'finAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                </div>
                            </div>
                            <div className={`flex justify-between items-center px-4 py-2.5 rounded-xl border ${finGap < 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-100' : 'bg-slate-100 dark:bg-dark-border border-slate-200 dark:border-dark-border'}`}>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Financial Gap</span>
                                <span className={`font-mono text-sm font-bold ${finGap < 0 ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>{finGap.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-colors">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                            Actions to Address Gap
                        </label>
                        <TextareaAuto
                            placeholder="What steps will be taken?"
                            className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none min-h-[40px]"
                            value={act.actions}
                            onChange={(e) => handleActivityChange(act.id, 'actions', e.target.value)}
                        />
                    </div>

                    {/* Complied toggle — AIP activities only */}
                    {act.fromAIP && (
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5">Compliance with AIP</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${act.complied === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500 hover:border-emerald-300'}`}
                                    onClick={() => handleActivityChange(act.id, 'complied', act.complied === true ? null : true)}
                                >✓ Complied</button>
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${act.complied === false ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500 hover:border-red-300'}`}
                                    onClick={() => handleActivityChange(act.id, 'complied', act.complied === false ? null : false)}
                                >✗ Not Complied</button>
                            </div>
                        </div>
                    )}

                    {/* v4 detail fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 dark:focus-within:ring-blue-950/20 transition-colors">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Actual Tasks Conducted</label>
                            <TextareaAuto
                                placeholder="What tasks were actually conducted?"
                                className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none min-h-[40px]"
                                value={act.actualTasksConducted}
                                onChange={(e) => handleActivityChange(act.id, 'actualTasksConducted', e.target.value)}
                            />
                        </div>
                        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 dark:focus-within:ring-blue-950/20 transition-colors">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Contributory Performance Indicators</label>
                            <TextareaAuto
                                placeholder="Indicators this activity contributes to..."
                                className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none min-h-[40px]"
                                value={act.contributoryIndicators}
                                onChange={(e) => handleActivityChange(act.id, 'contributoryIndicators', e.target.value)}
                            />
                        </div>
                        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 dark:focus-within:ring-blue-950/20 transition-colors">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">MOVs / Expected Outputs</label>
                            <TextareaAuto
                                placeholder="Means of verification and expected outputs..."
                                className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none min-h-[40px]"
                                value={act.movsExpectedOutputs}
                                onChange={(e) => handleActivityChange(act.id, 'movsExpectedOutputs', e.target.value)}
                            />
                        </div>
                        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 dark:focus-within:ring-blue-950/20 transition-colors">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Adjustments</label>
                            <TextareaAuto
                                placeholder="Any adjustments made to the activity..."
                                className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none min-h-[40px]"
                                value={act.adjustments}
                                onChange={(e) => handleActivityChange(act.id, 'adjustments', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`${(appMode === 'full' || currentStep === 3) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>

            {/* WIZARD ONLY: ACTIVITY CARDS (Step 3) */}
            {appMode === 'wizard' && (
                <>
                    <SectionHeader
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
                        title="Monitoring Evaluation"
                        subtitle={
                            isLoadingActivities
                                ? "Loading activities from AIP..."
                                : activities.some(a => a.fromAIP)
                                    ? "Activities loaded from AIP. Fill in targets and accomplishments."
                                    : "Record activities, targets, and actual accomplishments."
                        }
                        theme="blue"
                        appMode={appMode}
                        rightElement={
                            activities.some(a => a.fromAIP) && (
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 px-3 py-1.5 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Synced from AIP
                                </span>
                            )
                        }
                    />

                    {/* AIP / planned activities */}
                    <div className="space-y-4">
                        {activities.filter(a => !a.isUnplanned).map((act, index) => renderActivityCard(act, index))}
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={handleAddActivity}
                            className={`group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-8 font-bold shadow-sm border-2 active:scale-95 transition-colors gap-2 ${isAddingActivity
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200'
                                    : 'bg-white dark:bg-dark-surface text-blue-600 border-blue-100 dark:border-dark-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'
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

                    {/* Unplanned activities sub-section */}
                    <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 dark:border-dark-border">
                        <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Activities Conducted But Not Included in AIP
                        </h3>

                        {activities.filter(a => a.isUnplanned).length > 0 && (
                            <div className="space-y-4 mb-4">
                                {activities.filter(a => a.isUnplanned).map((act, index) => renderActivityCard(act, index))}
                            </div>
                        )}

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={handleAddUnplannedActivity}
                                className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-8 font-bold shadow-sm border-2 active:scale-95 transition-colors gap-2 bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-dark-base"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Add Unplanned Activity
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* FULL MODE ONLY: INTERACTIVE ACTIVITIES TABLE */}
            {appMode === 'full' && (
                <>
                    <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-100 dark:border-blue-900 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Monitoring Evaluation & Adjustment</h2>
                                {activities.some(a => a.fromAIP) && (
                                    <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Activities and implementation schedule auto-loaded from AIP
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-visible overflow-x-auto pb-4">
                        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm overflow-hidden">
                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                <thead>
                                    <tr className="text-center select-none bg-slate-50 dark:bg-dark-base border-b border-slate-200 dark:border-dark-border">
                                        <th rowSpan="2" className="border-r border-slate-200 dark:border-dark-border p-4 w-1/5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Activity Name</th>
                                        <th rowSpan="2" className="border-r border-slate-200 dark:border-dark-border p-4 w-[130px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Implementation Period</th>
                                        <th colSpan="2" className="border-r border-slate-200 dark:border-dark-border p-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Target</th>
                                        <th colSpan="2" className="border-r border-slate-200 dark:border-dark-border p-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Accomplishment</th>
                                        <th colSpan="2" className="border-r border-slate-200 dark:border-dark-border p-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Gap (%)</th>
                                        <th rowSpan="2" className="p-4 w-1/5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions to Address Gap</th>
                                        <th rowSpan="2" className="border-none w-14"></th>
                                    </tr>
                                    <tr className="text-center select-none bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border">
                                        <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Physical</th>
                                        <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial</th>
                                        <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Physical</th>
                                        <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial</th>
                                        <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Physical</th>
                                        <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-dark-surface">
                                    {activities.map((act, index) => {
                                        const physGap = calculateGap(act.physTarget, act.physAcc);
                                        const finGap = calculateGap(act.finTarget, act.finAcc);
                                        const isLast = index === activities.length - 1;

                                        return (
                                            <tr key={act.id} className={`group hover:bg-slate-50 dark:hover:bg-dark-base transition-colors ${!isLast ? 'border-b border-slate-200 dark:border-dark-border' : ''}`}>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-3 align-top">
                                                    {act.fromAIP ? (
                                                        <p className="font-medium text-slate-700 dark:text-slate-200 p-1 text-sm">{act.name}</p>
                                                    ) : (
                                                        <TextareaAuto placeholder="Describe activity..." className="font-medium text-slate-700 dark:text-slate-200 w-full bg-transparent p-1 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded-md" value={act.name} onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)} />
                                                    )}
                                                </td>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-3 align-top bg-blue-50/30 dark:bg-blue-950/20">
                                                    {act.implementation_period ? (
                                                        <span className="text-xs font-semibold text-blue-700 leading-relaxed">{act.implementation_period}</span>
                                                    ) : (
                                                        <TextareaAuto placeholder="e.g. January to March" className="text-xs font-medium text-slate-600 dark:text-slate-300 w-full bg-transparent p-1 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded-md" value={act.implementation_period} onChange={(e) => handleActivityChange(act.id, 'implementation_period', e.target.value)} />
                                                    )}
                                                </td>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-1 align-top h-px">
                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 h-full min-h-[44px] bg-transparent focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded-md" value={act.physTarget} onChange={(e) => handleActivityChange(act.id, 'physTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                </td>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-1 align-top h-px">
                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 h-full min-h-[44px] bg-transparent focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded-md" value={act.finTarget} onChange={(e) => handleActivityChange(act.id, 'finTarget', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                </td>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-1 align-top h-px">
                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 h-full min-h-[44px] bg-transparent focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded-md" value={act.physAcc} onChange={(e) => handleActivityChange(act.id, 'physAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                </td>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-1 align-top h-px">
                                                    <input type="number" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 h-full min-h-[44px] bg-transparent focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded-md" value={act.finAcc} onChange={(e) => handleActivityChange(act.id, 'finAcc', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                </td>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-1 align-top bg-slate-50/50 dark:bg-dark-base/50 h-px">
                                                    <input type="text" readOnly tabIndex={-1} className="w-full text-center font-bold outline-none font-mono text-sm select-none pointer-events-none bg-transparent h-full min-h-[44px]" style={{ color: physGap < 0 ? '#ef4444' : '#64748b' }} value={`${physGap.toFixed(2)}%`} />
                                                </td>
                                                <td className="border-r border-slate-200 dark:border-dark-border p-1 align-top bg-slate-50/50 dark:bg-dark-base/50 h-px">
                                                    <input type="text" readOnly tabIndex={-1} className="w-full text-center font-bold outline-none font-mono text-sm select-none pointer-events-none bg-transparent h-full min-h-[44px]" style={{ color: finGap < 0 ? '#ef4444' : '#64748b' }} value={`${finGap.toFixed(2)}%`} />
                                                </td>
                                                <td className="p-3 align-top">
                                                    <TextareaAuto placeholder="Resolutions..." className="font-medium text-slate-700 dark:text-slate-200 w-full bg-transparent p-1 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded-md" value={act.actions} onChange={(e) => handleActivityChange(act.id, 'actions', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddActivity(); }} />
                                                </td>
                                                <td className="border-none p-0 w-0 relative bg-white dark:bg-dark-surface">
                                                    {activities.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveActivity(act.id)} className="absolute -right-14 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500 shadow-sm hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 focus:outline-none transition-colors z-10 opacity-0 group-hover:opacity-100" title="Delete Row">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
                        <button type="button" onClick={handleAddActivity} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-base hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Activity Row
                        </button>
                    </div>
                </>
            )}
        </div>
    );
});
