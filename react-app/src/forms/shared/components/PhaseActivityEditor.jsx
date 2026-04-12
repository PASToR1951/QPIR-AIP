import React from 'react';
import ActivityFieldGrid from './ActivityFieldGrid.jsx';

function resolveValue(value, context) {
    return typeof value === 'function' ? value(context) : value;
}

function defaultCanRemove() {
    return true;
}

function flattenDesktopColumnGroups(columnGroups = []) {
    return columnGroups.flatMap((group) => (
        group.columns?.length ? group.columns : [group]
    ));
}

export default function PhaseActivityEditor({
    appMode,
    groups,
    desktopGroups = null,
    expandedActivityId,
    onExpandedChange,
    onRemove,
    canRemove = defaultCanRemove,
    renderCollapsedTitle,
    renderExpandedFields,
    wizardCard = null,
    renderMobileCard,
    mobileCard = null,
    desktopTable = null,
    renderFooter = null,
    renderTray = null,
}) {
    const visibleGroups = groups.filter((group) => group.activities.length > 0 || group.emptyMessage || group.onAdd);
    const visibleDesktopGroups = (desktopGroups ?? groups).filter((group) => group.activities.length > 0 || group.emptyMessage || group.onAdd);
    const allActivities = visibleGroups.flatMap((group) => group.activities);
    const allDesktopActivities = visibleDesktopGroups.flatMap((group) => group.activities);
    const desktopLeafColumns = desktopTable?.columnGroups
        ? flattenDesktopColumnGroups(desktopTable.columnGroups)
        : [];

    const buildContext = (group, groupIndex, activity, index) => {
        const isExpanded = expandedActivityId === activity.id;
        const sequencePrefix = resolveValue(group.sequencePrefix, { group, groupIndex });
        const sequenceLabel = sequencePrefix
            ? `${sequencePrefix}.${index + 1}`
            : `${index + 1}`;

        return {
            appMode,
            group,
            groupIndex,
            activity,
            index,
            isExpanded,
            sequenceLabel,
            canRemove: canRemove(activity, group),
            expand: () => onExpandedChange?.(activity.id),
            collapse: () => onExpandedChange?.(null),
            toggleExpanded: () => onExpandedChange?.(isExpanded ? null : activity.id),
            remove: () => onRemove?.(activity.id),
        };
    };

    const renderGroupAddButton = (group) => {
        if (!group.onAdd || !group.addLabel) {
            return null;
        }

        return (
            <button
                type="button"
                onClick={group.onAdd}
                className={group.addButtonClassName ?? 'mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-dark-base dark:text-slate-200 dark:hover:bg-dark-border'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {group.addLabel}
            </button>
        );
    };

    const renderDescriptorExpandedFields = (activity, context) => {
        if (!wizardCard) {
            return null;
        }

        const fieldContext = { activity, context, appMode };
        const fields = resolveValue(wizardCard.fields, fieldContext);

        return (
            <>
                {wizardCard.beforeFields?.(activity, context)}
                <ActivityFieldGrid
                    fields={fields}
                    activity={activity}
                    context={context}
                    variant="wizard"
                    className={resolveValue(wizardCard.gridClassName, fieldContext)}
                />
                {wizardCard.afterFields?.(activity, context)}
            </>
        );
    };

    const renderWizardCard = (group, groupIndex, activity, index) => {
        const context = buildContext(group, groupIndex, activity, index);

        return (
            <div
                key={activity.id}
                onClick={!context.isExpanded ? context.expand : undefined}
                className={context.isExpanded
                    ? 'rounded-3xl border-2 border-slate-300 bg-white shadow-md ring-4 ring-slate-100 transition-all dark:border-dark-border dark:bg-dark-surface dark:ring-dark-base/70'
                    : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md dark:border-dark-border dark:bg-dark-surface dark:hover:bg-dark-base'}
            >
                <div className={context.isExpanded ? 'flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-dark-border md:px-6' : 'flex items-start justify-between gap-3'}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        {group.showSequence !== false && (
                            <span className={context.isExpanded
                                ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900'
                                : 'mt-1 shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500'}>
                                {context.isExpanded ? context.index + 1 : context.sequenceLabel}
                            </span>
                        )}
                        <div className="min-w-0 flex-1">
                            {renderCollapsedTitle(context.activity, context)}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {context.canRemove && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    context.remove();
                                }}
                                className={context.isExpanded
                                    ? 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/30'
                                    : 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-dark-border dark:text-slate-500 dark:hover:bg-red-950/30'}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18"></path>
                                    <path d="m6 6 12 12"></path>
                                </svg>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                context.toggleExpanded();
                            }}
                            className={context.isExpanded
                                ? 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors dark:bg-dark-base dark:text-slate-200'
                                : 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-dark-base dark:hover:text-slate-200'}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {context.isExpanded
                                    ? <path d="m18 15-6-6-6 6"></path>
                                    : <path d="m6 9 6 6 6-6"></path>}
                            </svg>
                        </button>
                    </div>
                </div>
                {context.isExpanded && (renderExpandedFields || wizardCard) && (
                    <div className="px-5 py-5 md:px-6">
                        {renderExpandedFields
                            ? renderExpandedFields(context.activity, context)
                            : renderDescriptorExpandedFields(context.activity, context)}
                    </div>
                )}
            </div>
        );
    };

    const renderWizardGroup = (group, groupIndex) => (
        <div key={group.key} className={group.wizardContainerClassName ?? 'rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-base'}>
            {(group.title || group.subtitle) && (
                <div className="mb-3">
                    {group.title && (
                        <h3 className={group.wizardTitleClassName ?? 'text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100'}>
                            {group.title}
                        </h3>
                    )}
                    {group.subtitle && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {group.subtitle}
                        </p>
                    )}
                </div>
            )}
            {group.activities.length === 0 ? (
                group.emptyMessage && (
                    <p className="italic text-sm text-slate-400 dark:text-slate-500">
                        {group.emptyMessage}
                    </p>
                )
            ) : (
                <div className="space-y-3">
                    {group.activities.map((activity, index) => renderWizardCard(group, groupIndex, activity, index))}
                </div>
            )}
            {renderGroupAddButton(group)}
        </div>
    );

    const renderDescriptorMobileCard = (activity, context) => {
        if (!mobileCard) {
            return null;
        }

        const fieldContext = { activity, context, appMode };
        const fields = resolveValue(mobileCard.fields, fieldContext);

        return (
            <div className={resolveValue(mobileCard.cardClassName, fieldContext) ?? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface'}>
                {mobileCard.renderHeader?.(activity, context)}
                <div className={resolveValue(mobileCard.bodyClassName, fieldContext) ?? 'space-y-4'}>
                    {mobileCard.beforeFields?.(activity, context)}
                    <ActivityFieldGrid
                        fields={fields}
                        activity={activity}
                        context={context}
                        variant="mobile"
                        className={resolveValue(mobileCard.gridClassName, fieldContext)}
                    />
                    {mobileCard.afterFields?.(activity, context)}
                </div>
            </div>
        );
    };

    const renderMobileGroup = (group, groupIndex) => (
        <div key={group.key} className={group.mobileContainerClassName ?? 'rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-dark-border dark:bg-dark-base'}>
            {(group.title || group.subtitle) && (
                <div className="mb-4">
                    {group.title && (
                        <h3 className={group.mobileTitleClassName ?? 'text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100'}>
                            {group.title}
                        </h3>
                    )}
                    {group.subtitle && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {group.subtitle}
                        </p>
                    )}
                </div>
            )}
            {group.activities.length === 0 ? (
                group.emptyMessage && (
                    <p className="italic text-sm text-slate-400 dark:text-slate-500">
                        {group.emptyMessage}
                    </p>
                )
            ) : (
                <div className="space-y-4">
                    {group.activities.map((activity, index) => {
                        const context = buildContext(group, groupIndex, activity, index);
                        return (
                            <React.Fragment key={activity.id}>
                                {renderMobileCard
                                    ? renderMobileCard(activity, context)
                                    : mobileCard
                                        ? renderDescriptorMobileCard(activity, context)
                                        : renderWizardCard(group, groupIndex, activity, index)}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
            {renderGroupAddButton(group)}
        </div>
    );

    const renderDesktopHeader = () => {
        if (!desktopTable?.columnGroups) {
            return desktopTable?.header ?? null;
        }

        const hasNestedColumns = desktopTable.columnGroups.some((group) => group.columns?.length);

        if (!hasNestedColumns) {
            return (
                <thead>
                    <tr className={desktopTable.headerRowClassName ?? 'select-none border-b border-slate-200 bg-slate-50 text-left dark:border-dark-border dark:bg-dark-base'}>
                        {desktopTable.columnGroups.map((column, index) => (
                            <th
                                key={column.key ?? `header-${index}`}
                                className={resolveValue(column.headerClassName, { column, index })}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
            );
        }

        return (
            <thead>
                <tr className={desktopTable.headerTopRowClassName ?? 'select-none border-b border-slate-200 bg-slate-50 text-left dark:border-dark-border dark:bg-dark-base'}>
                    {desktopTable.columnGroups.map((columnGroup, index) => {
                        const childCount = columnGroup.columns?.length ?? 0;

                        return (
                            <th
                                key={columnGroup.key ?? `header-group-${index}`}
                                rowSpan={childCount > 0 ? undefined : 2}
                                colSpan={childCount > 0 ? childCount : undefined}
                                className={resolveValue(columnGroup.headerClassName, { columnGroup, index })}
                            >
                                {columnGroup.header}
                            </th>
                        );
                    })}
                </tr>
                <tr className={desktopTable.headerBottomRowClassName ?? 'select-none border-b border-slate-200 bg-white text-center dark:border-dark-border dark:bg-dark-surface'}>
                    {desktopTable.columnGroups.flatMap((columnGroup, groupIndex) => (
                        (columnGroup.columns ?? []).map((column, columnIndex) => (
                            <th
                                key={column.key ?? `header-column-${groupIndex}-${columnIndex}`}
                                className={resolveValue(column.headerClassName, { column, columnGroup, groupIndex, columnIndex })}
                            >
                                {column.header}
                            </th>
                        ))
                    ))}
                </tr>
            </thead>
        );
    };

    const renderDesktopRow = (activity, context) => {
        if (desktopTable?.renderRow) {
            return desktopTable.renderRow(activity, context);
        }

        if (!desktopLeafColumns.length) {
            return null;
        }

        return (
            <tr
                key={activity.id}
                className={resolveValue(desktopTable?.rowClassName, { activity, context }) ?? 'group border-b border-slate-200 transition-colors hover:bg-slate-50 dark:border-dark-border dark:hover:bg-dark-base'}
            >
                {desktopLeafColumns.map((column, index) => (
                    <td
                        key={column.key ?? `cell-${activity.id}-${index}`}
                        className={resolveValue(column.cellClassName, { activity, context, column, index })}
                    >
                        {column.renderCell?.(activity, context)}
                    </td>
                ))}
            </tr>
        );
    };

    return (
        <>
            {appMode === 'wizard' && (
                <>
                    <div className="space-y-4">
                        {visibleGroups.map((group, groupIndex) => renderWizardGroup(group, groupIndex))}
                    </div>
                    {renderFooter?.({ appMode, groups: visibleGroups, activities: allActivities })}
                </>
            )}

            {appMode === 'full' && (
                <>
                    <div className="space-y-4 md:hidden">
                        {visibleGroups.map((group, groupIndex) => renderMobileGroup(group, groupIndex))}
                    </div>

                    {desktopTable && (
                        <div className={desktopTable.wrapperClassName ?? 'hidden md:block overflow-x-auto pb-4'}>
                            <div className={desktopTable.innerClassName ?? 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface'}>
                                <table className={desktopTable.tableClassName ?? 'w-full border-collapse text-sm'}>
                                    {renderDesktopHeader()}
                                    <tbody className={desktopTable.bodyClassName ?? 'bg-white dark:bg-dark-surface'}>
                                        {visibleDesktopGroups.map((group, groupIndex) => (
                                            <React.Fragment key={group.key}>
                                                {desktopTable.renderGroupHeader?.(group, {
                                                    appMode,
                                                    group,
                                                    groupIndex,
                                                    columnCount: desktopLeafColumns.length,
                                                    columns: desktopLeafColumns,
                                                })}
                                                {group.activities.map((activity, index) => (
                                                    <React.Fragment key={activity.id}>
                                                        {renderDesktopRow(activity, buildContext(group, groupIndex, activity, index))}
                                                    </React.Fragment>
                                                ))}
                                                {desktopTable.renderGroupFooter?.(group, {
                                                    appMode,
                                                    group,
                                                    groupIndex,
                                                    columnCount: desktopLeafColumns.length,
                                                    columns: desktopLeafColumns,
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                    {desktopTable.footer?.({
                                        appMode,
                                        groups: visibleDesktopGroups,
                                        activities: allDesktopActivities,
                                        columnCount: desktopLeafColumns.length,
                                        columns: desktopLeafColumns,
                                    })}
                                </table>
                            </div>
                        </div>
                    )}

                    {renderFooter?.({ appMode, groups: visibleGroups, activities: allActivities })}
                </>
            )}

            {renderTray?.({ appMode, groups: visibleGroups, activities: allActivities })}
        </>
    );
}
