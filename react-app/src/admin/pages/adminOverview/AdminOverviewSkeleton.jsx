import React from 'react';

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse overflow-hidden rounded-[2rem] border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-col divide-y divide-slate-100 lg:flex-row lg:divide-x lg:divide-y-0 dark:divide-dark-border">
          <div className="flex-1 space-y-3 p-8 md:p-10">
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-dark-border" />
            <div className="h-9 w-72 rounded-xl bg-slate-200 dark:bg-dark-border" />
            <div className="h-4 w-80 rounded bg-slate-100 dark:bg-dark-border/60" />
            <div className="flex gap-3 pt-4">
              <div className="h-10 w-40 rounded-2xl bg-slate-200 dark:bg-dark-border" />
              <div className="h-10 w-24 rounded-2xl bg-slate-100 dark:bg-dark-border/60" />
            </div>
          </div>
          <div className="w-full space-y-3 p-5 lg:w-80 xl:w-96">
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-dark-border" />
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-12 rounded-xl bg-slate-100 dark:bg-dark-border/50" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
            <div className="mb-4 h-4 w-40 rounded-lg bg-slate-200 dark:bg-dark-border" />
            <div className="h-52 rounded-xl bg-slate-100 dark:bg-dark-border/50" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-4 h-4 w-36 rounded-lg bg-slate-200 dark:bg-dark-border" />
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-10 rounded-lg bg-slate-100 dark:bg-dark-border/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
