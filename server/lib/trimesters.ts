import {
  activityOverlapsMonthRange,
  DEFAULT_TRIMESTER_MONTHS,
} from "./periodRanges.ts";

export const TRIMESTER_COUNT = 3;

export const TRIMESTER_MONTHS = DEFAULT_TRIMESTER_MONTHS;

const TRIMESTER_LABEL_PATTERN =
  /^([1-3])(?:st|nd|rd|th)\s+trimester\s+cy\s+(\d{4})$/i;
const SHORT_TRIMESTER_PATTERN = /^t\s*([1-3])\s+cy\s+(\d{4})$/i;

function ordinalTrimester(trimester: number): string {
  const ordinals = ["", "1st", "2nd", "3rd"];
  return ordinals[trimester] ?? String(trimester);
}

export function normalizeTrimesterLabel(value: string): string {
  const compact = value.trim().replace(/\s+/g, " ");
  const match = compact.match(TRIMESTER_LABEL_PATTERN) ??
    compact.match(SHORT_TRIMESTER_PATTERN);
  if (!match) return compact;

  return getTrimesterLabel(Number(match[1]), Number(match[2]));
}

export function parseTrimesterLabel(
  label: string,
): { year: number; trimester: number } | null {
  const match = label.trim().replace(/\s+/g, " ").match(
    TRIMESTER_LABEL_PATTERN,
  ) ?? label.trim().replace(/\s+/g, " ").match(SHORT_TRIMESTER_PATTERN);
  if (!match) return null;
  return { trimester: Number(match[1]), year: Number(match[2]) };
}

export function isValidTrimester(trimester: unknown): trimester is number {
  return Number.isInteger(trimester) &&
    (trimester as number) >= 1 &&
    (trimester as number) <= TRIMESTER_COUNT;
}

export function getTrimesterNumbers(): number[] {
  return Array.from({ length: TRIMESTER_COUNT }, (_, i) => i + 1);
}

export function getTrimesterLabel(trimester: number, year: number): string {
  return `${ordinalTrimester(trimester)} Trimester CY ${year}`;
}

export function getSchoolYearStart(date = new Date()): number {
  const month = date.getMonth() + 1;
  return month >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

export function getDefaultReportingYear(
  role: string,
  date = new Date(),
): number {
  return role === "School" ? getSchoolYearStart(date) : date.getFullYear();
}

export function activityOverlapsTrimester(
  startMonth: number,
  endMonth: number,
  trimester: number,
): boolean {
  const months = TRIMESTER_MONTHS[trimester];
  if (!months) return false;
  return activityOverlapsMonthRange(startMonth, endMonth, months);
}
