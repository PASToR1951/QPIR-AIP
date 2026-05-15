const QUARTERS_PER_YEAR = 4;
const MONTHS_PER_QUARTER = 12 / QUARTERS_PER_YEAR;

export function getQuarterNumbers(): number[] {
  return Array.from({ length: QUARTERS_PER_YEAR }, (_, i) => i + 1);
}

export function isValidQuarter(quarter: unknown): quarter is number {
  return Number.isInteger(quarter) &&
    (quarter as number) >= 1 &&
    (quarter as number) <= QUARTERS_PER_YEAR;
}

export function buildDefaultDeadline(year: number, quarter: number): Date {
  const endMonth = quarter * MONTHS_PER_QUARTER;
  return new Date(year, endMonth, 0, 23, 59, 59, 999);
}

export function endOfDeadlineDay(date: Date | string): Date {
  const deadlineDate = new Date(date);
  deadlineDate.setHours(23, 59, 59, 999);
  return deadlineDate;
}
