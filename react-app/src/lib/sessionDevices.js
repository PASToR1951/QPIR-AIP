export const SESSION_STATUS_STYLES = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Expired: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Revoked: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
};

export function getSessionStatus(session, now = new Date()) {
  if (session?.revoked_at) return 'Revoked';

  const expiresAt = new Date(session?.expires_at ?? '');
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
    return 'Expired';
  }

  return 'Active';
}

export function isSessionRevocable(session, now = new Date()) {
  return getSessionStatus(session, now) === 'Active';
}

export function formatSessionDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
