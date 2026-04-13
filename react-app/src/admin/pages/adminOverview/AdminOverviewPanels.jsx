import React from 'react';
import { motion as Motion } from 'framer-motion';
import {
  ArrowRight,
  CaretDown,
  CaretUp,
  ClockCounterClockwise,
  Eye,
  Notification,
} from '@phosphor-icons/react';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { fadeUp } from './chartTheme.js';
import { relativeTime, InfoTip } from './overviewHelpers.jsx';
import { PirClusterPanel } from './PirClusterPanel.jsx';

export function AdminOverviewPanels({
  clusterSort,
  currentQuarter,
  data,
  navigate,
  setClusterSort,
  sortedClusters,
}) {
  return (
    <Motion.div variants={fadeUp} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      {data?.pirClusterStatus?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <Notification size={17} weight="bold" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Q{currentQuarter} PIR Status by Cluster</h3>
              <InfoTip text="Shows how many PIRs each school has submitted this quarter vs the total number of programs they are required to implement." />
            </div>
            <button
              onClick={() => setClusterSort((previous) => (previous === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {clusterSort === 'desc' ? 'Highest' : 'Lowest'} first
              <span className="flex flex-col -space-y-1">
                <CaretUp size={10} weight="bold" className={clusterSort === 'asc' ? 'text-indigo-500' : 'opacity-30'} />
                <CaretDown size={10} weight="bold" className={clusterSort === 'desc' ? 'text-indigo-500' : 'opacity-30'} />
              </span>
            </button>
          </div>
          <div className="space-y-3">
            {sortedClusters.map((cluster) => (
              <PirClusterPanel key={cluster.id} cluster={cluster} navigate={navigate} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ClockCounterClockwise size={17} weight="bold" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Recent Submissions</h3>
          </div>
          <button
            onClick={() => navigate('/admin/submissions')}
            className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View All
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
        {data?.recentSubmissions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-border">
                  <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">School</th>
                  <th className="hidden px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap sm:table-cell">Program</th>
                  <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">Type</th>
                  <th className="hidden px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap md:table-cell">Quarter</th>
                  <th className="hidden px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap sm:table-cell">Submitted</th>
                  <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                {data.recentSubmissions.map((submission, index) => (
                  <tr key={index} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/20">
                    <td className="max-w-[140px] truncate px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">{submission.school}</td>
                    <td className="hidden max-w-[160px] truncate px-3 py-2.5 text-slate-600 dark:text-slate-400 sm:table-cell">{submission.program}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={submission.type} size="xs" /></td>
                    <td className="hidden px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 md:table-cell">{submission.quarter ?? '—'}</td>
                    <td className="hidden px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap sm:table-cell">{relativeTime(submission.submitted)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={submission.status} size="xs" /></td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => navigate(`/admin/submissions?review=${submission.id}`)}
                        className="text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-600">No submissions yet.</p>
        )}
      </div>
    </Motion.div>
  );
}
