import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CaretDown, CaretUp } from '@phosphor-icons/react';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';
import { pirPctBadge, pirBarTrack, pirBarColor, pirTextColor, InfoTip } from './overviewHelpers.jsx';

export function PirClusterPanel({ cluster: cl, navigate }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden">
      {/* Cluster header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/80 dark:hover:bg-dark-border/20 transition-colors"
      >
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 ${pirPctBadge(cl.pct)}`}>
          {cl.pct}%
        </span>
        <SchoolAvatar
          clusterNumber={cl.cluster_number}
          clusterLogo={cl.logo ?? null}
          name={`Cluster ${cl.cluster_number}`}
          size={32}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">
            Cluster {cl.cluster_number}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {cl.submittedAips}/{cl.totalAips} PIRs filed · {cl.approvedAips} approved · {cl.totalSchools} schools
          </p>
        </div>
        {/* Cluster-level progress bar */}
        <div className={`hidden sm:block w-32 h-2 rounded-full ${pirBarTrack(cl.pct)} shrink-0`}>
          <div className={`h-full rounded-full transition-all ${pirBarColor(cl.pct)}`} style={{ width: `${Math.max(cl.pct, 2)}%` }} />
        </div>
        <span className="text-slate-400 dark:text-slate-500 shrink-0">
          {open ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
        </span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
      {open && (
        <Motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="border-t border-slate-100 dark:border-dark-border overflow-hidden"
        >
          {/* Cluster summary row */}
          <div className="grid grid-cols-3 gap-3 px-4 py-3 bg-slate-50 dark:bg-dark-border/15 border-b border-slate-100 dark:border-dark-border/60">
            <div className="text-center">
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{cl.totalAips}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1">
                Expected PIRs <InfoTip text="Total number of PIRs all schools in this cluster are required to submit this quarter, based on their assigned programs." />
              </p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-black ${pirTextColor(cl.pct)}`}>{cl.submittedAips}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1">
                PIRs Filed <InfoTip text="PIRs submitted this quarter. Each AIP (program) requires its own PIR per quarter." />
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{cl.approvedAips}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1">
                Approved <InfoTip text="PIRs that have been reviewed and approved by admin this quarter." />
              </p>
            </div>
          </div>

          {/* Per-school list */}
          <div className="px-4 py-2">
            {/* Column header */}
            <div className="flex items-center gap-3 px-2 py-1.5 mb-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex-1">School</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 w-24 text-center hidden sm:block">Progress</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 w-20 text-right flex items-center justify-end gap-1">
                PIRs <InfoTip text="Submitted / Expected. Shows how many PIRs this school has filed out of the total programs it is required to implement." />
              </p>
            </div>
            {cl.schools.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">No schools in this cluster</p>
            )}
            {cl.schools.map(sch => (
              <div
                key={sch.id}
                className="flex items-center gap-3 px-2 py-2 -mx-0 rounded-lg hover:bg-slate-100/80 dark:hover:bg-dark-border/25 transition-colors cursor-default"
              >
                <SchoolAvatar
                  clusterNumber={cl.cluster_number}
                  schoolLogo={sch.logo ?? null}
                  clusterLogo={cl.logo ?? null}
                  name={sch.name}
                  size={28}
                  className="shrink-0"
                />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-0 flex-1 truncate">
                  {sch.name}
                  {sch.abbreviation && <span className="font-normal text-slate-400 dark:text-slate-500"> ({sch.abbreviation})</span>}
                </p>
                <div className={`hidden sm:block w-24 h-1.5 rounded-full ${pirBarTrack(sch.pct)} shrink-0`}>
                  <div className={`h-full rounded-full ${pirBarColor(sch.pct)}`} style={{ width: `${Math.max(sch.pct, sch.totalAips > 0 ? 3 : 0)}%` }} />
                </div>
                <span className={`text-xs font-black w-20 text-right shrink-0 tabular-nums ${pirTextColor(sch.pct)}`}>
                  {sch.submitted}/{sch.totalAips}
                </span>
              </div>
            ))}
          </div>

          {/* Footer link */}
          <div className="border-t border-slate-100 dark:border-dark-border/60 px-4 py-2.5">
            <button
              onClick={() => navigate(`/admin/submissions?type=pir&cluster=${cl.id}`)}
              className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 uppercase tracking-widest transition-colors"
            >
              View all submissions <ArrowRight size={12} weight="bold" />
            </button>
          </div>
        </Motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
