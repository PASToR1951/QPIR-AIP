import React from 'react';

export function OnboardingSnapshot({ onboardingData, onboardingDays, setOnboardingDays, onboardingError }) {
  return (
    <div className="mt-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Onboarding</p>
          <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">Completion snapshot</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tracks completed, in-progress, dismissed, and not-started onboarding states by role.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          Date Range
          <select
            value={onboardingDays}
            onChange={(e) => setOnboardingDays(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base px-3 py-2 text-sm font-bold normal-case tracking-normal text-slate-700 dark:text-slate-200"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All users</option>
          </select>
        </label>
      </div>
      {onboardingError ? (
        <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-300">
          {onboardingError}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { key: 'completed', label: 'Onboarded', value: onboardingData?.summary?.completed ?? 0 },
              { key: 'in_progress', label: 'In Progress', value: onboardingData?.summary?.in_progress ?? 0 },
              { key: 'dismissed', label: 'Dismissed', value: onboardingData?.summary?.dismissed ?? 0 },
              { key: 'not_started', label: 'Not Started', value: onboardingData?.summary?.not_started ?? 0 },
            ].map((card) => (
              <div key={card.key} className="rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/80 dark:bg-dark-base/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{card.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-border">
                  {['Role', 'Completed', 'In Progress', 'Dismissed', 'Not Started', 'Total'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-dark-border/70">
                {(onboardingData?.byRole ?? []).map((row) => (
                  <tr key={row.role}>
                    <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100">{row.role}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.completed}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.in_progress}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.dismissed}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.not_started}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
