// server/lib/cyQuarter.ts
// Simple Calendar Year (CY) quarter utilities — replaces the flexible term/trimester system.
// CY quarters are fixed: Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec.

const ORDINALS = ["1st", "2nd", "3rd", "4th"] as const;

export function getCurrentCYQuarter(date = new Date()): number {
  return Math.ceil((date.getMonth() + 1) / 3); // 1–4
}

export function getCYYear(date = new Date()): number {
  return date.getFullYear();
}

export function getCYQuarterLabel(quarter: number, year: number): string {
  return `${ORDINALS[quarter - 1]} Quarter CY ${year}`;
}

export function getCYQuarterMonths(quarter: number): { start: number; end: number } {
  return { start: (quarter - 1) * 3 + 1, end: quarter * 3 };
}

export function activityInCYQuarter(
  periodStartMonth: number | null,
  periodEndMonth: number | null,
  quarter: number,
): boolean {
  if (periodStartMonth == null || periodEndMonth == null) return true; // legacy: include all
  const { start, end } = getCYQuarterMonths(quarter);
  return periodStartMonth <= end && periodEndMonth >= start;
}

export function parseCYYear(quarterString: string): number {
  const m = quarterString.match(/CY (\d{4})/);
  return m ? parseInt(m[1]) : new Date().getFullYear();
}
