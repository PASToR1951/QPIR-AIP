export type PeriodRange = { start: number; end: number };

export const DEFAULT_QUARTER_MONTHS: Record<number, PeriodRange> = {
  1: { start: 1, end: 3 },
  2: { start: 4, end: 6 },
  3: { start: 7, end: 9 },
  4: { start: 10, end: 12 },
};

export const DEFAULT_TRIMESTER_MONTHS: Record<number, PeriodRange> = {
  1: { start: 6, end: 9 },
  2: { start: 9, end: 12 },
  3: { start: 1, end: 4 },
};

export function isValidMonth(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 &&
    (value as number) <= 12;
}

export function isValidMonthRange(start: unknown, end: unknown): boolean {
  return isValidMonth(start) && isValidMonth(end) &&
    (start as number) <= (end as number);
}

export function getDefaultQuarterRange(quarter: number): PeriodRange {
  return DEFAULT_QUARTER_MONTHS[quarter] ?? DEFAULT_QUARTER_MONTHS[1];
}

export function getDefaultTrimesterRange(trimester: number): PeriodRange {
  return DEFAULT_TRIMESTER_MONTHS[trimester] ?? DEFAULT_TRIMESTER_MONTHS[1];
}

export function resolveMonthRange(
  startMonth: unknown,
  endMonth: unknown,
  fallback: PeriodRange,
): PeriodRange {
  const start = Number(startMonth);
  const end = Number(endMonth);
  if (isValidMonthRange(start, end)) {
    return { start, end };
  }
  return fallback;
}

export function activityOverlapsMonthRange(
  activityStartMonth: number,
  activityEndMonth: number,
  range: PeriodRange,
): boolean {
  return activityStartMonth <= range.end && activityEndMonth >= range.start;
}

export function periodStartDate(year: number, range: PeriodRange): Date {
  return new Date(year, range.start - 1, 1);
}
