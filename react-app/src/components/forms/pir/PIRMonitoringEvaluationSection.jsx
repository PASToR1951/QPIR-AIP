import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import PhaseActivityEditor from '../../../forms/shared/components/PhaseActivityEditor.jsx';
import {
    MOBILE_CARD_CLASSNAME,
    sanitizeDecimalInput,
    createWizardTextareaField,
    createMobileTextareaField,
} from './pirMeStyles.jsx';
import { GapPanel, MobileGapInputs } from './GapWidgets.jsx';
import { ComplianceToggle } from './ComplianceToggle.jsx';
import { ActivityCollapsedTitle } from './ActivityCollapsedTitle.jsx';
import { buildDesktopTableConfig } from './buildDesktopTableConfig.jsx';

export default React.memo(function PIRMonitoringEvaluationSection({
    appMode,
    currentStep,
    isLoadingActivities,
    activities,
    expandedActivityId,
    setExpandedActivityId,
    calculateGap,
    handleActivityChange,
    handleAddUnplannedActivity,
}) {
    if (appMode !== 'full' && currentStep !== 3) return null;

    const plannedActivities = activities.filter((a) => !a.isUnplanned);
    const unplannedActivities = activities.filter((a) => a.isUnplanned);

    const groupedActivities = [
        {
            key: 'planned', activities: plannedActivities,
            emptyMessage: 'No review activities yet.',
        },
        {
            key: 'unplanned', title: 'Activities Conducted But Not Included in AIP',
            activities: unplannedActivities, addLabel: 'Add Unplanned Activity', onAdd: handleAddUnplannedActivity,
            addButtonClassName: 'mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-base',
            wizardContainerClassName: 'mt-8 rounded-2xl border-t-2 border-dashed border-slate-200 pt-6 dark:border-dark-border',
            mobileContainerClassName: 'border-t-2 border-dashed border-slate-200 pt-6 dark:border-dark-border',
            wizardTitleClassName: 'mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400',
            mobileTitleClassName: 'mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400',
        },
    ];

    const desktopGroups = [
        { key: 'planned', activities: plannedActivities },
        { key: 'unplanned', activities: unplannedActivities, addLabel: 'Add Unplanned Activity', onAdd: handleAddUnplannedActivity },
    ];

    const wizardFields = [
        createWizardTextareaField({ key: 'actions', label: 'Actions to Address Gap', placeholder: 'What steps will be taken?', field: 'actions', handleActivityChange, wrapperClassName: 'md:col-span-2' }),
        createWizardTextareaField({ key: 'actual-tasks', label: 'Actual Tasks Conducted', placeholder: 'What tasks were actually conducted?', field: 'actualTasksConducted', handleActivityChange }),
        createWizardTextareaField({ key: 'movs', label: 'MOVs / Expected Outputs', placeholder: 'Means of verification and expected outputs...', field: 'movsExpectedOutputs', handleActivityChange }),
        createWizardTextareaField({ key: 'contributory-indicators', label: 'Objectively Verifiable Indicators', placeholder: 'Indicators this activity contributes to...', field: 'contributoryIndicators', handleActivityChange }),
        createWizardTextareaField({ key: 'adjustments', label: 'Adjustments', placeholder: 'Any adjustments made to the activity...', field: 'adjustments', handleActivityChange }),
    ];

    const actionsField = createMobileTextareaField({ key: 'actions', label: 'Actions to Address Gap', placeholder: 'What steps will be taken?', field: 'actions', handleActivityChange });
    const activityNameField = createMobileTextareaField({ key: 'name', label: 'Activity Name / Description', placeholder: 'Describe the activity here...', field: 'name', handleActivityChange, wrapperClassName: 'md:col-span-2' });

    const desktopTable = buildDesktopTableConfig({ handleActivityChange, calculateGap });

    const hasFromAIP = activities.some((a) => a.fromAIP);

    return (
        <div className={`${(appMode === 'full' || currentStep === 3) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
            {appMode === 'wizard' && (
                <SectionHeader
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
                    title="Monitoring Evaluation"
                    subtitle={isLoadingActivities ? 'Loading activities from AIP...' : hasFromAIP ? 'Activities loaded from AIP. Fill in targets and accomplishments.' : 'Record activities, targets, and actual accomplishments.'}
                    theme="blue" appMode={appMode}
                    rightElement={hasFromAIP && (
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Synced from AIP
                        </span>
                    )}
                />
            )}

            {appMode === 'full' && (
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-blue-600 dark:border-blue-900 dark:bg-blue-950/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Monitoring Evaluation & Adjustment</h2>
                            {hasFromAIP && (
                                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Activities and implementation schedule auto-loaded from AIP
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PhaseActivityEditor
                appMode={appMode}
                groups={groupedActivities}
                desktopGroups={desktopGroups}
                expandedActivityId={expandedActivityId}
                onExpandedChange={setExpandedActivityId}
                canRemove={() => false}
                renderCollapsedTitle={(activity, context) => (
                    <ActivityCollapsedTitle
                        activity={activity} isExpanded={context.isExpanded}
                        calculateGap={calculateGap} handleActivityChange={handleActivityChange}
                    />
                )}
                wizardCard={{
                    beforeFields: (activity) => {
                        const physGap = calculateGap(activity.physTarget, activity.physAcc);
                        const finGap = calculateGap(activity.finTarget, activity.finAcc);
                        return (
                            <div className="mb-6 flex flex-col gap-6">
                                <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-dark-border dark:bg-dark-base md:grid-cols-2">
                                    <GapPanel title="Physical Targets" colorClass="bg-blue-500" targetValue={activity.physTarget} accomplishedValue={activity.physAcc} gapValue={physGap} onTargetChange={(e) => handleActivityChange(activity.id, 'physTarget', sanitizeDecimalInput(e.target.value))} onAccomplishedChange={(e) => handleActivityChange(activity.id, 'physAcc', sanitizeDecimalInput(e.target.value))} />
                                    <GapPanel title="Financial Targets" colorClass="bg-emerald-500" targetValue={activity.finTarget} accomplishedValue={activity.finAcc} gapValue={finGap} onTargetChange={(e) => handleActivityChange(activity.id, 'finTarget', sanitizeDecimalInput(e.target.value))} onAccomplishedChange={(e) => handleActivityChange(activity.id, 'finAcc', sanitizeDecimalInput(e.target.value))} />
                                </div>
                                <ComplianceToggle activity={activity} handleActivityChange={handleActivityChange} />
                            </div>
                        );
                    },
                    fields: wizardFields,
                }}
                mobileCard={{
                    cardClassName: MOBILE_CARD_CLASSNAME,
                    renderHeader: (activity, context) => (
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Activity {context.index + 1}</p>
                                <p className="break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{activity.name || 'Untitled Activity'}</p>
                                {activity.implementation_period && <p className="mt-1 text-[11px] font-medium text-blue-600">{activity.implementation_period}</p>}
                            </div>
                        </div>
                    ),
                    beforeFields: (activity) => <MobileGapInputs activity={activity} calculateGap={calculateGap} handleActivityChange={handleActivityChange} />,
                    fields: ({ activity }) => (activity.fromAIP ? [actionsField] : [activityNameField, actionsField]),
                }}
                desktopTable={desktopTable}
            />
        </div>
    );
});
