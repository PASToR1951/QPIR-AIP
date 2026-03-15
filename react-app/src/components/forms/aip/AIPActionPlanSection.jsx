import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';

export const AIP_PHASES = ["Planning", "Implementation", "Monitoring and Evaluation"];

export default function AIPActionPlanSection({
    appMode,
    currentStep,
    activities,
    expandedActivityId,
    setExpandedActivityId,
    handleActivityChange,
    handleRemoveActivity,
    handleAddActivityPhase
}) {
    return (
        <>
            <SectionHeader 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
                title={appMode === 'wizard' && currentStep === 3 ? "Action Plan (Phase 1 & 2)" : "Monitoring & Evaluation (Phase 3)"}
                subtitle={currentStep === 3 ? "Define Planning and Implementation activities." : "Define Monitoring and Evaluation activities."}
                theme="pink"
                appMode={appMode}
            />

            {/* WIZARD MODE: Activity Cards View */}
            {appMode === 'wizard' && (
                <div className="space-y-4">
                    {(currentStep === 3 ? AIP_PHASES.slice(0, 2) : AIP_PHASES.slice(2)).map((phase, pIdx) => {
                        const phaseActivities = activities.filter(a => a.phase === phase);
                        const actualIndex = currentStep === 3 ? pIdx + 1 : 3;
                        return (
                            <div key={phase} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                <h3 className="text-sm font-bold text-pink-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs">{actualIndex}</span>
                                    {phase}
                                </h3>
                                {phaseActivities.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic pl-8">No activities yet. Click "Add Activity" below.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {phaseActivities.map((act, aIdx) => (
                                            <div key={act.id} className={`bg-white border rounded-xl p-4 transition-all ${expandedActivityId === act.id ? 'border-pink-300 shadow-md ring-2 ring-pink-100' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-400 text-xs">{actualIndex}.{aIdx + 1}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedActivityId(expandedActivityId === act.id ? null : act.id)}
                                                            className="text-sm font-semibold text-slate-700 hover:text-pink-600 transition-colors text-left"
                                                        >
                                                            {act.name || "Untitled Activity"}
                                                        </button>
                                                    </div>
                                                    {activities.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveActivity(act.id)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Delete Activity"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                                {expandedActivityId === act.id && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Implementation Period</label>
                                                            <TextareaAuto placeholder="e.g. Jan-Mar" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" value={act.period} onChange={(e) => handleActivityChange(act.id, 'period', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Persons Involved</label>
                                                            <TextareaAuto placeholder="e.g. Teachers" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" value={act.persons} onChange={(e) => handleActivityChange(act.id, 'persons', e.target.value)} />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Outputs</label>
                                                            <TextareaAuto placeholder="Expected output" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" value={act.outputs} onChange={(e) => handleActivityChange(act.id, 'outputs', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Amount</label>
                                                            <input type="text" inputMode="decimal" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800 font-mono" placeholder="₱ 0.00" value={act.budgetAmount} onChange={(e) => handleActivityChange(act.id, 'budgetAmount', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Source</label>
                                                            <input type="text" className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800" placeholder="Budget source" value={act.budgetSource} onChange={(e) => handleActivityChange(act.id, 'budgetSource', e.target.value)} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleAddActivityPhase(phase)}
                                    className="mt-3 text-xs font-bold text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 origin-left"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    Add Activity to {phase}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FULL MODE: Table View */}
            {appMode === 'full' && (
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
                                {AIP_PHASES.map((phase, pIdx) => {
                                    const phaseActivities = activities.filter(a => a.phase === phase);
                                    return (
                                        <React.Fragment key={phase}>
                                            {/* Phase Header Row */}
                                            <tr className="bg-pink-50/50 border-b border-slate-200">
                                                <td colSpan="7" className="p-3 font-bold text-pink-800 text-xs uppercase tracking-wider">
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Add Activity Button explicitly for this Phase */}
                                            <tr className="border-b-2 border-slate-200 bg-white group transition-colors">
                                                <td colSpan="7" className="p-2">
                                                    <button type="button" onClick={() => handleAddActivityPhase(phase)} className="text-[11px] font-bold text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 origin-left">
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
            )}
        </>
    );
}
