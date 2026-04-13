import React from 'react';
import { TextareaAuto } from '../../ui/TextareaAuto';
import {
    TABLE_CELL_CLASSNAME, TABLE_NUMBER_INPUT_CLASSNAME,
    TABLE_TEXTAREA_CLASSNAME, TABLE_DELETE_BUTTON_CLASSNAME,
    sanitizeDecimalInput,
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
        <input
            type="number" inputMode="decimal"
            className={TABLE_NUMBER_INPUT_CLASSNAME}
            value={activity[field]}
            onChange={(e) => handleActivityChange(activity.id, field, sanitizeDecimalInput(e.target.value))}
        />
    );
}

function gapCell(field, calculateGap, targetField, accField) {
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

const subHeader = (label) => `border-r border-slate-200 p-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500`;

export function buildDesktopTableConfig({ handleActivityChange, calculateGap, handleAddActivity }) {
    return {
        wrapperClassName: 'hidden md:block overflow-visible overflow-x-auto pb-4',
        innerClassName:   'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface',
        tableClassName:   'w-full min-w-[900px] border-collapse text-sm',
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
                        <TextareaAuto placeholder="Describe activity..." className={TABLE_TEXTAREA_CLASSNAME}
                            value={activity.name}
                            onChange={(e) => handleActivityChange(activity.id, 'name', e.target.value)}
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
                        <TextareaAuto placeholder="e.g. January to March"
                            className="w-full rounded-md border border-transparent bg-transparent p-1 text-xs font-medium text-slate-600 focus:border-slate-300 focus:bg-white dark:text-slate-300 dark:focus:border-dark-border dark:focus:bg-dark-surface"
                            value={activity.implementation_period}
                            onChange={(e) => handleActivityChange(activity.id, 'implementation_period', e.target.value)}
                        />
                    )
                ),
            },
            {
                key: 'target', header: 'Target',
                headerClassName: 'border-r border-slate-200 p-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                columns: [
                    { key: 'target-physical',  header: 'Physical',  headerClassName: subHeader(), cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('physTarget', handleActivityChange) },
                    { key: 'target-financial', header: 'Financial', headerClassName: subHeader(), cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('finTarget',  handleActivityChange) },
                ],
            },
            {
                key: 'accomplishment', header: 'Accomplishment',
                headerClassName: 'border-r border-slate-200 p-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                columns: [
                    { key: 'accomplishment-physical',  header: 'Physical',  headerClassName: subHeader(), cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('physAcc', handleActivityChange) },
                    { key: 'accomplishment-financial', header: 'Financial', headerClassName: subHeader(), cellClassName: 'h-px border-r border-slate-200 p-1 align-top dark:border-dark-border', renderCell: numberCell('finAcc',  handleActivityChange) },
                ],
            },
            {
                key: 'gap', header: 'Gap (%)',
                headerClassName: 'border-r border-slate-200 p-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-dark-border dark:text-slate-300',
                columns: [
                    { key: 'gap-physical',  header: 'Physical',  headerClassName: subHeader(), cellClassName: 'h-px border-r border-slate-200 bg-slate-50/50 p-1 align-top dark:border-dark-border dark:bg-dark-base/50', renderCell: gapCell('physGap', calculateGap, 'physTarget', 'physAcc') },
                    { key: 'gap-financial', header: 'Financial', headerClassName: subHeader(), cellClassName: 'h-px border-r border-slate-200 bg-slate-50/50 p-1 align-top dark:border-dark-border dark:bg-dark-base/50', renderCell: gapCell('finGap',  calculateGap, 'finTarget',  'finAcc')  },
                ],
            },
            {
                key: 'actions', header: 'Actions to Address Gap',
                headerClassName: 'w-1/5 p-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300',
                cellClassName: 'p-3 align-top',
                renderCell: (activity) => (
                    <TextareaAuto placeholder="Resolutions..." className={TABLE_TEXTAREA_CLASSNAME}
                        value={activity.actions}
                        onChange={(e) => handleActivityChange(activity.id, 'actions', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddActivity(); }}
                    />
                ),
            },
            {
                key: 'remove', header: '', headerClassName: 'w-14 border-none', cellClassName: 'w-10 p-2 text-center align-middle',
                renderCell: (activity, context) => (
                    context.canRemove ? (
                        <button type="button" onClick={() => context.remove()} className={TABLE_DELETE_BUTTON_CLASSNAME} title="Delete Row">
                            <TrashIcon />
                        </button>
                    ) : null
                ),
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
