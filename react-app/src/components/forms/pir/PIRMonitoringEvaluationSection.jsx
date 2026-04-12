import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';
import PhaseActivityEditor from '../../../forms/shared/components/PhaseActivityEditor.jsx';

const MOBILE_CARD_CLASSNAME = 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface';
const MOBILE_INPUT_CLASSNAME = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-blue-300 dark:border-dark-border dark:bg-dark-base dark:text-slate-200';
const MOBILE_NUMBER_PANEL_CLASSNAME = 'rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-dark-border dark:bg-dark-base';
const WIZARD_PANEL_CLASSNAME = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 dark:border-dark-border dark:bg-dark-surface dark:focus-within:ring-blue-950/20';
const TABLE_CELL_CLASSNAME = 'border-r border-slate-200 p-3 align-top dark:border-dark-border';
const TABLE_NUMBER_INPUT_CLASSNAME = 'min-h-[44px] w-full rounded-md border border-transparent bg-transparent text-center font-mono text-sm font-semibold text-slate-700 outline-none focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface';
const TABLE_TEXTAREA_CLASSNAME = 'w-full rounded-md border border-transparent bg-transparent p-1 font-medium text-slate-700 focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface';
const TABLE_DELETE_BUTTON_CLASSNAME = 'mx-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-950/30';

function sanitizeDecimalInput(value) {
    return value.replace(/[^0-9.]/g, '');
}

function GapSummary({ label, value }) {
    return (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
            {label}:{' '}
            <span className={value < 0 ? 'text-red-500' : 'text-emerald-500'}>
                {value.toFixed(2)}%
            </span>
        </span>
    );
}

function renderGapPanel({
    title,
    colorClass,
    targetValue,
    accomplishedValue,
    gapValue,
    onTargetChange,
    onAccomplishedChange,
}) {
    return (
        <div className="flex flex-col gap-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <span className={`h-2 w-2 rounded-full ${colorClass}`}></span>
                {title}
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <div className={WIZARD_PANEL_CLASSNAME}>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Target</label>
                    <input
                        type="number"
                        inputMode="decimal"
                        className="w-full bg-transparent font-mono text-base font-semibold text-slate-800 outline-none dark:text-slate-100"
                        placeholder="0"
                        value={targetValue}
                        onChange={onTargetChange}
                    />
                </div>
                <div className={WIZARD_PANEL_CLASSNAME}>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Accomplished</label>
                    <input
                        type="number"
                        inputMode="decimal"
                        className="w-full bg-transparent font-mono text-base font-semibold text-slate-800 outline-none dark:text-slate-100"
                        placeholder="0"
                        value={accomplishedValue}
                        onChange={onAccomplishedChange}
                    />
                </div>
            </div>
            <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${gapValue < 0 ? 'border-red-100 bg-red-50 dark:bg-red-950/30' : 'border-slate-200 bg-slate-100 dark:border-dark-border dark:bg-dark-border'}`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title.replace('Targets', 'Gap')}</span>
                <span className={`font-mono text-sm font-bold ${gapValue < 0 ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
                    {gapValue.toFixed(2)}%
                </span>
            </div>
        </div>
    );
}

function renderComplianceToggle(activity, handleActivityChange) {
    if (!activity.fromAIP) {
        return null;
    }

    return (
        <div>
            <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Compliance with AIP</label>
            <div className="flex gap-3">
                <button
                    type="button"
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${activity.complied === true ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400 hover:border-emerald-300 dark:border-dark-border dark:text-slate-500'}`}
                    onClick={() => handleActivityChange(activity.id, 'complied', activity.complied === true ? null : true)}
                >
                    ✓ Complied
                </button>
                <button
                    type="button"
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${activity.complied === false ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200 text-slate-400 hover:border-red-300 dark:border-dark-border dark:text-slate-500'}`}
                    onClick={() => handleActivityChange(activity.id, 'complied', activity.complied === false ? null : false)}
                >
                    ✗ Not Complied
                </button>
            </div>
        </div>
    );
}

function createWizardTextareaField({ key, label, placeholder, field, handleActivityChange, wrapperClassName = '' }) {
    return {
        key,
        wrapperClassName,
        hideLabel: true,
        render: ({ activity }) => (
            <div className={WIZARD_PANEL_CLASSNAME}>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {label}
                </label>
                <TextareaAuto
                    placeholder={placeholder}
                    className="min-h-[40px] w-full bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                    value={activity[field]}
                    onChange={(event) => handleActivityChange(activity.id, field, event.target.value)}
                />
            </div>
        ),
    };
}

function createMobileTextareaField({ key, label, placeholder, field, handleActivityChange, wrapperClassName = '' }) {
    return {
        key,
        label,
        wrapperClassName,
        render: ({ activity }) => (
            <TextareaAuto
                placeholder={placeholder}
                className={MOBILE_INPUT_CLASSNAME}
                value={activity[field]}
                onChange={(event) => handleActivityChange(activity.id, field, event.target.value)}
            />
        ),
    };
}

export default React.memo(function PIRMonitoringEvaluationSection({
    appMode,
    currentStep,
    isLoadingActivities,
    activities,
    expandedActivityId,
    setExpandedActivityId,
    calculateGap,
    handleRemoveActivity,
    handleActivityChange,
    handleAddActivity,
    handleAddUnplannedActivity,
    isAddingActivity,
    removedAIPActivities = [],
    handleRestoreActivity,
}) {
    if (appMode !== 'full' && currentStep !== 3) {
        return null;
    }

    const plannedActivities = activities.filter((activity) => !activity.isUnplanned);
    const unplannedActivities = activities.filter((activity) => activity.isUnplanned);
    const groupedActivities = [
        {
            key: 'planned',
            activities: plannedActivities,
            emptyMessage: 'No review activities yet.',
            addLabel: isAddingActivity ? 'Activity Added!' : 'Add Another Activity',
            onAdd: handleAddActivity,
            addButtonClassName: isAddingActivity
                ? 'mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-600 dark:bg-emerald-950/30'
                : 'mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border-2 border-blue-100 bg-white px-4 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-dark-border dark:bg-dark-surface dark:hover:bg-blue-950/20',
        },
        {
            key: 'unplanned',
            title: 'Activities Conducted But Not Included in AIP',
            activities: unplannedActivities,
            addLabel: 'Add Unplanned Activity',
            onAdd: handleAddUnplannedActivity,
            addButtonClassName: 'mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-base',
            wizardContainerClassName: 'mt-8 rounded-2xl border-t-2 border-dashed border-slate-200 pt-6 dark:border-dark-border',
            mobileContainerClassName: 'border-t-2 border-dashed border-slate-200 pt-6 dark:border-dark-border',
            wizardTitleClassName: 'mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400',
            mobileTitleClassName: 'mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400',
        },
    ];

    const desktopGroups = [
        {
            key: 'all',
            activities,
            addLabel: 'Add Activity Row',
            onAdd: handleAddActivity,
        },
    ];

    const wizardFields = [
        createWizardTextareaField({
            key: 'actions',
            label: 'Actions to Address Gap',
            placeholder: 'What steps will be taken?',
            field: 'actions',
            handleActivityChange,
            wrapperClassName: 'md:col-span-2',
        }),
        createWizardTextareaField({
            key: 'actual-tasks',
            label: 'Actual Tasks Conducted',
            placeholder: 'What tasks were actually conducted?',
            field: 'actualTasksConducted',
            handleActivityChange,
        }),
        createWizardTextareaField({
            key: 'contributory-indicators',
            label: 'Contributory Performance Indicators',
            placeholder: 'Indicators this activity contributes to...',
            field: 'contributoryIndicators',
            handleActivityChange,
        }),
        createWizardTextareaField({
            key: 'movs',
            label: 'MOVs / Expected Outputs',
            placeholder: 'Means of verification and expected outputs...',
            field: 'movsExpectedOutputs',
            handleActivityChange,
        }),
        createWizardTextareaField({
            key: 'adjustments',
            label: 'Adjustments',
            placeholder: 'Any adjustments made to the activity...',
            field: 'adjustments',
            handleActivityChange,
        }),
    ];

    const actionsField = createMobileTextareaField({
        key: 'actions',
        label: 'Actions to Address Gap',
        placeholder: 'What steps will be taken?',
        field: 'actions',
        handleActivityChange,
    });

    const activityNameField = createMobileTextareaField({
        key: 'name',
        label: 'Activity Name / Description',
        placeholder: 'Describe the activity here...',
        field: 'name',
        handleActivityChange,
        wrapperClassName: 'md:col-span-2',
    });

    return (
        <div className={`${(appMode === 'full' || currentStep === 3) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
            {appMode === 'wizard' && (
                <SectionHeader
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
                    title="Monitoring Evaluation"
                    subtitle={
                        isLoadingActivities
                            ? 'Loading activities from AIP...'
                            : activities.some((activity) => activity.fromAIP)
                                ? 'Activities loaded from AIP. Fill in targets and accomplishments.'
                                : 'Record activities, targets, and actual accomplishments.'
                    }
                    theme="blue"
                    appMode={appMode}
                    rightElement={
                        activities.some((activity) => activity.fromAIP) && (
                            <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Synced from AIP
                            </span>
                        )
                    }
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
                            {activities.some((activity) => activity.fromAIP) && (
                                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
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
                onRemove={handleRemoveActivity}
                canRemove={() => activities.length > 1}
                renderCollapsedTitle={(activity, context) => {
                    const physGap = calculateGap(activity.physTarget, activity.physAcc);
                    const finGap = calculateGap(activity.finTarget, activity.finAcc);

                    return context.isExpanded ? (
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Editing Activity</p>
                            <div className="mt-2">
                                {activity.fromAIP ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {activity.implementation_period && (
                                            <span className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:border-blue-900 dark:bg-blue-950/30">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                {activity.implementation_period}
                                            </span>
                                        )}
                                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{activity.name}</p>
                                    </div>
                                ) : (
                                    <TextareaAuto
                                        placeholder="Describe the activity here..."
                                        className="w-full border-b border-transparent bg-transparent py-1 text-lg font-semibold text-slate-800 transition-colors focus:border-blue-500 dark:text-slate-100"
                                        value={activity.name}
                                        onChange={(event) => handleActivityChange(activity.id, 'name', event.target.value)}
                                        onClick={(event) => event.stopPropagation()}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="min-w-0">
                            <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                {activity.name || <span className="italic font-normal text-slate-400 dark:text-slate-500">Untitled Activity...</span>}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {activity.implementation_period && (
                                    <span className="flex items-center gap-1 whitespace-nowrap font-semibold normal-case tracking-normal text-blue-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        {activity.implementation_period}
                                    </span>
                                )}
                                <GapSummary label="Physical Gap" value={physGap} />
                                <GapSummary label="Financial Gap" value={finGap} />
                            </div>
                        </div>
                    );
                }}
                wizardCard={{
                    beforeFields: (activity) => {
                        const physGap = calculateGap(activity.physTarget, activity.physAcc);
                        const finGap = calculateGap(activity.finTarget, activity.finAcc);

                        return (
                            <div className="mb-6 flex flex-col gap-6">
                                <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-dark-border dark:bg-dark-base md:grid-cols-2">
                                    {renderGapPanel({
                                        title: 'Physical Targets',
                                        colorClass: 'bg-blue-500',
                                        targetValue: activity.physTarget,
                                        accomplishedValue: activity.physAcc,
                                        gapValue: physGap,
                                        onTargetChange: (event) => handleActivityChange(activity.id, 'physTarget', sanitizeDecimalInput(event.target.value)),
                                        onAccomplishedChange: (event) => handleActivityChange(activity.id, 'physAcc', sanitizeDecimalInput(event.target.value)),
                                    })}
                                    {renderGapPanel({
                                        title: 'Financial Targets',
                                        colorClass: 'bg-emerald-500',
                                        targetValue: activity.finTarget,
                                        accomplishedValue: activity.finAcc,
                                        gapValue: finGap,
                                        onTargetChange: (event) => handleActivityChange(activity.id, 'finTarget', sanitizeDecimalInput(event.target.value)),
                                        onAccomplishedChange: (event) => handleActivityChange(activity.id, 'finAcc', sanitizeDecimalInput(event.target.value)),
                                    })}
                                </div>
                                {renderComplianceToggle(activity, handleActivityChange)}
                            </div>
                        );
                    },
                    fields: wizardFields,
                }}
                mobileCard={{
                    cardClassName: MOBILE_CARD_CLASSNAME,
                    renderHeader: (activity, context) => (
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Activity {context.index + 1}
                                </p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {activity.name || 'Untitled Activity'}
                                </p>
                                {activity.implementation_period && (
                                    <p className="mt-1 text-[11px] font-medium text-blue-600">{activity.implementation_period}</p>
                                )}
                            </div>
                            {context.canRemove && (
                                <button
                                    type="button"
                                    onClick={() => context.remove()}
                                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-dark-border dark:text-slate-500 dark:hover:bg-red-950/30"
                                    title="Delete Activity"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            )}
                        </div>
                    ),
                    beforeFields: (activity) => {
                        const physGap = calculateGap(activity.physTarget, activity.physAcc);
                        const finGap = calculateGap(activity.finTarget, activity.finAcc);

                        return (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={MOBILE_NUMBER_PANEL_CLASSNAME}>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Physical Target</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full bg-transparent font-mono text-sm font-semibold text-slate-800 outline-none dark:text-slate-100"
                                            value={activity.physTarget}
                                            onChange={(event) => handleActivityChange(activity.id, 'physTarget', sanitizeDecimalInput(event.target.value))}
                                        />
                                    </div>
                                    <div className={MOBILE_NUMBER_PANEL_CLASSNAME}>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Physical Accomplished</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full bg-transparent font-mono text-sm font-semibold text-slate-800 outline-none dark:text-slate-100"
                                            value={activity.physAcc}
                                            onChange={(event) => handleActivityChange(activity.id, 'physAcc', sanitizeDecimalInput(event.target.value))}
                                        />
                                    </div>
                                    <div className={MOBILE_NUMBER_PANEL_CLASSNAME}>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Financial Target</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full bg-transparent font-mono text-sm font-semibold text-slate-800 outline-none dark:text-slate-100"
                                            value={activity.finTarget}
                                            onChange={(event) => handleActivityChange(activity.id, 'finTarget', sanitizeDecimalInput(event.target.value))}
                                        />
                                    </div>
                                    <div className={MOBILE_NUMBER_PANEL_CLASSNAME}>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Financial Accomplished</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full bg-transparent font-mono text-sm font-semibold text-slate-800 outline-none dark:text-slate-100"
                                            value={activity.finAcc}
                                            onChange={(event) => handleActivityChange(activity.id, 'finAcc', sanitizeDecimalInput(event.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] font-bold uppercase tracking-widest">
                                    <div className={`rounded-xl border px-3 py-2 ${physGap < 0 ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-950/30' : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-dark-border dark:bg-dark-border dark:text-slate-300'}`}>
                                        Physical Gap: {physGap.toFixed(2)}%
                                    </div>
                                    <div className={`rounded-xl border px-3 py-2 ${finGap < 0 ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-950/30' : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-dark-border dark:bg-dark-border dark:text-slate-300'}`}>
                                        Financial Gap: {finGap.toFixed(2)}%
                                    </div>
                                </div>
                            </>
                        );
                    },
                    fields: ({ activity }) => (
                        activity.fromAIP ? [actionsField] : [activityNameField, actionsField]
                    ),
                }}
                desktopTable={{
                    wrapperClassName: 'hidden md:block overflow-visible overflow-x-auto pb-4',
                    innerClassName: 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface',
                    tableClassName: 'w-full min-w-[900px] border-collapse text-sm',
                    columnGroups: [
                        {
                            key: 'name',
                            header: 'Activity Name',
                            headerClassName: 'w-1/5 border-r border-slate-200 p-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            cellClassName: TABLE_CELL_CLASSNAME,
                            renderCell: (activity) => (
                                activity.fromAIP ? (
                                    <p className="p-1 text-sm font-medium text-slate-700 dark:text-slate-200">{activity.name}</p>
                                ) : (
                                    <TextareaAuto
                                        placeholder="Describe activity..."
                                        className={TABLE_TEXTAREA_CLASSNAME}
                                        value={activity.name}
                                        onChange={(event) => handleActivityChange(activity.id, 'name', event.target.value)}
                                    />
                                )
                            ),
                        },
                        {
                            key: 'implementation-period',
                            header: 'Implementation Period',
                            headerClassName: 'w-[130px] border-r border-slate-200 p-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            cellClassName: 'border-r border-slate-200 bg-blue-50/30 p-3 align-top dark:border-dark-border dark:bg-blue-950/20',
                            renderCell: (activity) => (
                                activity.implementation_period ? (
                                    <span className="text-xs font-semibold leading-relaxed text-blue-700">{activity.implementation_period}</span>
                                ) : (
                                    <TextareaAuto
                                        placeholder="e.g. January to March"
                                        className="w-full rounded-md border border-transparent bg-transparent p-1 text-xs font-medium text-slate-600 focus:border-slate-300 focus:bg-white dark:text-slate-300 dark:focus:border-dark-border dark:focus:bg-dark-surface"
                                        value={activity.implementation_period}
                                        onChange={(event) => handleActivityChange(activity.id, 'implementation_period', event.target.value)}
                                    />
                                )
                            ),
                        },
                        {
                            key: 'target',
                            header: 'Target',
                            headerClassName: 'border-r border-slate-200 p-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            columns: [
                                {
                                    key: 'target-physical',
                                    header: 'Physical',
                                    headerClassName: 'border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500',
                                    cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border',
                                    renderCell: (activity) => (
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className={TABLE_NUMBER_INPUT_CLASSNAME}
                                            value={activity.physTarget}
                                            onChange={(event) => handleActivityChange(activity.id, 'physTarget', sanitizeDecimalInput(event.target.value))}
                                        />
                                    ),
                                },
                                {
                                    key: 'target-financial',
                                    header: 'Financial',
                                    headerClassName: 'border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500',
                                    cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border',
                                    renderCell: (activity) => (
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className={TABLE_NUMBER_INPUT_CLASSNAME}
                                            value={activity.finTarget}
                                            onChange={(event) => handleActivityChange(activity.id, 'finTarget', sanitizeDecimalInput(event.target.value))}
                                        />
                                    ),
                                },
                            ],
                        },
                        {
                            key: 'accomplishment',
                            header: 'Accomplishment',
                            headerClassName: 'border-r border-slate-200 p-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            columns: [
                                {
                                    key: 'accomplishment-physical',
                                    header: 'Physical',
                                    headerClassName: 'border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500',
                                    cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border',
                                    renderCell: (activity) => (
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className={TABLE_NUMBER_INPUT_CLASSNAME}
                                            value={activity.physAcc}
                                            onChange={(event) => handleActivityChange(activity.id, 'physAcc', sanitizeDecimalInput(event.target.value))}
                                        />
                                    ),
                                },
                                {
                                    key: 'accomplishment-financial',
                                    header: 'Financial',
                                    headerClassName: 'border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500',
                                    cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border',
                                    renderCell: (activity) => (
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className={TABLE_NUMBER_INPUT_CLASSNAME}
                                            value={activity.finAcc}
                                            onChange={(event) => handleActivityChange(activity.id, 'finAcc', sanitizeDecimalInput(event.target.value))}
                                        />
                                    ),
                                },
                            ],
                        },
                        {
                            key: 'gap',
                            header: 'Gap (%)',
                            headerClassName: 'border-r border-slate-200 p-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            columns: [
                                {
                                    key: 'gap-physical',
                                    header: 'Physical',
                                    headerClassName: 'border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500',
                                    cellClassName: 'h-px border-r border-slate-200 bg-slate-50/50 p-1 align-top dark:border-dark-border dark:bg-dark-base/50',
                                    renderCell: (activity) => {
                                        const physGap = calculateGap(activity.physTarget, activity.physAcc);

                                        return (
                                            <input
                                                type="text"
                                                readOnly
                                                tabIndex={-1}
                                                className="pointer-events-none min-h-[44px] w-full select-none bg-transparent text-center font-mono text-sm font-bold outline-none"
                                                style={{ color: physGap < 0 ? '#ef4444' : '#64748b' }}
                                                value={`${physGap.toFixed(2)}%`}
                                            />
                                        );
                                    },
                                },
                                {
                                    key: 'gap-financial',
                                    header: 'Financial',
                                    headerClassName: 'border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500',
                                    cellClassName: 'h-px border-r border-slate-200 bg-slate-50/50 p-1 align-top dark:border-dark-border dark:bg-dark-base/50',
                                    renderCell: (activity) => {
                                        const finGap = calculateGap(activity.finTarget, activity.finAcc);

                                        return (
                                            <input
                                                type="text"
                                                readOnly
                                                tabIndex={-1}
                                                className="pointer-events-none min-h-[44px] w-full select-none bg-transparent text-center font-mono text-sm font-bold outline-none"
                                                style={{ color: finGap < 0 ? '#ef4444' : '#64748b' }}
                                                value={`${finGap.toFixed(2)}%`}
                                            />
                                        );
                                    },
                                },
                            ],
                        },
                        {
                            key: 'actions',
                            header: 'Actions to Address Gap',
                            headerClassName: 'w-1/5 p-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300',
                            cellClassName: 'p-3 align-top',
                            renderCell: (activity) => (
                                <TextareaAuto
                                    placeholder="Resolutions..."
                                    className={TABLE_TEXTAREA_CLASSNAME}
                                    value={activity.actions}
                                    onChange={(event) => handleActivityChange(activity.id, 'actions', event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            handleAddActivity();
                                        }
                                    }}
                                />
                            ),
                        },
                        {
                            key: 'remove',
                            header: '',
                            headerClassName: 'w-14 border-none',
                            cellClassName: 'w-10 p-2 text-center align-middle',
                            renderCell: (activity, context) => (
                                context.canRemove ? (
                                    <button
                                        type="button"
                                        onClick={() => context.remove()}
                                        className={TABLE_DELETE_BUTTON_CLASSNAME}
                                        title="Delete Row"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>
                                ) : null
                            ),
                        },
                    ],
                    renderGroupFooter: (group, context) => (
                        <tr key={`${group.key}-footer`}>
                            <td colSpan={context.columnCount} className="p-4">
                                <button
                                    type="button"
                                    onClick={group.onAdd}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-slate-50 hover:text-blue-600 active:scale-95 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-base"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    {group.addLabel}
                                </button>
                            </td>
                        </tr>
                    ),
                }}
                renderTray={() => (
                    removedAIPActivities.length > 0 ? (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20">
                            <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3 dark:border-amber-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Removed AIP Activities</span>
                                <span className="ml-auto text-[10px] font-semibold text-amber-500">Restore to add back</span>
                            </div>
                            <div className="divide-y divide-amber-100 dark:divide-amber-900">
                                {removedAIPActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-3 px-4 py-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {activity.name || <span className="italic font-normal text-slate-400">Untitled Activity</span>}
                                            </p>
                                            {activity.implementation_period && (
                                                <p className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">{activity.implementation_period}</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRestoreActivity(activity.id)}
                                            className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
                                        >
                                            Restore
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null
                )}
            />
        </div>
    );
});
