import { TextareaAuto } from '../../ui/TextareaAuto';
import {
    TABLE_CELL_CLASSNAME, TABLE_NUMBER_INPUT_CLASSNAME,
    TABLE_TEXTAREA_CLASSNAME, TABLE_DELETE_BUTTON_CLASSNAME,
    sanitizeDecimalInput, CommaNumberInput,
} from './pirMeStyles.jsx';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

function numberCell(field, handleActivityChange) {
    return (activity) => (
        <CommaNumberInput
            className={TABLE_NUMBER_INPUT_CLASSNAME}
            value={activity[field]}
            onChange={(e) => handleActivityChange(activity.id, field, sanitizeDecimalInput(e.target.value))}
        />
    );
}

function gapCell(calculateGap, targetField, accField) {
    return (activity) => {
        const gap = calculateGap(activity[targetField], activity[accField]);
        return (
            <input type="text" readOnly tabIndex={-1}
                className="pointer-events-none min-h-[44px] w-full select-none bg-transparent text-center font-mono text-sm font-bold outline-none"
                style={{ color: gap < 0 ? '#ef4444' : '#64748b' }}
                value={`${gap.toFixed(2)}%`}
            />
        );
    };
}

function textCell(field, handleActivityChange, placeholder) {
    return (activity) => (
        <TextareaAuto
            placeholder={placeholder}
            className={TABLE_TEXTAREA_CLASSNAME}
            value={activity[field] ?? ''}
            onChange={(e) => handleActivityChange(activity.id, field, e.target.value)}
        />
    );
}

const colHeader = 'border-r border-slate-200 p-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300';
const subHeader = 'border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500';

export function buildDesktopTableConfig({ handleActivityChange, calculateGap, handleAddActivity, activitiesCount }) {
    return {
        wrapperClassName: 'hidden md:block overflow-x-auto pb-4',
        innerClassName:   'w-max min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface',
        tableClassName:   'w-full min-w-[2000px] border-collapse text-sm',
        renderGroupHeader: (group, context) => {
            if (group.key !== 'unplanned') return null;
            return (
                <tr key="unplanned-separator" className="border-y-2 border-slate-300 bg-slate-100 dark:border-dark-border dark:bg-dark-base">
                    <td colSpan={context.columnCount} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Activities Conducted But Not Included in the AIP
                    </td>
                </tr>
            );
        },
        columnGroups: [
            {
                key: 'no',
                header: 'No',
                headerClassName: `w-14 ${colHeader}`,
                cellClassName: 'border-r border-slate-200 p-3 text-center align-top dark:border-dark-border',
                renderCell: (_, context) => (
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{context.index + 1}</span>
                        {context.canRemove && (
                            <button type="button" onClick={() => context.remove()} className={TABLE_DELETE_BUTTON_CLASSNAME} title="Delete Row">
                                <TrashIcon />
                            </button>
                        )}
                    </div>
                ),
            },
            {
                key: 'name',
                header: 'Activity / IES',
                headerClassName: `min-w-[250px] w-[250px] ${colHeader}`,
                cellClassName: TABLE_CELL_CLASSNAME,
                renderCell: (activity) => (
                    <div className="flex flex-col gap-1">
                        {activity.fromAIP ? (
                            <p className="break-words p-1 text-sm font-medium text-slate-700 dark:text-slate-200">{activity.name}</p>
                        ) : (
                            <TextareaAuto placeholder="Describe activity..." className={TABLE_TEXTAREA_CLASSNAME}
                                value={activity.name}
                                onChange={(e) => handleActivityChange(activity.id, 'name', e.target.value)}
                            />
                        )}
                        {activity.implementation_period && (
                            <span className="px-1 text-[10px] font-semibold text-blue-500">{activity.implementation_period}</span>
                        )}
                    </div>
                ),
            },
            {
                key: 'compliance',
                header: 'Complied',
                headerClassName: `w-[85px] ${colHeader}`,
                cellClassName: 'border-r border-slate-200 p-2 align-top dark:border-dark-border',
                renderCell: (activity) => {
                    if (!activity.fromAIP) {
                        return <span className="block text-center text-xs text-slate-300 dark:text-slate-600">—</span>;
                    }
                    return (
                        <div className="flex flex-col gap-1">
                            <button
                                type="button"
                                onClick={() => handleActivityChange(activity.id, 'complied', activity.complied === true ? null : true)}
                                className={`w-full rounded-lg border px-1.5 py-1 text-[11px] font-bold transition-colors ${activity.complied === true ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400 hover:border-emerald-300 dark:border-dark-border dark:text-slate-500'}`}
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => handleActivityChange(activity.id, 'complied', activity.complied === false ? null : false)}
                                className={`w-full rounded-lg border px-1.5 py-1 text-[11px] font-bold transition-colors ${activity.complied === false ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200 text-slate-400 hover:border-red-300 dark:border-dark-border dark:text-slate-500'}`}
                            >
                                No
                            </button>
                        </div>
                    );
                },
            },
            {
                key: 'actual-tasks',
                header: 'Actual Tasks Conducted',
                headerClassName: `min-w-[200px] w-[200px] ${colHeader}`,
                cellClassName: TABLE_CELL_CLASSNAME,
                renderCell: textCell('actualTasksConducted', handleActivityChange, 'Tasks conducted...'),
            },
            {
                key: 'contributory-indicators',
                header: 'Contributory Performance Indicators',
                headerClassName: `min-w-[200px] w-[200px] ${colHeader}`,
                cellClassName: TABLE_CELL_CLASSNAME,
                renderCell: textCell('contributoryIndicators', handleActivityChange, 'Indicators...'),
            },
            {
                key: 'movs',
                header: 'MOVs / Expected Outputs',
                headerClassName: `min-w-[200px] w-[200px] ${colHeader}`,
                cellClassName: TABLE_CELL_CLASSNAME,
                renderCell: textCell('movsExpectedOutputs', handleActivityChange, 'Means of verification...'),
            },
            {
                key: 'target', header: 'Quarterly Target',
                headerClassName: colHeader,
                columns: [
                    { key: 'target-physical',  header: 'Physical',  headerClassName: `w-[90px] min-w-[90px] ${subHeader}`, cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('physTarget', handleActivityChange) },
                    { key: 'target-financial', header: 'Financial', headerClassName: `w-[90px] min-w-[90px] ${subHeader}`, cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('finTarget',  handleActivityChange) },
                ],
            },
            {
                key: 'accomplishment', header: 'Accomplishment',
                headerClassName: colHeader,
                columns: [
                    { key: 'accomplishment-physical',  header: 'Physical',  headerClassName: `w-[90px] min-w-[90px] ${subHeader}`, cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('physAcc', handleActivityChange) },
                    { key: 'accomplishment-financial', header: 'Financial', headerClassName: `w-[90px] min-w-[90px] ${subHeader}`, cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('finAcc',  handleActivityChange) },
                ],
            },
            {
                key: 'gap', header: 'Gap (%)',
                headerClassName: colHeader,
                columns: [
                    { key: 'gap-physical',  header: 'Physical',  headerClassName: `w-[90px] min-w-[90px] ${subHeader}`, cellClassName: 'h-px border-r border-slate-200 bg-slate-50/50 p-1 align-top dark:border-dark-border dark:bg-dark-base/50', renderCell: gapCell(calculateGap, 'physTarget', 'physAcc') },
                    { key: 'gap-financial', header: 'Financial', headerClassName: `w-[90px] min-w-[90px] ${subHeader}`, cellClassName: 'h-px border-r border-slate-200 bg-slate-50/50 p-1 align-top dark:border-dark-border dark:bg-dark-base/50', renderCell: gapCell(calculateGap, 'finTarget',  'finAcc')  },
                ],
            },
            {
                key: 'actions', header: 'Actions to Address Gap',
                headerClassName: `min-w-[200px] w-[200px] ${colHeader}`,
                cellClassName: TABLE_CELL_CLASSNAME,
                renderCell: (activity) => (
                    <TextareaAuto placeholder="Resolutions..." className={TABLE_TEXTAREA_CLASSNAME}
                        value={activity.actions}
                        onChange={(e) => handleActivityChange(activity.id, 'actions', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddActivity(); }}
                    />
                ),
            },
            {
                key: 'adjustments', header: 'Adjustments',
                headerClassName: `min-w-[200px] w-[200px] ${colHeader}`,
                cellClassName: TABLE_CELL_CLASSNAME,
                renderCell: textCell('adjustments', handleActivityChange, 'Adjustments made...'),
            },
        ],
        renderGroupFooter: (group, context) => (
            <tr key={`${group.key}-footer`}>
                <td colSpan={context.columnCount} className="p-4">
                    <button type="button" onClick={group.onAdd}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-slate-50 hover:text-blue-600 active:scale-95 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-base"
                    >
                        <PlusIcon />{group.addLabel}
                    </button>
                </td>
            </tr>
        ),
    };
}
