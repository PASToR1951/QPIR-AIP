import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';
import { useFormShellContext } from '../../../forms/shared/formShellContext.jsx';
import { selectActivities, selectFactors, usePirDispatch, usePirSelector } from '../../../forms/pir/pirContext.jsx';
import { FACTOR_TYPES } from '../../../forms/pir/usePirFormState.js';

const FACTOR_TEXTAREA_CLASSNAME = 'min-h-[72px] w-full rounded-lg border border-transparent bg-transparent p-2 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface';

function getActivityName(activity) {
    return activity.name?.trim() || 'Untitled Activity';
}

function FactorTextarea({ type, activity, category, factors, dispatch, placeholder }) {
    return (
        <TextareaAuto
            className={FACTOR_TEXTAREA_CLASSNAME}
            placeholder={placeholder}
            value={factors[type]?.[activity.id]?.[category] ?? ''}
            onChange={(event) => dispatch({
                type: 'SET_FACTOR',
                payload: {
                    type,
                    activityId: activity.id,
                    category,
                    value: event.target.value,
                },
            })}
        />
    );
}

function FactorRows({ type, activities, factors, dispatch, compact = false }) {
    if (activities.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm italic text-slate-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-500">
                No activities recorded.
            </p>
        );
    }

    if (compact) {
        return (
            <div className="space-y-3">
                {activities.map((activity, index) => (
                    <div key={activity.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
                        <div className="mb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Activity {index + 1}</p>
                            <p className="mt-1 break-words text-sm font-bold text-slate-700 dark:text-slate-200">{getActivityName(activity)}</p>
                            {activity.implementation_period && (
                                <p className="mt-1 text-[11px] font-medium text-blue-600">{activity.implementation_period}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-emerald-300 dark:border-dark-border dark:bg-dark-base">
                                <label className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Facilitating</label>
                                <FactorTextarea type={type} activity={activity} category="facilitating" factors={factors} dispatch={dispatch} placeholder="What helped this activity?" />
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-rose-300 dark:border-dark-border dark:bg-dark-base">
                                <label className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-widest text-rose-600">Hindering</label>
                                <FactorTextarea type={type} activity={activity} category="hindering" factors={factors} dispatch={dispatch} placeholder="What challenged this activity?" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-dark-border dark:bg-dark-base">
                        <th className="w-[34%] border-r border-slate-200 p-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:border-dark-border dark:text-slate-400">Activity Name</th>
                        <th className="w-[33%] border-r border-slate-200 p-3 text-xs font-black uppercase tracking-widest text-emerald-600 dark:border-dark-border">Facilitating Factors</th>
                        <th className="w-[33%] p-3 text-xs font-black uppercase tracking-widest text-rose-600">Hindering Factors</th>
                    </tr>
                </thead>
                <tbody>
                    {activities.map((activity, index) => (
                        <tr key={activity.id} className="border-b border-slate-200 last:border-b-0 dark:border-dark-border">
                            <td className="border-r border-slate-200 p-4 align-top dark:border-dark-border">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Activity {index + 1}</p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{getActivityName(activity)}</p>
                                {activity.implementation_period && (
                                    <p className="mt-1 text-[11px] font-medium text-blue-600">{activity.implementation_period}</p>
                                )}
                            </td>
                            <td className="border-r border-slate-200 bg-white p-2 align-top focus-within:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:focus-within:bg-dark-base">
                                <FactorTextarea type={type} activity={activity} category="facilitating" factors={factors} dispatch={dispatch} placeholder="Facilitating factors..." />
                            </td>
                            <td className="bg-white p-2 align-top focus-within:bg-slate-50 dark:bg-dark-surface dark:focus-within:bg-dark-base">
                                <FactorTextarea type={type} activity={activity} category="hindering" factors={factors} dispatch={dispatch} placeholder="Hindering factors..." />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function FactorTypeSection({ type, activities, factors, dispatch, compact = false }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-dark-border dark:bg-dark-base">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">{type} Factors</h3>
            </div>
            <div className={compact ? 'bg-slate-50 p-4 dark:bg-dark-base' : ''}>
                <FactorRows type={type} activities={activities} factors={factors} dispatch={dispatch} compact={compact} />
            </div>
        </section>
    );
}

export default React.memo(function PIRFactorsSection() {
    const { appMode, currentStep } = useFormShellContext();
    const dispatch = usePirDispatch();
    const activities = usePirSelector(selectActivities);
    const factors = usePirSelector(selectFactors);
    const orderedActivities = [
        ...activities.filter((activity) => !activity.isUnplanned),
        ...activities.filter((activity) => activity.isUnplanned),
    ];

    if (appMode !== 'full' && currentStep !== 4) return null;

    return (
        <div className={`${(appMode === 'full' || currentStep === 4) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
            {appMode === 'wizard' && (
                <SectionHeader
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m17 5-5-3-5 3" /><path d="m17 19-5 3-5-3" /><path d="M2 12h20" /><path d="m5 7-3 5 3 5" /><path d="m19 7 3 5-3 5" /></svg>}
                    title="Implementation Factors"
                    subtitle="Identify facilitating and hindering factors for each activity."
                    theme="blue"
                    appMode={appMode}
                />
            )}

            {appMode === 'full' && (
                <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-dark-border">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-blue-600 dark:border-blue-900 dark:bg-blue-950/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" /><path d="m14 7 3 3" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Facilitating & Hindering Factors</h2>
                    </div>
                </div>
            )}

            <div className="space-y-5">
                {FACTOR_TYPES.map((type) => (
                    <FactorTypeSection
                        key={type}
                        type={type}
                        activities={orderedActivities}
                        factors={factors}
                        dispatch={dispatch}
                        compact={appMode === 'wizard'}
                    />
                ))}
            </div>
        </div>
    );
});
