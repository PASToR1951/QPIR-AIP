export const MANILA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export const SEVERITY_LABELS = {
  info: 'Info',
  notice: 'Notice',
  warn: 'Warning',
  critical: 'Critical',
};

export function formatManilaTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return MANILA_DATE_TIME_FORMATTER.format(date);
}

export function formatActorPrimary(actor) {
  if (!actor) return 'Unresolved actor';
  return actor.name || actor.email || actor.role || (actor.id ? `User #${actor.id}` : 'Unresolved actor');
}

export function formatActorSecondary(actor) {
  if (!actor) return 'No linked account was resolved for this event.';
  if (actor.email && actor.role) return `${actor.email} · ${actor.role}`;
  if (actor.email) return actor.email;
  if (actor.role) return actor.role;
  if (actor.id) return `User #${actor.id}`;
  return 'No extra actor details';
}

export function formatEntityPrimary(row) {
  return row?.entity_label || row?.entity_type || 'No related entity';
}

export function formatEntitySecondary(row) {
  if (!row?.entity_type && !row?.entity_id) return 'No entity id captured.';
  if (!row?.entity_type) return `ID ${row.entity_id}`;
  if (!row?.entity_id) return row.entity_type;
  return `${row.entity_type} #${row.entity_id}`;
}

export function formatOpenLogRef(row) {
  if (!row?.source || !row?.id) return null;
  return `${row.source}:${row.id}`;
}

export function parseOpenLogRef(value) {
  if (!value || typeof value !== 'string') return null;
  const [source, rawId] = value.split(':');
  const id = Number(rawId);
  if ((source !== 'admin' && source !== 'user') || !Number.isInteger(id) || id < 1) {
    return null;
  }
  return { source, id };
}

export function getSeverityBadgeClass(severity) {
  switch (severity) {
    case 'critical':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
    case 'warn':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
    case 'notice':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

export function getSourceBadgeClass(source) {
  return source === 'admin'
    ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300'
    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300';
}

export function buildActionOptions(facetActions = [], catalogActions = []) {
  const seen = new Set();
  const options = [];

  for (const action of facetActions) {
    const label = action?.count > 0 ? `${action.label} · ${action.count}` : action.label;
    options.push({
      value: action.key,
      label,
    });
    seen.add(action.key);
  }

  for (const action of catalogActions) {
    if (!action?.key || seen.has(action.key)) continue;
    options.push({
      value: action.key,
      label: action.label,
    });
  }

  return options;
}

export function buildValueOptions(items = [], labelFormatter = (key) => key) {
  return items.map((item) => ({
    value: item.key,
    label: item.count > 0 ? `${labelFormatter(item.key)} · ${item.count}` : labelFormatter(item.key),
  }));
}

export function buildSeverityOptions(items = []) {
  return items.map((item) => ({
    value: item.key,
    label: item.count > 0
      ? `${SEVERITY_LABELS[item.key] ?? item.key} · ${item.count}`
      : (SEVERITY_LABELS[item.key] ?? item.key),
  }));
}

export function countActiveFilters(filters) {
  return [
    filters.source !== 'all',
    filters.action.length,
    filters.entityType.length,
    filters.role.length,
    filters.severity.length,
    Boolean(filters.from),
    Boolean(filters.to),
    Boolean(filters.ip),
    Boolean(filters.q),
  ].reduce((total, value) => total + (typeof value === 'number' ? value : (value ? 1 : 0)), 0);
}
