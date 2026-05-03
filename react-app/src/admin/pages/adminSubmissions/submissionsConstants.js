export const STATUS_OPTIONS = [
  'Submitted', 'Under Review', 'For Recommendation', 'For CES Review', 'Approved', 'Returned',
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
  { key: 'flat',     label: 'Default' },
  { key: 'cluster',  label: 'By Cluster' },
  { key: 'school',   label: 'By School' },
  { key: 'user',     label: 'By Submitter' },
  { key: 'quarter',  label: 'By Quarter' },
  { key: 'status',   label: 'By Status' },
  { key: 'division', label: 'By Division' },
];

const DIVISION_ORDER = ['SGOD', 'CID', 'OSDS'];

export function groupSubmissions(data, groupKey) {
  if (groupKey === 'flat') return null;

  if (groupKey === 'division') {
    const divisionRows = data.filter(r => !r.schoolId);
    const map = new Map();
    for (const row of divisionRows) {
      const k = row.division ?? '—';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(row);
    }
    return DIVISION_ORDER
      .filter(d => map.has(d))
      .concat([...map.keys()].filter(k => !DIVISION_ORDER.includes(k)))
      .map(key => ({ groupKey: key, rows: map.get(key) }));
  }

  const keyFn = {
    cluster: r => r.cluster || '—',
    school:  r => r.school  || '—',
    user:    r => r.schoolId ? (r.schoolHead || r.submittedBy || '—') : (r.submittedBy || '—'),
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
