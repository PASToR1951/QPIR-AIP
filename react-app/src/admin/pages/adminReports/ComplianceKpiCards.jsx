import { Buildings, ChartBar, CheckCircle, Warning } from '@phosphor-icons/react';
import { rateTextColor } from './complianceUtils.js';

export function ComplianceKpiCards({ kpi }) {
  const cards = [
    {
      icon: <Buildings size={18} className="text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
      value: kpi.total,
      label: 'Total Schools',
      valueClass: 'text-slate-800 dark:text-slate-100',
    },
    {
      icon: <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
      value: kpi.compliant,
      label: 'Fully Compliant',
      valueClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: <Warning size={18} weight="fill" className="text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-100 dark:bg-rose-950/40',
      value: kpi.withMissing,
      label: 'With Missing AIPs',
      valueClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      icon: <ChartBar size={18} className={rateTextColor(kpi.overallRate)} />,
      iconBg: kpi.overallRate >= 80
        ? 'bg-emerald-100 dark:bg-emerald-950/40'
        : kpi.overallRate >= 50
        ? 'bg-amber-100 dark:bg-amber-950/40'
        : 'bg-rose-100 dark:bg-rose-950/40',
      value: `${kpi.overallRate}%`,
      label: 'Overall Rate',
      valueClass: rateTextColor(kpi.overallRate),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-surface">
          <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${card.iconBg}`}>{card.icon}</div>
          <p className={`text-2xl font-black ${card.valueClass}`}>{card.value}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
