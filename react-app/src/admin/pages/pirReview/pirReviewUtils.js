// ── Constants ──────────────────────────────────────────────────────────────

export const FACTOR_TYPES = [
  'Institutional', 'Technical', 'Infrastructure',
  'Learning Resources', 'Environmental', 'Others',
];

export const FLAG_CLS = {
  red:    'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  black:  'bg-slate-900 text-slate-100 dark:bg-dark-base dark:text-slate-200',
};

// ── Formatters ─────────────────────────────────────────────────────────────

export const fmt = (n) =>
  Number(n ?? 0).toLocaleString('en-PH');

export const fmtPeso = (n) =>
  `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function relativeDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Math helpers ───────────────────────────────────────────────────────────

export function pct(num, den) {
  const n = Number(num), d = Number(den);
  if (!d || isNaN(n) || isNaN(d)) return null;
  return Math.round((n / d) * 100);
}

export function calculateGap(target, accomplished) {
  const t = parseFloat(target) || 0;
  const a = parseFloat(accomplished) || 0;
  if (t > 0) {
    if (a >= t) return 0;
    return ((a - t) / t) * 100;
  }
  return 0;
}

// ── Validation flags ───────────────────────────────────────────────────────

export function getValidationFlags(review) {
  const flags = [];
  const pT = Number(review.physical_target);
  const fT = Number(review.financial_target);
  const pA = Number(review.physical_accomplished);
  const fA = Number(review.financial_accomplished);
  const physRate = pT > 0 ? pA / pT : null;
  const finRate  = fT > 0 ? fA / fT : null;

  if (!review.aip_activity_id)
    flags.push({ type: 'not_in_aip', label: 'Not in AIP', color: 'yellow' });
  if (physRate !== null && physRate < 0.5)
    flags.push({ type: 'low_phys', label: `Low: ${Math.round(physRate * 100)}%`, color: 'red' });
  if (finRate !== null && finRate > 1.05)
    flags.push({ type: 'overrun', label: 'Budget Overrun', color: 'orange' });
  if (physRate !== null && finRate !== null && physRate >= 0.9 && finRate < 0.1)
    flags.push({ type: 'suspicious', label: 'Suspicious', color: 'black' });

  return flags;
}
