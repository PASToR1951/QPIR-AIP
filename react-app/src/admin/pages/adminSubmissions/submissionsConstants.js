export const TERM_OPTIONS = [
  { type: 'Trimester', label: 'Trimester', periodCount: 3 },
  { type: 'Quarterly', label: 'Quarterly', periodCount: 4 },
  { type: 'Bimester', label: 'Bimester', periodCount: 2 },
];

export const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export const STATUS_OPTIONS = [
  'Submitted', 'Under Review', 'For CES Review', 'For Cluster Head Review', 'Approved', 'Returned',
];

export const QUARTER_OPTIONS = [
  { label: '1st Quarter', value: '1st' },
  { label: '2nd Quarter', value: '2nd' },
  { label: '3rd Quarter', value: '3rd' },
  { label: '4th Quarter', value: '4th' },
];

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
  .map(y => ({ value: y, label: String(y) }));

export const GROUP_OPTIONS = [
  { key: 'flat',    label: 'Default' },
  { key: 'cluster', label: 'By Cluster' },
  { key: 'school',  label: 'By School' },
  { key: 'user',    label: 'By Submitter' },
  { key: 'quarter', label: 'By Quarter' },
  { key: 'status',  label: 'By Status' },
];

export function groupSubmissions(data, groupKey) {
  if (groupKey === 'flat') return null;
  const keyFn = {
    cluster: r => r.cluster || '—',
    school:  r => r.school  || '—',
    user:    r => r.submittedBy || '—',
    quarter: r => r.quarter || '— (AIP)',
    status:  r => r.status,
  }[groupKey];
  if (!keyFn) return null;
  const map = new Map();
  for (const row of data) {
    const k = keyFn(row);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => ({ groupKey: key, rows }));
}
