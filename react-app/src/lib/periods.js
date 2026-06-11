const QUARTER_ORDINALS = ['', '1st', '2nd', '3rd', '4th'];

export const DEFAULT_QUARTER_RANGES = {
  1: { start: 1, end: 3 },
  2: { start: 4, end: 6 },
  3: { start: 7, end: 9 },
  4: { start: 10, end: 12 },
};

export function getSchoolYearStart(date = new Date()) {
  return date.getMonth() + 1 >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

export function getDefaultReportingYear(role, date = new Date()) {
  return role === 'School' ? getSchoolYearStart(date) : date.getFullYear();
}

export function getCurrentQuarterNumber(date = new Date()) {
  return Math.ceil((date.getMonth() + 1) / 3);
}

// Removed getCurrentTrimesterNumber

export function getQuarterLabel(quarter, year) {
  return `${QUARTER_ORDINALS[quarter] ?? quarter} Quarter CY ${year}`;
}

// Removed getTrimesterLabel

export function getCurrentPeriodLabel(role, date = new Date()) {
  const year = getDefaultReportingYear(role, date);
  return getQuarterLabel(getCurrentQuarterNumber(date), year);
}

export function getPeriodNumber(label) {
  const match = String(label ?? '').match(/^([1-4])(?:st|nd|rd|th)\s+Quarter\s+CY\s+\d{4}$/i);
  return match ? Number(match[1]) : 1;
}

export function getPeriodYear(label, fallbackRole) {
  const match = String(label ?? '').match(/\bCY\s+(\d{4})\b/i);
  return match ? Number(match[1]) : getDefaultReportingYear(fallbackRole);
}

export function getPeriodTypeForRole(role) {
  return 'quarter';
}

export function periodPrefix(periodType) {
  return 'Q';
}

export function periodNoun(periodType) {
  return 'quarter';
}

export function activityOverlapsPeriod(startMonth, endMonth, periodNumber, periodType, periodRange = null) {
  if (!startMonth || !endMonth) return true;
  if (periodRange?.start && periodRange?.end) {
    return startMonth <= periodRange.end && endMonth >= periodRange.start;
  }

  const range = DEFAULT_QUARTER_RANGES[periodNumber];
  return range ? startMonth <= range.end && endMonth >= range.start : true;
}
