export const TABS = [
  { key: 'compliance', label: 'AIP Compliance' },
  { key: 'quarterly', label: 'PIR Quarterly' },
  { key: 'budget', label: 'Budget' },
  { key: 'workload', label: 'Personnel Workload' },
  { key: 'accomplishment', label: 'Accomplishment Rates' },
  { key: 'factors', label: 'Factors Analysis' },
  { key: 'sources', label: 'Budget Sources' },
  { key: 'funnel', label: 'AIP Status Funnel' },
  { key: 'cluster-pir', label: 'Cluster Summary' },
  { key: 'consolidation', label: 'PIR Consolidation' },
];

export const SOURCE_PALETTE = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#E94560', '#8b5cf6', '#06b6d4'];
export const STATUS_COLORS_FUNNEL = { Draft: '#94a3b8', Submitted: '#3b82f6', Pending: '#f59e0b', Verified: '#06b6d4', 'Under Review': '#8b5cf6', Approved: '#10b981', Returned: '#E94560' };

export const EXPORT_STYLES = {
  csv: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400',
  xlsx: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400',
  pdf: 'hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 dark:hover:text-rose-400',
};
