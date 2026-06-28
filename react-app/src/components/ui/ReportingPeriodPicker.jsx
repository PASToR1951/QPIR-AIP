import React from 'react';
import { useReportingPeriod } from '../../context/ReportingPeriodContext.jsx';
import { ArrowClockwise, CalendarBlank, CaretDown, CheckCircle } from '@phosphor-icons/react';

function PeriodSelect({ ariaLabel, value, onChange, options, disabled, renderOption }) {
  return (
    <div className="relative h-8 shrink-0">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-full cursor-pointer appearance-none rounded-md border border-transparent bg-transparent py-1 pl-2 pr-7 text-sm font-black leading-none text-slate-800 outline-none transition-colors hover:bg-slate-100 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 dark:hover:bg-white/10 dark:focus:border-indigo-400/40 dark:focus:bg-white/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-slate-900">
            {renderOption(option)}
          </option>
        ))}
      </select>
      <CaretDown
        size={12}
        weight="bold"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
      />
    </div>
  );
}

export function ReportingPeriodPicker() {
  const {
    selectedYear,
    selectedQuarter,
    selectedQuarterLabel,
    isLivePeriod,
    availableYears,
    periodOptionsLoading,
    getAvailableQuartersForYear,
    setReportingPeriod,
    resetToLivePeriod
  } = useReportingPeriod();

  const yearOptions = availableYears?.includes(selectedYear)
    ? availableYears
    : [selectedYear, ...(availableYears ?? [])].sort((left, right) => right - left);
  const quarterOptions = getAvailableQuartersForYear?.(selectedYear) ?? [];
  const visibleQuarterOptions = quarterOptions.includes(selectedQuarter)
    ? quarterOptions
    : [selectedQuarter, ...quarterOptions].filter((quarter, index, list) => list.indexOf(quarter) === index);
  const handleYearChange = (event) => {
    const year = parseInt(event.target.value, 10);
    const quarters = getAvailableQuartersForYear?.(year) ?? [];
    setReportingPeriod({
      year,
      quarter: quarters.includes(selectedQuarter) ? selectedQuarter : (quarters[0] ?? selectedQuarter),
    });
  };
  const yearSelectOptions = yearOptions.map((year) => ({ value: year, year }));
  const quarterSelectOptions = visibleQuarterOptions.map((quarter) => ({ value: quarter, quarter }));
  const statusLabel = isLivePeriod ? 'Live' : 'Demo Period';

  return (
    <div
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-1.5 text-slate-700 shadow-sm shadow-slate-950/5 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-black/20"
      title={`Viewing ${selectedQuarterLabel}`}
    >
      <div className={`hidden h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 sm:flex dark:bg-white/10 dark:text-slate-300 ${periodOptionsLoading ? 'animate-pulse' : ''}`}>
        <CalendarBlank size={16} weight="bold" />
      </div>

      <div className="flex items-center gap-1 rounded-md bg-slate-50/80 p-0.5 dark:bg-black/10">
        <PeriodSelect
          ariaLabel="Fiscal year"
          value={selectedYear}
          onChange={handleYearChange}
          options={yearSelectOptions}
          renderOption={(option) => `FY ${option.year}`}
        />
        <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
        <PeriodSelect
          ariaLabel="Quarter"
          value={selectedQuarter}
          onChange={(e) => setReportingPeriod({ year: selectedYear, quarter: parseInt(e.target.value, 10) })}
          disabled={periodOptionsLoading && visibleQuarterOptions.length === 0}
          options={quarterSelectOptions}
          renderOption={(option) => `Q${option.quarter}`}
        />
      </div>

      <div className="hidden h-6 w-px bg-slate-200 dark:bg-white/10 sm:block" />

      <span
        className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-black ${
          isLivePeriod
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200'
        }`}
      >
        {isLivePeriod && <CheckCircle size={13} weight="fill" />}
        <span className="hidden sm:inline">{statusLabel}</span>
        <span className="sm:hidden">{isLivePeriod ? 'Live' : 'Demo'}</span>
      </span>

      {!isLivePeriod && (
        <button
          type="button"
          onClick={resetToLivePeriod}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-black text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-400/15 dark:hover:text-indigo-100"
        >
          <ArrowClockwise size={12} weight="bold" />
          <span className="hidden sm:inline">Live</span>
        </button>
      )}
    </div>
  );
}
