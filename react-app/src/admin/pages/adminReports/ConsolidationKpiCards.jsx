import { FileText, TrendUp, Wallet, Coins, Checks } from '@phosphor-icons/react';

function rateColor(rate) {
  if (rate >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40' };
  if (rate >= 50) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' };
  return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/40' };
}

function formatBudget(amount) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

export function ConsolidationKpiCards({ kpis }) {
  if (!kpis) return null;

  const physColor = rateColor(kpis.physicalAccomplishmentRate);
  const finColor = rateColor(kpis.financialAccomplishmentRate);
  const complianceRate = kpis.totalActivities > 0
    ? Math.round((kpis.complianceCount / kpis.totalActivities) * 100)
    : 0;
  const compColor = rateColor(complianceRate);
  const totalBudget = (kpis.totalBudgetDivision || 0) + (kpis.totalBudgetCoPSF || 0);

  const cards = [
    {
      icon: <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
      value: kpis.totalPIRs,
      sub: `${kpis.totalSchools} schools / ${kpis.totalPrograms} programs`,
      label: 'Total PIRs',
      valueClass: 'text-slate-800 dark:text-slate-100',
    },
    {
      icon: <TrendUp size={18} className={physColor.text} />,
      iconBg: physColor.bg,
      value: `${kpis.physicalAccomplishmentRate}%`,
      label: 'Physical Rate',
      valueClass: physColor.text,
    },
    {
      icon: <Wallet size={18} className={finColor.text} />,
      iconBg: finColor.bg,
      value: `${kpis.financialAccomplishmentRate}%`,
      label: 'Financial Rate',
      valueClass: finColor.text,
    },
    {
      icon: <Coins size={18} className="text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
      value: `\u20B1${formatBudget(totalBudget)}`,
      label: 'Total Budget',
      valueClass: 'text-slate-800 dark:text-slate-100',
    },
    {
      icon: <Checks size={18} className={compColor.text} />,
      iconBg: compColor.bg,
      value: `${complianceRate}%`,
      sub: `${kpis.complianceCount}/${kpis.totalActivities} activities`,
      label: 'Compliance Rate',
      valueClass: compColor.text,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-surface">
          <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${card.iconBg}`}>{card.icon}</div>
          <p className={`text-2xl font-black ${card.valueClass}`}>{card.value}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{card.label}</p>
          {card.sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}
