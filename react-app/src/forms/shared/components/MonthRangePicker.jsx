import React from 'react';

const MONTHS = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' },
];

export default function MonthRangePicker({
    startMonth,
    endMonth,
    onStartChange,
    onEndChange,
    compact = false,
}) {
    const selectClass = compact
        ? 'w-full appearance-none cursor-pointer rounded border border-transparent bg-transparent p-1 text-center text-sm font-medium text-slate-700 outline-none focus:border-slate-300 focus:bg-white dark:text-slate-200 dark:focus:border-dark-border dark:focus:bg-dark-surface'
        : 'w-full appearance-none cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 dark:border-dark-border dark:bg-dark-surface dark:text-slate-100';

    return (
        <div className={compact ? 'flex items-center gap-1' : 'flex items-center gap-2'}>
            <select
                value={startMonth || ''}
                onChange={(event) => {
                    const value = event.target.value ? parseInt(event.target.value, 10) : '';
                    onStartChange(value);
                    if (value && endMonth && parseInt(endMonth, 10) < value) {
                        onEndChange(value);
                    }
                }}
                className={selectClass}
            >
                <option value="">Start</option>
                {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                        {month.label}
                    </option>
                ))}
            </select>
            <span className="shrink-0 text-xs text-slate-300 dark:text-slate-600">to</span>
            <select
                value={endMonth || ''}
                onChange={(event) => onEndChange(event.target.value ? parseInt(event.target.value, 10) : '')}
                className={selectClass}
            >
                <option value="">End</option>
                {MONTHS.filter((month) => !startMonth || month.value >= parseInt(startMonth, 10)).map((month) => (
                    <option key={month.value} value={month.value}>
                        {month.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
