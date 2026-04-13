export const STATUS_PILL = {
  submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  missing: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  na: 'bg-slate-100 text-slate-400 dark:bg-dark-border dark:text-slate-600',
};

export const STATUS_SYMBOL = {
  submitted: '✓',
  missing: '✗',
  na: '—',
};

export function rateBarColor(rate) {
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function rateBarTrack(rate) {
  if (rate >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (rate >= 50) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-rose-100 dark:bg-rose-900/30';
}

export function rateTextColor(rate) {
  if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function rowBorderColor(rate) {
  if (rate === null) return 'border-l-slate-300 dark:border-l-slate-600';
  if (rate >= 80) return 'border-l-emerald-400 dark:border-l-emerald-600';
  if (rate >= 50) return 'border-l-amber-400 dark:border-l-amber-600';
  return 'border-l-rose-400 dark:border-l-rose-600';
}

export function buildComplianceRows(data) {
  return data.matrix.map((row) => {
    const eligible = data.programs.filter((program) => row[program] !== 'na').length;
    const submitted = data.programs.filter((program) => row[program] === 'submitted').length;
    const missing = data.programs.filter((program) => row[program] === 'missing').length;
    const rate = eligible === 0 ? null : Math.round((submitted / eligible) * 100);
    const missingPrograms = data.programs.filter((program) => row[program] === 'missing');
    return { ...row, eligible, submitted, missing, rate, missingPrograms };
  });
}

export function buildComplianceKpi(rows) {
  const totalSubmitted = rows.reduce((sum, row) => sum + row.submitted, 0);
  const totalEligible = rows.reduce((sum, row) => sum + row.eligible, 0);

  return {
    total: rows.length,
    compliant: rows.filter((row) => row.missing === 0 && row.eligible > 0).length,
    withMissing: rows.filter((row) => row.missing > 0).length,
    overallRate: totalEligible === 0 ? 0 : Math.round((totalSubmitted / totalEligible) * 100),
  };
}

export function filterComplianceRows(rows, { search, filter, sort }) {
  let nextRows = rows;

  if (search.trim()) {
    const query = search.trim().toLowerCase();
    nextRows = nextRows.filter((row) => row.school.toLowerCase().includes(query));
  }

  if (filter === 'missing') nextRows = nextRows.filter((row) => row.missing > 0);
  if (filter === 'compliant') nextRows = nextRows.filter((row) => row.missing === 0 && row.eligible > 0);
  if (sort === 'name') nextRows = [...nextRows].sort((left, right) => left.school.localeCompare(right.school));
  if (sort === 'rate-asc') nextRows = [...nextRows].sort((left, right) => (left.rate ?? 101) - (right.rate ?? 101));

  return nextRows;
}
