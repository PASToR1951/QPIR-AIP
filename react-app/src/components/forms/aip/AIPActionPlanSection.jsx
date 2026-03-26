import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';
import FuzzyAutocomplete from '../../ui/FuzzyAutocomplete';

export const AIP_PHASES = ["Planning", "Implementation", "Monitoring and Evaluation"];

const MONTHS = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];

function MonthRangePicker({ startMonth, endMonth, onStartChange, onEndChange, compact }) {
    const selectClass = compact
        ? "w-full bg-transparent text-center outline-none text-sm font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded p-1 appearance-none cursor-pointer"
        : "w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 appearance-none cursor-pointer";
    return (
        <div className={compact ? "flex items-center gap-1" : "flex items-center gap-2"}>
            <select
                value={startMonth || ''}
                onChange={(e) => {
                    const v = e.target.value ? parseInt(e.target.value) : '';
                    onStartChange(v);
                    if (v && endMonth && parseInt(endMonth) < v) onEndChange(v);
                }}
                className={selectClass}
            >
                <option value="">Start</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <span className="text-slate-300 dark:text-slate-600 text-xs shrink-0">to</span>
            <select
                value={endMonth || ''}
                onChange={(e) => onEndChange(e.target.value ? parseInt(e.target.value) : '')}
                className={selectClass}
            >
                <option value="">End</option>
                {MONTHS.filter(m => !startMonth || m.value >= parseInt(startMonth)).map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
        </div>
    );
}

export default React.memo(function AIPActionPlanSection({
    appMode,
    currentStep,
    activities,
    expandedActivityId,
    setExpandedActivityId,
    handleActivityChange,
    handleRemoveActivity,
    handleAddActivityPhase,
    personsTerms = []
}) {
    const budgetTotal = activities.reduce((sum, a) => sum + (parseFloat(a.budgetAmount) || 0), 0);

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
                <>
                    <div className="space-y-4">
                    {(currentStep === 3 ? AIP_PHASES.slice(0, 2) : AIP_PHASES.slice(2)).map((phase, pIdx) => {
                        const phaseActivities = activities.filter(a => a.phase === phase);
                        const actualIndex = currentStep === 3 ? pIdx + 1 : 3;
                        return (
                            <div key={phase} className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-2xl p-4">
                                <h3 className="text-sm font-bold text-pink-800 dark:text-pink-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs">{actualIndex}</span>
                                    {phase}
                                </h3>
                                {phaseActivities.length === 0 ? (
                                    <p className="text-sm text-slate-400 dark:text-slate-500 italic pl-8">No activities yet. Click "Add Activity" below.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {phaseActivities.map((act, aIdx) => (
                                            <div key={act.id} className={`bg-white dark:bg-dark-surface border rounded-xl p-4 transition-all ${expandedActivityId === act.id ? 'border-pink-300 shadow-md ring-2 ring-pink-100' : 'border-slate-200 dark:border-dark-border hover:border-slate-300'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-400 dark:text-slate-500 text-xs">{actualIndex}.{aIdx + 1}</span>
                                                        {expandedActivityId === act.id ? (
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-b border-pink-300 dark:border-pink-700 outline-none focus:border-pink-500 w-full"
                                                                placeholder="Activity name..."
                                                                value={act.name}
                                                                onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)}
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedActivityId(expandedActivityId === act.id ? null : act.id)}
                                                                className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-pink-600 transition-colors text-left"
                                                            >
                                                                {act.name || "Untitled Activity"}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {activities.filter(a => a.phase === phase).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveActivity(act.id)}
                                                            className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                                                            title="Delete Activity"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                                {expandedActivityId === act.id && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-dark-border">
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Implementation Period</label>
                                                            <MonthRangePicker
                                                                startMonth={act.periodStartMonth}
                                                                endMonth={act.periodEndMonth}
                                                                onStartChange={(v) => handleActivityChange(act.id, 'periodStartMonth', v)}
                                                                onEndChange={(v) => handleActivityChange(act.id, 'periodEndMonth', v)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <FuzzyAutocomplete
                                                                label="Persons Involved"
                                                                placeholder="e.g. Teachers"
                                                                className="w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none resize-none"
                                                                terms={personsTerms}
                                                                value={act.persons}
                                                                onChange={(v) => handleActivityChange(act.id, 'persons', v)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Outputs</label>
                                                            <TextareaAuto placeholder="Expected output" className="w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100" value={act.outputs} onChange={(e) => handleActivityChange(act.id, 'outputs', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</label>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none select-none">₱</span>
                                                                <input type="text" inputMode="decimal" className="w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg pl-6 pr-3 py-2 text-sm text-slate-800 dark:text-slate-100 font-mono" placeholder="0.00" value={act.budgetAmount} onChange={(e) => handleActivityChange(act.id, 'budgetAmount', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Source</label>
                                                            <input type="text" className="w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 transition-all rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100" placeholder="NONE" value={act.budgetSource} onChange={(e) => handleActivityChange(act.id, 'budgetSource', e.target.value)} />
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
                                    className="mt-3 text-xs font-bold text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 dark:hover:bg-pink-900/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 origin-left"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    Add Activity to {phase}
                                </button>
                            </div>
                        );
                    })}
                </div>
                {budgetTotal > 0 && (
                    <div className="mt-3 flex justify-end">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 rounded-xl text-sm font-bold text-pink-800 dark:text-pink-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            Total: ₱ {budgetTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
                </>
            )}

            {/* FULL MODE: Table View */}
            {appMode === 'full' && (
                <div className="overflow-visible overflow-x-auto pb-4 pr-16">
                    <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm overflow-visible min-w-[1000px]">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="text-left select-none bg-slate-50 dark:bg-dark-base border-b border-slate-200 dark:border-dark-border">
                                    <th rowSpan="2" className="border-r border-slate-200 dark:border-dark-border p-3 w-[30%] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Activities to be Conducted</th>
                                    <th rowSpan="2" className="border-r border-slate-200 dark:border-dark-border p-3 w-[15%] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Implementation Period</th>
                                    <th rowSpan="2" className="border-r border-slate-200 dark:border-dark-border p-3 w-[15%] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Persons Involved</th>
                                    <th rowSpan="2" className="border-r border-slate-200 dark:border-dark-border p-3 w-[15%] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Outputs</th>
                                    <th colSpan="2" className="border-r border-slate-200 dark:border-dark-border p-3 w-[20%] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center">Budgetary Requirement</th>
                                    <th rowSpan="2" className="border-none w-10"></th>
                                </tr>
                                <tr className="text-center select-none bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border">
                                    <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-dark-base/50">Amount</th>
                                    <th className="border-r border-slate-200 dark:border-dark-border p-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-dark-base/50">Source</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-surface">
                                {AIP_PHASES.map((phase, pIdx) => {
                                    const phaseActivities = activities.filter(a => a.phase === phase);
                                    return (
                                        <React.Fragment key={phase}>
                                            {/* Phase Header Row */}
                                            <tr className="bg-pink-50/50 dark:bg-pink-950/30 border-b border-slate-200 dark:border-dark-border">
                                                <td colSpan="7" className="p-3 font-bold text-pink-800 dark:text-pink-300 text-xs uppercase tracking-wider">
                                                    {pIdx + 1}. {phase}
                                                </td>
                                            </tr>

                                            {/* Activity Rows for this Phase */}
                                            {phaseActivities.map((act, aIdx) => (
                                                <tr key={act.id} className="group hover:bg-slate-50 dark:hover:bg-dark-base transition-colors border-b border-slate-100 dark:border-dark-border">
                                                    <td className="border-r border-slate-200 dark:border-dark-border p-2 align-top">
                                                        <div className="flex gap-2 items-start w-full">
                                                            <span className="font-bold text-slate-400 dark:text-slate-500 text-xs mt-1.5 shrink-0 select-none">{pIdx + 1}.{aIdx + 1}</span>
                                                            <TextareaAuto placeholder="Describe activity..." className="font-medium text-slate-700 dark:text-slate-200 w-full bg-transparent p-1 focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded" value={act.name} onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)} />
                                                        </div>
                                                    </td>
                                                    <td className="border-r border-slate-200 dark:border-dark-border p-2 align-top">
                                                        <MonthRangePicker
                                                            startMonth={act.periodStartMonth}
                                                            endMonth={act.periodEndMonth}
                                                            onStartChange={(v) => handleActivityChange(act.id, 'periodStartMonth', v)}
                                                            onEndChange={(v) => handleActivityChange(act.id, 'periodEndMonth', v)}
                                                            compact
                                                        />
                                                    </td>
                                                    <td className="border-r border-slate-200 dark:border-dark-border p-2 align-top">
                                                        <FuzzyAutocomplete
                                                            placeholder="e.g. Teachers"
                                                            className="font-medium text-slate-700 dark:text-slate-200 w-full bg-transparent p-1 text-center focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded outline-none resize-none"
                                                            terms={personsTerms}
                                                            value={act.persons}
                                                            onChange={(v) => handleActivityChange(act.id, 'persons', v)}
                                                        />
                                                    </td>
                                                    <td className="border-r border-slate-200 dark:border-dark-border p-2 align-top">
                                                        <TextareaAuto placeholder="Expected output" className="font-medium text-slate-700 dark:text-slate-200 w-full bg-transparent p-1 text-center focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded" value={act.outputs} onChange={(e) => handleActivityChange(act.id, 'outputs', e.target.value)} />
                                                    </td>
                                                    <td className="border-r border-slate-200 dark:border-dark-border p-2 align-top bg-slate-50/30 dark:bg-dark-base/30">
                                                        <div className="relative">
                                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none select-none">₱</span>
                                                            <input type="text" inputMode="decimal" className="w-full text-center outline-none font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded pl-5 pr-1 py-1" placeholder="0.00" value={act.budgetAmount} onChange={(e) => handleActivityChange(act.id, 'budgetAmount', e.target.value.replace(/[^0-9.]/g, ''))} />
                                                        </div>
                                                    </td>
                                                    <td className="border-r border-slate-200 dark:border-dark-border p-2 align-top bg-slate-50/30 dark:bg-dark-base/30">
                                                        <input type="text" className="w-full text-center outline-none text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent focus:bg-white dark:focus:bg-dark-surface border border-transparent focus:border-slate-300 dark:focus:border-dark-border rounded p-1" placeholder="NONE" value={act.budgetSource} onChange={(e) => handleActivityChange(act.id, 'budgetSource', e.target.value)} />
                                                    </td>
                                                    <td className="border-none p-0 w-0 relative bg-white dark:bg-dark-surface">
                                                        {activities.filter(a => a.phase === act.phase).length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveActivity(act.id)} className="absolute -right-12 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500 shadow-sm hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 focus:outline-none transition-colors z-10 opacity-40 group-hover:opacity-100" title="Delete Row">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Add Activity Button explicitly for this Phase */}
                                            <tr className="border-b-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface group transition-colors">
                                                <td colSpan="7" className="p-2">
                                                    <button type="button" onClick={() => handleAddActivityPhase(phase)} className="text-[11px] font-bold text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 dark:hover:bg-pink-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 origin-left">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                        Add Activity to {phase}
                                                    </button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            {budgetTotal > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50 dark:bg-dark-base border-t-2 border-slate-200 dark:border-dark-border">
                                        <td colSpan="4" className="p-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Total Budget
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                                            ₱ {budgetTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td colSpan="2" className="p-3"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </>
    );
});
