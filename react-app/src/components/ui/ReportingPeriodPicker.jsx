import React from 'react';
import { useReportingPeriod } from '../../context/ReportingPeriodContext.jsx';
import { Calendar, CheckCircle } from '@phosphor-icons/react';

export function ReportingPeriodPicker() {
  const {
    selectedYear,
    selectedQuarter,
    isLivePeriod,
    setReportingPeriod,
    resetToLivePeriod
  } = useReportingPeriod();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear + 1 - 2020 + 1 }, (_, i) => currentYear + 1 - i);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/70 px-2 py-1.5 text-sm text-slate-700 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
      <Calendar className="hidden h-4 w-4 text-slate-500 dark:text-slate-300 sm:block" />
      
      <select
        aria-label="Fiscal year"
        value={selectedYear}
        onChange={(e) => setReportingPeriod({ year: parseInt(e.target.value, 10), quarter: selectedQuarter })}
        className="cursor-pointer rounded border-none bg-transparent px-1 font-semibold text-slate-700 outline-none hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
      >
        {yearOptions.map(y => (
          <option key={y} value={y} className="text-gray-900 bg-white">FY {y}</option>
        ))}
      </select>

      <span className="font-light text-slate-300 dark:text-white/30">|</span>

      <select
        aria-label="Quarter"
        value={selectedQuarter}
        onChange={(e) => setReportingPeriod({ year: selectedYear, quarter: parseInt(e.target.value, 10) })}
        className="cursor-pointer rounded border-none bg-transparent px-1 font-semibold text-slate-700 outline-none hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
      >
        <option value={1} className="text-gray-900 bg-white">Q1</option>
        <option value={2} className="text-gray-900 bg-white">Q2</option>
        <option value={3} className="text-gray-900 bg-white">Q3</option>
        <option value={4} className="text-gray-900 bg-white">Q4</option>
      </select>

      <span className="hidden font-light text-slate-300 dark:text-white/30 sm:inline">|</span>

      {!isLivePeriod ? (
        <div className="flex items-center gap-2">
          <span className="hidden rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-400/20 dark:text-amber-200 sm:inline">Demo Period</span>
          <button
            onClick={resetToLivePeriod}
            className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
          >
            Live
          </button>
        </div>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle weight="fill" className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live</span>
        </span>
      )}
    </div>
  );
}
