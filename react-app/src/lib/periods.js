const QUARTER_ORDINALS = ['', '1st', '2nd', '3rd', '4th'];
const TRIMESTER_ORDINALS = ['', '1st', '2nd', '3rd'];

export const DEFAULT_QUARTER_RANGES = {
  1: { start: 1, end: 3 },
  2: { start: 4, end: 6 },
  3: { start: 7, end: 9 },
  4: { start: 10, end: 12 },
};

export const DEFAULT_TRIMESTER_RANGES = {
  1: { start: 6, end: 9 },
  2: { start: 9, end: 12 },
  3: { start: 1, end: 4 },
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

export function getCurrentTrimesterNumber(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month >= 6 && month <= 9) return 1;
  if (month >= 10 && month <= 12) return 2;
  return 3;
}

export function getQuarterLabel(quarter, year) {
  return `${QUARTER_ORDINALS[quarter] ?? quarter} Quarter CY ${year}`;
}

export function getTrimesterLabel(trimester, year) {
  return `${TRIMESTER_ORDINALS[trimester] ?? trimester} Trimester CY ${year}`;
}

export function getCurrentPeriodLabel(role, date = new Date()) {
  const year = getDefaultReportingYear(role, date);
  return role === 'School'
    ? getTrimesterLabel(getCurrentTrimesterNumber(date), year)
    : getQuarterLabel(getCurrentQuarterNumber(date), year);
}

export function getPeriodNumber(label) {
  const match = String(label ?? '').match(/^([1-4])(?:st|nd|rd|th)\s+(?:Quarter|Trimester)\s+CY\s+\d{4}$/i);
  return match ? Number(match[1]) : 1;
}

export function getPeriodYear(label, fallbackRole) {
  const match = String(label ?? '').match(/\bCY\s+(\d{4})\b/i);
  return match ? Number(match[1]) : getDefaultReportingYear(fallbackRole);
}

export function getPeriodTypeForRole(role) {
  return role === 'School' ? 'trimester' : 'quarter';
}

export function periodPrefix(periodType) {
  return periodType === 'trimester' ? 'T' : 'Q';
}

export function periodNoun(periodType) {
  return periodType === 'trimester' ? 'trimester' : 'quarter';
}

export function activityOverlapsPeriod(startMonth, endMonth, periodNumber, periodType, periodRange = null) {
  if (!startMonth || !endMonth) return true;
  if (periodRange?.start && periodRange?.end) {
    return startMonth <= periodRange.end && endMonth >= periodRange.start;
  }
  if (periodType === 'trimester') {
    const range = DEFAULT_TRIMESTER_RANGES[periodNumber];
    return range ? startMonth <= range.end && endMonth >= range.start : true;
  }

  const range = DEFAULT_QUARTER_RANGES[periodNumber];
  return range ? startMonth <= range.end && endMonth >= range.start : true;
}
