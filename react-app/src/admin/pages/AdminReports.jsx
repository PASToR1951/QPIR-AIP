import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { TABS } from './adminReports/constants.js';
import { REPORT_COMPONENTS } from './adminReports/reportRegistry.js';
import { ExportButtons, YearDropdown } from './adminReports/shared.jsx';
import { useReportYears } from './adminReports/useReportYears.js';

export default function AdminReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'compliance';
  const setTab = (key) => {
    setSearchParams((previousParams) => {
      previousParams.set('tab', key);
      return previousParams;
    });
  };

  const { year, setYear, availableYears } = useReportYears();
  const ActiveReport = REPORT_COMPONENTS[tab] ?? REPORT_COMPONENTS.compliance;

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-0 dark:border-dark-border">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`relative px-4 py-2.5 text-sm font-bold transition-colors ${tab === item.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {item.label}
              {tab === item.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-indigo-600 dark:bg-indigo-400" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pb-2">
          <YearDropdown year={year} setYear={setYear} availableYears={availableYears} />
          <ExportButtons type={tab} year={year} />
        </div>
      </div>

      <div id="report-content" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
        <ActiveReport year={year} />
      </div>
    </div>
  );
}
