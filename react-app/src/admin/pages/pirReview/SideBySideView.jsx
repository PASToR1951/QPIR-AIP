import { useMemo } from 'react';
import { fmt, fmtPeso, getValidationFlags, pct } from './pirReviewUtils.js';
import { FlagChip, RateBar } from './ui.jsx';

function SidePIRCard({ review, flags, physPct, finPct, measureText }) {
  const gapTextHeight = useMemo(() => {
    if (!review.actions_to_address_gap) return 0;
    return measureText(review.actions_to_address_gap, 280).height;
  }, [review.actions_to_address_gap, measureText]);

  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-3 space-y-2">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
        {review.aip_activity?.activity_name ?? <span className="italic text-slate-400">Manual entry</span>}
      </p>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flags.map(f => <FlagChip key={f.type} flag={f} />)}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-black mb-0.5">Physical</p>
          <p className="font-bold text-slate-700 dark:text-slate-200">{fmt(review.physical_accomplished)} / {fmt(review.physical_target)}</p>
          <RateBar value={physPct} />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-black mb-0.5">Financial</p>
          <p className="font-bold text-slate-700 dark:text-slate-200">{fmtPeso(review.financial_accomplished)}</p>
          <RateBar value={finPct} />
        </div>
      </div>
      {review.actions_to_address_gap && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic" style={{ minHeight: `${gapTextHeight}px` }}>
          Gap actions: {review.actions_to_address_gap}
        </p>
      )}
    </div>
  );
}

function SideAIPCard({ activity, greyed = false }) {
  if (!activity) return <div className="h-24 rounded-xl border border-dashed border-slate-200 dark:border-dark-border" />;
  return (
    <div className={`border rounded-xl p-3 space-y-2 ${greyed ? 'border-dashed border-slate-200 dark:border-dark-border opacity-50' : 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/40'}`}>
      {greyed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Not reported this quarter</p>}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{activity.activity_name}</p>
      <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span><span className="font-bold">Phase:</span> {activity.phase}</span>
        <span><span className="font-bold">Period:</span> {activity.implementation_period}</span>
        <span><span className="font-bold">Budget:</span> {fmtPeso(activity.budget_amount)}</span>
        <span><span className="font-bold">Source:</span> {activity.budget_source}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
        <span className="font-bold">Persons:</span> {activity.persons_involved}
      </p>
    </div>
  );
}

export function SideBySideView({ reviews, allAipActivities, measureText }) {
  const reviewedIds = new Set(reviews.map(r => r.aip_activity_id));
  const unreviewed  = allAipActivities.filter(a => !reviewedIds.has(a.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-dark-border pb-2">
          PIR Reported Activities
        </h3>
        {reviews.map(review => {
          const flags   = getValidationFlags(review);
          const physPct = pct(review.physical_accomplished, review.physical_target);
          const finPct  = pct(review.financial_accomplished, review.financial_target);
          return (
            <SidePIRCard key={review.id} review={review} flags={flags} physPct={physPct} finPct={finPct}
              measureText={measureText} />
          );
        })}
      </div>
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-dark-border pb-2">
          AIP Planned Activities
        </h3>
        {reviews.map(review => (
          <SideAIPCard key={review.id} activity={review.aip_activity} />
        ))}
        {unreviewed.map(a => (
          <SideAIPCard key={a.id} activity={a} greyed />
        ))}
      </div>
    </div>
  );
}
