import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';
import FuzzyAutocomplete from '../../ui/FuzzyAutocomplete';
import { AIP_PHASES } from '../../../forms/aip/useAipFormState.js';
import MonthRangePicker from '../../../forms/shared/components/MonthRangePicker.jsx';
import PhaseActivityEditor from '../../../forms/shared/components/PhaseActivityEditor.jsx';

const SURFACE_INPUT_CLASSNAME = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 dark:border-dark-border dark:bg-dark-surface dark:text-slate-100';
const SURFACE_TEXTAREA_CLASSNAME = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200';
const CARD_DELETE_BUTTON_CLASSNAME = 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-dark-border dark:text-slate-500 dark:hover:bg-red-950/30';
const TABLE_CELL_CLASSNAME = 'border-r border-slate-200 p-2 align-top dark:border-dark-border';
const TABLE_INPUT_CLASSNAME = 'w-full rounded border border-transparent bg-transparent p-1 text-center text-sm font-medium text-slate-700 outline-none focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface';
const TABLE_TEXTAREA_CLASSNAME = 'w-full rounded border border-transparent bg-transparent p-1 font-medium text-slate-700 focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface';
const TABLE_SHADED_CELL_CLASSNAME = 'border-r border-slate-200 bg-slate-50/30 p-2 align-top dark:border-dark-border dark:bg-dark-base/30';

function renderBudgetTotal(total) {
    return (
        <span className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-bold text-pink-800 dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Total: ₱ {total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
}

function sanitizeDecimalInput(value) {
    return value.replace(/[^0-9.]/g, '');
}

function createSharedFields({ handleActivityChange, personsTerms }) {
    return [
        {
            key: 'implementation-period',
            label: 'Implementation Period',
            render: ({ activity }) => (
                <MonthRangePicker
                    startMonth={activity.periodStartMonth}
                    endMonth={activity.periodEndMonth}
                    onStartChange={(value) => handleActivityChange(activity.id, 'periodStartMonth', value)}
                    onEndChange={(value) => handleActivityChange(activity.id, 'periodEndMonth', value)}
                />
            ),
        },
        {
            key: 'persons',
            hideLabel: true,
            render: ({ activity }) => (
                <FuzzyAutocomplete
                    label="Persons Involved"
                    placeholder="e.g. Teachers"
                    className={SURFACE_INPUT_CLASSNAME}
                    terms={personsTerms}
                    value={activity.persons}
                    onChange={(value) => handleActivityChange(activity.id, 'persons', value)}
                />
            ),
        },
        {
            key: 'outputs',
            label: 'Outputs',
            wrapperClassName: 'md:col-span-2',
            render: ({ activity }) => (
                <TextareaAuto
                    placeholder="Expected output"
                    className={SURFACE_TEXTAREA_CLASSNAME}
                    value={activity.outputs}
                    onChange={(event) => handleActivityChange(activity.id, 'outputs', event.target.value)}
                />
            ),
        },
        {
            key: 'budget-amount',
            label: 'Amount',
            render: ({ activity }) => (
                <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500">₱</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        className={`${SURFACE_INPUT_CLASSNAME} py-2 pl-7 pr-3 font-mono`}
                        placeholder="0.00"
                        value={activity.budgetAmount}
                        onChange={(event) => handleActivityChange(activity.id, 'budgetAmount', sanitizeDecimalInput(event.target.value))}
                    />
                </div>
            ),
        },
        {
            key: 'budget-source',
            label: 'Source',
            render: ({ activity }) => (
                <input
                    type="text"
                    className={SURFACE_INPUT_CLASSNAME}
                    placeholder="NONE"
                    value={activity.budgetSource}
                    onChange={(event) => handleActivityChange(activity.id, 'budgetSource', event.target.value)}
                />
            ),
        },
    ];
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
    personsTerms = [],
}) {
    const budgetTotal = activities.reduce((sum, activity) => sum + (parseFloat(activity.budgetAmount) || 0), 0);
    const visiblePhases = appMode === 'wizard'
        ? (currentStep === 3 ? AIP_PHASES.slice(0, 2) : AIP_PHASES.slice(2))
        : AIP_PHASES;
    const sharedFields = createSharedFields({ handleActivityChange, personsTerms });

    const groups = visiblePhases.map((phase) => {
        const phaseIndex = AIP_PHASES.indexOf(phase);

        return {
            key: phase,
            title: phase,
            activities: activities.filter((activity) => activity.phase === phase),
            emptyMessage: 'No activities yet. Click "Add Activity" below.',
            addLabel: `Add Activity to ${phase}`,
            onAdd: () => handleAddActivityPhase(phase),
            sequencePrefix: phaseIndex + 1,
            wizardContainerClassName: 'rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-base',
            wizardTitleClassName: 'flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300',
            mobileContainerClassName: 'rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-dark-border dark:bg-dark-base',
            mobileTitleClassName: 'text-sm font-black uppercase tracking-wider text-pink-800 dark:text-pink-300',
            addButtonClassName: 'mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-pink-50 px-4 py-2.5 text-sm font-bold text-pink-700 transition-colors hover:bg-pink-100 dark:bg-pink-950/30 dark:text-pink-300 dark:hover:bg-pink-900/30',
        };
    });

    const mobileFields = [
        {
            key: 'activity-name',
            label: 'Activity',
            wrapperClassName: 'md:col-span-2',
            render: ({ activity }) => (
                <TextareaAuto
                    placeholder="Describe activity..."
                    className={SURFACE_TEXTAREA_CLASSNAME}
                    value={activity.name}
                    onChange={(event) => handleActivityChange(activity.id, 'name', event.target.value)}
                />
            ),
        },
        ...sharedFields,
    ];

    return (
        <>
            <SectionHeader
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
                title={appMode === 'wizard' && currentStep === 3 ? 'Action Plan (Phase 1 & 2)' : 'Monitoring & Evaluation (Phase 3)'}
                subtitle={currentStep === 3 ? 'Define Planning and Implementation activities.' : 'Define Monitoring and Evaluation activities.'}
                theme="pink"
                appMode={appMode}
            />

            <PhaseActivityEditor
                appMode={appMode}
                groups={groups}
                expandedActivityId={expandedActivityId}
                onExpandedChange={setExpandedActivityId}
                onRemove={handleRemoveActivity}
                canRemove={(activity, group) => group.activities.length > 1}
                renderCollapsedTitle={(activity, context) => (
                    context.isExpanded ? (
                        <input
                            type="text"
                            autoFocus
                            className="w-full border-b border-pink-300 bg-transparent text-sm font-semibold text-slate-700 outline-none focus:border-pink-500 dark:border-pink-700 dark:text-slate-200"
                            placeholder="Activity name..."
                            value={activity.name}
                            onChange={(event) => handleActivityChange(activity.id, 'name', event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                        />
                    ) : (
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {activity.name || 'Untitled Activity'}
                            </p>
                        </div>
                    )
                )}
                wizardCard={{
                    fields: sharedFields,
                }}
                mobileCard={{
                    renderHeader: (activity, context) => (
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    {context.sequenceLabel}
                                </p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Activity details</p>
                            </div>
                            {context.canRemove && (
                                <button
                                    type="button"
                                    onClick={() => context.remove()}
                                    className={CARD_DELETE_BUTTON_CLASSNAME}
                                    title="Delete Activity"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18"></path>
                                        <path d="m6 6 12 12"></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                    ),
                    fields: mobileFields,
                    cardClassName: 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface',
                }}
                desktopTable={{
                    wrapperClassName: 'hidden md:block overflow-x-auto pb-4',
                    innerClassName: 'min-w-[1000px] overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface',
                    rowClassName: 'group border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-dark-border dark:hover:bg-dark-base',
                    columnGroups: [
                        {
                            key: 'activity-name',
                            header: 'Activities to be Conducted',
                            headerClassName: 'w-[30%] border-r border-slate-200 p-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            cellClassName: TABLE_CELL_CLASSNAME,
                            renderCell: (activity, context) => (
                                <div className="flex w-full items-start gap-2">
                                    <span className="mt-1.5 shrink-0 select-none text-xs font-bold text-slate-400 dark:text-slate-500">
                                        {context.sequenceLabel}
                                    </span>
                                    <TextareaAuto
                                        placeholder="Describe activity..."
                                        className={TABLE_TEXTAREA_CLASSNAME}
                                        value={activity.name}
                                        onChange={(event) => handleActivityChange(activity.id, 'name', event.target.value)}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: 'implementation-period',
                            header: 'Implementation Period',
                            headerClassName: 'w-[15%] border-r border-slate-200 p-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            cellClassName: TABLE_CELL_CLASSNAME,
                            renderCell: (activity) => (
                                <MonthRangePicker
                                    startMonth={activity.periodStartMonth}
                                    endMonth={activity.periodEndMonth}
                                    onStartChange={(value) => handleActivityChange(activity.id, 'periodStartMonth', value)}
                                    onEndChange={(value) => handleActivityChange(activity.id, 'periodEndMonth', value)}
                                    compact
                                />
                            ),
                        },
                        {
                            key: 'persons',
                            header: 'Persons Involved',
                            headerClassName: 'w-[15%] border-r border-slate-200 p-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            cellClassName: TABLE_CELL_CLASSNAME,
                            renderCell: (activity) => (
                                <FuzzyAutocomplete
                                    placeholder="e.g. Teachers"
                                    className={TABLE_INPUT_CLASSNAME}
                                    terms={personsTerms}
                                    value={activity.persons}
                                    onChange={(value) => handleActivityChange(activity.id, 'persons', value)}
                                />
                            ),
                        },
                        {
                            key: 'outputs',
                            header: 'Outputs',
                            headerClassName: 'w-[15%] border-r border-slate-200 p-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            cellClassName: TABLE_CELL_CLASSNAME,
                            renderCell: (activity) => (
                                <TextareaAuto
                                    placeholder="Expected output"
                                    className={`${TABLE_TEXTAREA_CLASSNAME} text-center`}
                                    value={activity.outputs}
                                    onChange={(event) => handleActivityChange(activity.id, 'outputs', event.target.value)}
                                />
                            ),
                        },
                        {
                            key: 'budget',
                            header: 'Budgetary Requirement',
                            headerClassName: 'w-[20%] border-r border-slate-200 p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                            columns: [
                                {
                                    key: 'budget-amount',
                                    header: 'Amount',
                                    headerClassName: 'border-r border-slate-200 bg-slate-50/50 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:bg-dark-base/50 dark:text-slate-500',
                                    cellClassName: TABLE_SHADED_CELL_CLASSNAME,
                                    renderCell: (activity) => (
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 select-none text-sm text-slate-400 dark:text-slate-500">₱</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className="w-full rounded border border-transparent bg-transparent py-1 pl-5 pr-1 text-center font-mono text-sm font-semibold text-slate-700 outline-none focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface"
                                                placeholder="0.00"
                                                value={activity.budgetAmount}
                                                onChange={(event) => handleActivityChange(activity.id, 'budgetAmount', sanitizeDecimalInput(event.target.value))}
                                            />
                                        </div>
                                    ),
                                },
                                {
                                    key: 'budget-source',
                                    header: 'Source',
                                    headerClassName: 'border-r border-slate-200 bg-slate-50/50 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:bg-dark-base/50 dark:text-slate-500',
                                    cellClassName: TABLE_SHADED_CELL_CLASSNAME,
                                    renderCell: (activity) => (
                                        <input
                                            type="text"
                                            className={TABLE_INPUT_CLASSNAME}
                                            placeholder="NONE"
                                            value={activity.budgetSource}
                                            onChange={(event) => handleActivityChange(activity.id, 'budgetSource', event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    handleAddActivityPhase(activity.phase);
                                                }
                                            }}
                                        />
                                    ),
                                },
                            ],
                        },
                        {
                            key: 'actions',
                            header: '',
                            headerClassName: 'w-10 border-none',
                            cellClassName: 'w-10 border-none bg-white p-1 align-middle dark:bg-dark-surface',
                            renderCell: (activity, context) => (
                                context.canRemove ? (
                                    <button
                                        type="button"
                                        onClick={() => context.remove()}
                                        className="mx-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-40 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:border-dark-border dark:bg-dark-surface dark:text-slate-500 dark:hover:bg-red-950/30"
                                        title="Delete Row"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 6 6 18"></path>
                                            <path d="m6 6 12 12"></path>
                                        </svg>
                                    </button>
                                ) : null
                            ),
                        },
                    ],
                    renderGroupHeader: (group, context) => (
                        <tr key={`${group.key}-header`} className="border-b border-slate-200 bg-pink-50/50 dark:border-dark-border dark:bg-pink-950/30">
                            <td colSpan={context.columnCount} className="p-3 text-xs font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300">
                                {context.groupIndex + 1}. {group.title}
                            </td>
                        </tr>
                    ),
                    renderGroupFooter: (group, context) => (
                        <tr key={`${group.key}-footer`} className="border-b-2 border-slate-200 bg-white transition-colors dark:border-dark-border dark:bg-dark-surface">
                            <td colSpan={context.columnCount} className="p-2">
                                <button
                                    type="button"
                                    onClick={group.onAdd}
                                    className="flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-1.5 text-[11px] font-bold text-pink-600 transition-colors hover:bg-pink-100 hover:text-pink-800 dark:bg-pink-950/30 dark:hover:bg-pink-900/30"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    {group.addLabel}
                                </button>
                            </td>
                        </tr>
                    ),
                    footer: () => (
                        budgetTotal > 0 ? (
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50 dark:border-dark-border dark:bg-dark-base">
                                    <td colSpan="4" className="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Total Budget
                                    </td>
                                    <td className="p-3 text-center font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
                                        ₱ {budgetTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan="2" className="p-3"></td>
                                </tr>
                            </tfoot>
                        ) : null
                    ),
                }}
                renderFooter={({ appMode: mode }) => (
                    mode === 'wizard' && budgetTotal > 0 ? (
                        <div className="mt-3 flex justify-end">
                            {renderBudgetTotal(budgetTotal)}
                        </div>
                    ) : null
                )}
            />
        </>
    );
});
