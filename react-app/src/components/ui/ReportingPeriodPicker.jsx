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
    <div className="flex items-center gap-2 bg-white/10 px-2 py-1.5 rounded-lg border border-white/20 text-sm">
      <Calendar className="w-4 h-4 text-white/70 hidden sm:block" />
      
      <select
        value={selectedYear}
        onChange={(e) => setReportingPeriod({ year: parseInt(e.target.value, 10), quarter: selectedQuarter })}
        className="bg-transparent border-none text-white outline-none cursor-pointer hover:bg-white/10 rounded px-1"
      >
        {yearOptions.map(y => (
          <option key={y} value={y} className="text-gray-900 bg-white">FY {y}</option>
        ))}
      </select>

      <span className="text-white/30 font-light">|</span>

      <select
        value={selectedQuarter}
        onChange={(e) => setReportingPeriod({ year: selectedYear, quarter: parseInt(e.target.value, 10) })}
        className="bg-transparent border-none text-white outline-none cursor-pointer hover:bg-white/10 rounded px-1"
      >
        <option value={1} className="text-gray-900 bg-white">Q1</option>
        <option value={2} className="text-gray-900 bg-white">Q2</option>
        <option value={3} className="text-gray-900 bg-white">Q3</option>
        <option value={4} className="text-gray-900 bg-white">Q4</option>
      </select>

      <span className="text-white/30 font-light hidden sm:inline">|</span>

      {!isLivePeriod ? (
        <div className="flex items-center gap-2">
          <span className="text-yellow-300 text-xs font-medium hidden sm:inline bg-yellow-400/20 px-1.5 py-0.5 rounded">Demo Period</span>
          <button
            onClick={resetToLivePeriod}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded transition-colors"
          >
            Live
          </button>
        </div>
      ) : (
        <span className="flex items-center gap-1 text-green-300 text-xs font-medium">
          <CheckCircle weight="fill" className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live</span>
        </span>
      )}
    </div>
  );
}
