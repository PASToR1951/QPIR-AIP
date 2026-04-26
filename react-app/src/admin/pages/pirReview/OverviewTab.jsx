import React from 'react';
import { Stamp, Warning, ChartBar, Checks, ListDashes } from '@phosphor-icons/react';
import { FlagChip, MetaField, RateBar, StatCard } from './ui.jsx';
import { fmt, fmtPeso, relativeDate, getValidationFlags } from './pirReviewUtils.js';

export function OverviewTab({
  metCount,
  overallFinPct,
  overallPhysPct,
  reviews,
  submittedBy,
  sub,
  totalFinAcc,
  totalFinTarget,
  totalFlags,
  totalPhysAcc,
  totalPhysTarget,
  lowCount,
  partialCount,
  pir,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Activities" value={reviews.length} icon={<ListDashes size={20} />} tooltip="Total AIP activities reported in this PIR quarter." />
        <StatCard label="Met (≥80%)" value={metCount} icon={<Checks size={20} />} color="emerald" tooltip="Activities where physical accomplishment reached at least 80% of the target." />
        <StatCard label="Partial (50–79%)" value={partialCount} icon={<ChartBar size={20} />} color="amber" tooltip="Activities where physical accomplishment is between 50% and 79% of the target." />
        <StatCard label="Low (<50%)" value={lowCount} icon={<Warning size={20} />} color="red" tooltip="Activities where physical accomplishment is below 50% of the target." />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-base">
          <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Physical Accomplishment</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{overallPhysPct}%</span>
            <span className="mb-1 text-xs text-slate-400">{fmt(totalPhysAcc)} / {fmt(totalPhysTarget)}</span>
          </div>
          <RateBar value={overallPhysPct} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-base">
          <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Financial Utilization</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{overallFinPct}%</span>
            <span className="mb-1 text-xs text-slate-400">{fmtPeso(totalFinAcc)} / {fmtPeso(totalFinTarget)}</span>
          </div>
          <RateBar value={overallFinPct} />
        </div>
      </div>

      {totalFlags.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/10">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <Warning size={14} weight="bold" /> Validation Issues ({totalFlags.length})
          </p>
          <div className="space-y-1.5">
            {reviews.flatMap((review) => {
              const flags = getValidationFlags(review);
              if (!flags.length) return [];
              return flags.map((flag) => (
                <div key={`${review.id}-${flag.type}`} className="flex items-center gap-2 text-xs">
                  <FlagChip flag={flag} />
                  <span className="text-slate-600 dark:text-slate-300">{review.aip_activity?.activity_name ?? 'Manual activity'}</span>
                </div>
              ));
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <MetaField label="Submitted By" value={submittedBy} />
          <MetaField label="Date Submitted" value={sub?.created_at ? relativeDate(sub.created_at) : '—'} />
          <MetaField label="Program Owner" value={sub?.program_owner} />
          <MetaField label="Budget (Division)" value={fmtPeso(pir?.budgetFromDivision)} />
          <MetaField label="Budget (CO-PSF)" value={fmtPeso(pir?.budgetFromCoPSF)} />
          <MetaField label="AIP Year" value={sub?.aip?.year} />
        </div>
      </div>

      {(pir?.cesReviewer || pir?.cesNotedAt || pir?.cesRemarks) && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-700/40 dark:bg-teal-950/10">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
            <Stamp size={14} /> Official Review Response
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {pir.cesReviewer && <MetaField label="Reviewer" value={pir.cesReviewer} />}
            {pir.cesNotedAt && <MetaField label="Noted At" value={relativeDate(pir.cesNotedAt)} />}
            {pir.cesRemarks && <MetaField label="Remarks" value={pir.cesRemarks} />}
          </div>
        </div>
      )}

    </div>
  );
}
