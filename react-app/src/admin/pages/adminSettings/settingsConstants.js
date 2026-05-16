export const MAX_CHARS = 500;

export const EMPTY_ANNOUNCEMENT = {
  id: null,
  title: 'Announcement',
  message: '',
  type: 'info',
  is_active: true,
  dismissible: true,
  starts_at: '',
  expires_at: '',
  action_label: '',
  action_url: '',
  audience: {
    roles: [],
    school_ids: [],
    user_ids: [],
  },
};

export const ANNOUNCEMENT_ROLE_OPTIONS = [
  { value: 'School', label: 'School' },
  { value: 'Division Personnel', label: 'Division Personnel' },
  { value: 'CES-SGOD', label: 'CES-SGOD' },
  { value: 'CES-ASDS', label: 'CES-ASDS' },
  { value: 'CES-CID', label: 'CES-CID' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Observer', label: 'Observer' },
];

export const EMPTY_EMAIL_CONFIG = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  has_password: false,
  from_name: 'AIP-PIR System',
  is_enabled: false,
  magic_link_ttl_login: 15,
  magic_link_ttl_welcome: 10080,
  magic_link_ttl_reminder: 1440,
};

export const DEFAULT_BLAST_FORM = {
  type: 'aip',
  label: '',
  target_roles: ['School', 'Division Personnel'],
};

export const DURATION_UNITS = [
  { value: 'minutes', label: 'Minutes', multiplier: 1 },
  { value: 'hours', label: 'Hours', multiplier: 60 },
  { value: 'days', label: 'Days', multiplier: 1440 },
];

export const STATUS_TONE_CLASSES = {
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/70',
    dot: 'bg-amber-500',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/70',
    dot: 'bg-emerald-500',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/70',
    dot: 'bg-rose-500',
  },
  slate: {
    badge: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:border-dark-border',
    dot: 'bg-slate-400',
  },
};

export const TYPE_CONFIG = {
  info: {
    wrap:       'bg-blue-600 dark:bg-blue-700',
    card:       'border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/20',
    cardActive: 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/30',
    dot:        'bg-blue-500',
    textColor:  'text-blue-700 dark:text-blue-300',
    label_str:  'Info',
    desc:       'General information or updates',
  },
  warning: {
    wrap:       'bg-amber-500 dark:bg-amber-600',
    card:       'border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20',
    cardActive: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/30',
    dot:        'bg-amber-500',
    textColor:  'text-amber-700 dark:text-amber-300',
    label_str:  'Warning',
    desc:       'Caution or upcoming changes',
  },
  critical: {
    wrap:       'bg-rose-600 dark:bg-rose-700',
    card:       'border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20',
    cardActive: 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/30',
    dot:        'bg-rose-600',
    textColor:  'text-rose-700 dark:text-rose-300',
    label_str:  'Critical',
    desc:       'Urgent system-wide alert',
  },
};

// ── Date-time helpers ──────────────────────────────────────────────

export function minutesToDurationInput(minutes) {
  if (minutes % 1440 === 0) return { value: String(minutes / 1440), unit: 'days' };
  if (minutes % 60 === 0)   return { value: String(minutes / 60),   unit: 'hours' };
  return { value: String(minutes), unit: 'minutes' };
}

export function durationInputToMinutes(duration) {
  const quantity   = Number(duration?.value);
  const multiplier = DURATION_UNITS.find(u => u.value === duration?.unit)?.multiplier ?? 1;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return Math.round(quantity * multiplier);
}

export function formatMinutes(minutes) {
  if (!minutes && minutes !== 0) return '—';
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes / 1440 === 1 ? '' : 's'}`;
  if (minutes % 60 === 0)   return `${minutes / 60} hour${minutes / 60 === 1 ? '' : 's'}`;
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function formatDateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

// ── Announcement helpers ───────────────────────────────────────────

export function normalizeAnnouncement(source) {
  return {
    id:          source?.id ?? null,
    title:       source?.title || 'Announcement',
    message:     source?.message ?? '',
    type:        source?.type ?? 'info',
    is_active:   source?.is_active ?? true,
    dismissible: source?.dismissible !== false,
    starts_at:   source?.starts_at ?? '',
    expires_at:  source?.expires_at ?? '',
    action_label: source?.action_label ?? '',
    action_url:   source?.action_url ?? '',
    audience: {
      roles: Array.isArray(source?.audience?.roles) ? source.audience.roles : [],
      school_ids: Array.isArray(source?.audience?.school_ids) ? source.audience.school_ids : [],
      user_ids: Array.isArray(source?.audience?.user_ids) ? source.audience.user_ids : [],
    },
  };
}

export function announcementFromApi(source) {
  return {
    ...(source ?? {}),
    ...normalizeAnnouncement(source),
    starts_at: toDateTimeInput(source?.starts_at),
    expires_at: toDateTimeInput(source?.expires_at),
  };
}

export function announcementsEqual(left, right) {
  const a = normalizeAnnouncement(left);
  const b = normalizeAnnouncement(right);
  return a.id === b.id &&
    a.title === b.title &&
    a.message === b.message &&
    a.type === b.type &&
    a.is_active === b.is_active &&
    a.dismissible === b.dismissible &&
    a.starts_at === b.starts_at &&
    a.expires_at === b.expires_at &&
    a.action_label === b.action_label &&
    a.action_url === b.action_url &&
    JSON.stringify(a.audience) === JSON.stringify(b.audience);
}

export function hasAnnouncementMessage(source) { return Boolean(source?.message?.trim()); }

export function isAnnouncementExpired(source) {
  if (!source?.expires_at) return false;
  const expiresAt = new Date(source.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date();
}

export function formatAnnouncementExpiry(value) {
  if (!value) return '';
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return '';
  return expiresAt.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── Mention / contenteditable helpers ─────────────────────────────

export function rawToEditorHTML(raw) {
  if (!raw) return '';
  return raw.split(/(@\[[^\]]+\])/g).map(part => {
    const m = part.match(/^@\[([^\]]+)\]$/);
    if (m) {
      const safe = m[1].replace(/"/g, '&quot;');
      return `<span class="mention-pill" data-mention="${safe}" contenteditable="false">@${m[1]}</span>`;
    }
    return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }).join('');
}

export function editorToRaw(el) {
  let out = '';
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent;
    else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.dataset?.mention) out += `@[${node.dataset.mention}]`;
      else if (node.nodeName !== 'BR') out += node.textContent;
    }
  });
  return out;
}
