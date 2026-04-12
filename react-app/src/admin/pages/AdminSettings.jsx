import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api, { API } from '../../lib/api.js';
import {
  FloppyDisk, Buildings, Users, BookOpen, Database,
  Megaphone, XCircle, LockSimple,
  Gear, CheckCircle, At, User, Trash, CalendarBlank,
  CaretLeft, CaretRight, Clock, CaretUp, CaretDown,
  Palette, UploadSimple,
  EnvelopeSimple, PaperPlaneTilt,
  IdentificationCard,
} from '@phosphor-icons/react';
import { CURRENT_VERSION } from '../../version.js';
import { useAppLogo, useReloadBranding } from '../../context/BrandingContext.jsx';
import { readSSEJsonStream } from '../../lib/readSSEStream.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

const MAX_CHARS = 280;
const EMPTY_ANNOUNCEMENT = {
  message: '',
  type: 'info',
  is_active: true,
  dismissible: true,
  expires_at: '',
};

const EMPTY_EMAIL_CONFIG = {
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

const DEFAULT_BLAST_FORM = {
  type: 'aip',
  label: '',
  target_roles: ['School', 'Division Personnel'],
};

const DURATION_UNITS = [
  { value: 'minutes', label: 'Minutes', multiplier: 1 },
  { value: 'hours', label: 'Hours', multiplier: 60 },
  { value: 'days', label: 'Days', multiplier: 1440 },
];

function minutesToDurationInput(minutes) {
  if (minutes % 1440 === 0) return { value: String(minutes / 1440), unit: 'days' };
  if (minutes % 60 === 0) return { value: String(minutes / 60), unit: 'hours' };
  return { value: String(minutes), unit: 'minutes' };
}

function durationInputToMinutes(duration) {
  const quantity = Number(duration?.value);
  const multiplier = DURATION_UNITS.find((unit) => unit.value === duration?.unit)?.multiplier ?? 1;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return Math.round(quantity * multiplier);
}

function formatMinutes(minutes) {
  if (!minutes && minutes !== 0) return '—';
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes / 1440 === 1 ? '' : 's'}`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes / 60 === 1 ? '' : 's'}`;
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function normalizeAnnouncement(source) {
  return {
    message: source?.message ?? '',
    type: source?.type ?? 'info',
    is_active: source?.is_active ?? true,
    dismissible: source?.dismissible !== false,
    expires_at: source?.expires_at ?? '',
  };
}

function announcementFromApi(source) {
  return {
    ...normalizeAnnouncement(source),
    expires_at: toDateTimeInput(source?.expires_at),
  };
}

function announcementsEqual(left, right) {
  const a = normalizeAnnouncement(left);
  const b = normalizeAnnouncement(right);
  return (
    a.message === b.message &&
    a.type === b.type &&
    a.is_active === b.is_active &&
    a.dismissible === b.dismissible &&
    a.expires_at === b.expires_at
  );
}

function hasAnnouncementMessage(source) {
  return Boolean(source?.message?.trim());
}

function isAnnouncementExpired(source) {
  if (!source?.expires_at) return false;
  const expiresAt = new Date(source.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date();
}

function formatAnnouncementExpiry(value) {
  if (!value) return '';
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return '';
  return expiresAt.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const STATUS_TONE_CLASSES = {
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

/* ─── Contenteditable editor helpers ─────────────────────────────── */
function rawToEditorHTML(raw) {
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

function editorToRaw(el) {
  let out = '';
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.dataset?.mention) out += `@[${node.dataset.mention}]`;
      else if (node.nodeName !== 'BR') out += node.textContent;
    }
  });
  return out;
}

/* ─── Announcement type definitions ─────────────────────────────── */
const TYPE_CONFIG = {
  info: {
    wrap:      'bg-blue-600 dark:bg-blue-700',
    card:      'border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/20',
    cardActive:'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/30',
    dot:       'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    label_str: 'Info',
    desc:      'General information or updates',
  },
  warning: {
    wrap:      'bg-amber-500 dark:bg-amber-600',
    card:      'border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20',
    cardActive:'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/30',
    dot:       'bg-amber-500',
    textColor: 'text-amber-700 dark:text-amber-300',
    label_str: 'Warning',
    desc:      'Caution or upcoming changes',
  },
  critical: {
    wrap:      'bg-rose-600 dark:bg-rose-700',
    card:      'border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20',
    cardActive:'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/30',
    dot:       'bg-rose-600',
    textColor: 'text-rose-700 dark:text-rose-300',
    label_str: 'Critical',
    desc:      'Urgent system-wide alert',
  },
};

/* ─── Render text with @[Name] mentions as inline badges ─────────── */
function renderWithMentions(text, badgeClass = 'bg-white/25 text-white') {
  if (!text) return <span className="opacity-50 italic">Your message will appear here…</span>;
  const parts = text.split(/(@\[[^\]]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^@\[([^\]]+)\]$/);
    if (match) {
      return (
        <span
          key={i}
          className={`inline-flex max-w-full align-middle items-center gap-0.5 px-1.5 py-0.5 rounded-md font-black text-xs leading-tight mx-0.5 ${badgeClass}`}
        >
          <At size={10} weight="bold" className="shrink-0" />
          <span className="min-w-0 break-words">{match[1]}</span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Banner preview (mirrors live AnnouncementBanner) ──────────── */
function BannerPreview({ announcement }) {
  const cfg = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-sm ${cfg.wrap}`}>
      <div className="px-4 py-2.5 flex items-start gap-2.5">
        <p className="min-w-0 flex-1 text-sm font-semibold text-white leading-snug whitespace-pre-wrap break-words">
          {renderWithMentions(announcement.message)}
        </p>
        {announcement.dismissible !== false ? (
          <div className="text-white/40 shrink-0">
            <XCircle size={20} weight="fill" />
          </div>
        ) : (
          <div className="relative shrink-0" title="Dismiss locked">
            <XCircle size={20} weight="fill" className="text-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LockSimple size={9} weight="fill" className="text-white/70" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Settings section wrapper ───────────────────────────────────── */
function SettingsCard({ icon, iconColor, iconBg, title, description, children }) {
  const CardIcon = icon;

  return (
    <div className="bg-white/70 dark:bg-dark-surface/80 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/[0.02]">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <CardIcon size={20} weight="fill" className={iconColor} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">{title}</h3>
          {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-6 space-y-6">{children}</div>
    </div>
  );
}

/* ─── Stat tile ──────────────────────────────────────────────────── */
function StatTile({ icon, label, value, sub }) {
  const TileIcon = icon;

  return (
    <div className="relative flex flex-col gap-3 p-4 bg-slate-50 dark:bg-dark-base rounded-xl border border-slate-100 dark:border-dark-border overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-transparent dark:from-indigo-950/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
        <TileIcon size={16} weight="bold" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight">{value}</p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Custom date+time picker ────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const DTP_W  = 272;  // popover width px
const DTP_H  = 316;  // estimated popover height px

function DateTimePicker({ value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const parsed = value ? new Date(value) : null;
  const [viewYear,  setViewYear]  = useState(() => parsed?.getFullYear()  ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth()     ?? new Date().getMonth());
  const [hour,   setHour]   = useState(() => parsed ? String(parsed.getHours()).padStart(2,'0')   : '08');
  const [minute, setMinute] = useState(() => parsed ? String(parsed.getMinutes()).padStart(2,'0') : '00');

  const selectedDateStr = value ? value.slice(0, 10) : '';
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  /* Recalculate popover position from the trigger button's current rect */
  const recalcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top  = spaceBelow > DTP_H + 8 ? r.bottom + 6 : r.top - DTP_H - 6;
    const left = Math.min(r.left, window.innerWidth - DTP_W - 8);
    setPopPos({ top: Math.max(8, top), left: Math.max(8, left) });
  };

  /* Reposition on resize or scroll while open */
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', recalcPos);
    window.addEventListener('scroll', recalcPos, true);
    return () => {
      window.removeEventListener('resize', recalcPos);
      window.removeEventListener('scroll', recalcPos, true);
    };
  }, [open]);

  const handleOpen = () => {
    const p = value ? new Date(value) : null;
    setViewYear(p?.getFullYear()  ?? new Date().getFullYear());
    setViewMonth(p?.getMonth()    ?? new Date().getMonth());
    setHour(p   ? String(p.getHours()).padStart(2,'0')   : '08');
    setMinute(p ? String(p.getMinutes()).padStart(2,'0') : '00');
    recalcPos();
    setOpen(true);
  };

  const selectDay = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const h  = String(Math.min(23, Math.max(0, Number(hour)))).padStart(2,'0');
    const m  = String(Math.min(59, Math.max(0, Number(minute)))).padStart(2,'0');
    onChange(`${viewYear}-${mm}-${dd}T${h}:${m}`);
  };

  const applyTime = (h, m) => {
    if (!selectedDateStr) return;
    const hh = String(Math.min(23, Math.max(0, Number(h)))).padStart(2,'0');
    const mm = String(Math.min(59, Math.max(0, Number(m)))).padStart(2,'0');
    onChange(`${selectedDateStr}T${hh}:${mm}`);
  };

  const formatDisplay = () => {
    if (!value) return null;
    const d = new Date(value);
    return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 group"
      >
        <CalendarBlank size={15} weight="bold" className="text-slate-400 dark:text-slate-500 shrink-0" />
        {value
          ? <span className="flex-1 text-slate-900 dark:text-slate-100 font-semibold">{formatDisplay()}</span>
          : <span className="flex-1 text-slate-400 dark:text-slate-500">No expiration — never expires</span>
        }
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onChange(''); } }}
            className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shrink-0"
          >
            <XCircle size={16} weight="fill" />
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ position: 'fixed', top: popPos.top, left: popPos.left, width: DTP_W, zIndex: 9999 }}
            className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-dark-border">
              <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors">
                <CaretLeft size={13} weight="bold" />
              </button>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 select-none">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors">
                <CaretRight size={13} weight="bold" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="px-2 pt-2 pb-1">
              <div className="grid grid-cols-7">
                {DAYS_SHORT.map(d => (
                  <div key={d} className="h-7 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500 select-none">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const mm  = String(viewMonth + 1).padStart(2, '0');
                  const dd  = String(day).padStart(2, '0');
                  const dateStr    = `${viewYear}-${mm}-${dd}`;
                  const isSelected = selectedDateStr === dateStr;
                  const isToday    = todayStr === dateStr;
                  return (
                    <div key={day} className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => selectDay(day)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors select-none ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isToday
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time row */}
            <div className="px-3 py-2 border-t border-slate-100 dark:border-dark-border bg-slate-50/60 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Clock size={13} weight="bold" className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Time</span>
                <div className="ml-auto flex items-center gap-2">
                  {/* Hour stepper */}
                  <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-base">
                    <span className="w-9 text-center text-sm font-bold text-slate-900 dark:text-slate-100 py-1 select-none tabular-nums">
                      {String(hour).padStart(2,'0')}
                    </span>
                    <div className="flex flex-col border-l border-slate-200 dark:border-dark-border">
                      <button type="button"
                        onClick={() => { const v = String((Number(hour)+1)%24).padStart(2,'0'); setHour(v); applyTime(v,minute); }}
                        className="px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-none">
                        <CaretUp size={10} weight="bold" />
                      </button>
                      <div className="h-px bg-slate-200 dark:bg-dark-border" />
                      <button type="button"
                        onClick={() => { const v = String((Number(hour)+23)%24).padStart(2,'0'); setHour(v); applyTime(v,minute); }}
                        className="px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-none">
                        <CaretDown size={10} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-400 dark:text-slate-500 select-none">:</span>
                  {/* Minute stepper */}
                  <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-base">
                    <span className="w-9 text-center text-sm font-bold text-slate-900 dark:text-slate-100 py-1 select-none tabular-nums">
                      {String(minute).padStart(2,'0')}
                    </span>
                    <div className="flex flex-col border-l border-slate-200 dark:border-dark-border">
                      <button type="button"
                        onClick={() => { const v = String((Number(minute)+1)%60).padStart(2,'0'); setMinute(v); applyTime(hour,v); }}
                        className="px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-none">
                        <CaretUp size={10} weight="bold" />
                      </button>
                      <div className="h-px bg-slate-200 dark:bg-dark-border" />
                      <button type="button"
                        onClick={() => { const v = String((Number(minute)+59)%60).padStart(2,'0'); setMinute(v); applyTime(hour,v); }}
                        className="px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-none">
                        <CaretDown size={10} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function DurationField({ label, description, value, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{formatMinutes(durationInputToMinutes(value) ?? 0)}</p>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_120px] gap-3">
        <input
          type="number"
          min="1"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
        <select
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        >
          {DURATION_UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>{unit.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function StreamProgressCard({ title, progress }) {
  const completed = progress.sent + progress.failed + progress.skipped;
  const percent = progress.total > 0 ? Math.round((completed / progress.total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/15 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">{title}</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
            {progress.running ? 'Sending emails…' : 'Latest email batch'}
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {completed} / {progress.total || 0}
        </span>
      </div>

      <div className="h-2 rounded-full bg-white/80 dark:bg-dark-base border border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sent', value: progress.sent, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Skipped', value: progress.skipped, tone: 'text-amber-600 dark:text-amber-400' },
          { label: 'Failed', value: progress.failed, tone: 'text-rose-600 dark:text-rose-400' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/80 dark:border-dark-border bg-white/80 dark:bg-dark-base px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{card.label}</p>
            <p className={`mt-1 text-lg font-black ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {progress.error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-400">
          {progress.error}
        </div>
      )}

      {progress.items.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-white/80 dark:border-dark-border bg-white/80 dark:bg-dark-base">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-dark-base border-b border-slate-100 dark:border-dark-border">
              <tr className="text-left text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {progress.items.map((item) => {
                const tone = item.status === 'sent'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : item.status === 'failed'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400';
                return (
                  <tr key={`${item.user_id}-${item.email}`}>
                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{item.email || `User #${item.user_id}`}</td>
                    <td className={`px-3 py-2 font-black capitalize ${tone}`}>{item.status}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{item.error || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function AdminSettings() {
  const appLogo        = useAppLogo();
  const reloadBranding = useReloadBranding();

  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [savedAnnouncement, setSavedAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [sysInfo, setSysInfo]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(null);
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState('');
  const [deleting, setDeleting]         = useState(false);

  /* ── App logo state ─────────────────────────────────────────────── */
  const [toast, setToast]               = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoResetting, setLogoResetting] = useState(false);
  const logoFileRef = useRef(null);
  const [emailConfig, setEmailConfig] = useState(EMPTY_EMAIL_CONFIG);
  const [ttlInputs, setTtlInputs] = useState({
    login: minutesToDurationInput(EMPTY_EMAIL_CONFIG.magic_link_ttl_login),
    welcome: minutesToDurationInput(EMPTY_EMAIL_CONFIG.magic_link_ttl_welcome),
    reminder: minutesToDurationInput(EMPTY_EMAIL_CONFIG.magic_link_ttl_reminder),
  });
  const [emailLoading, setEmailLoading] = useState(true);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [recipientsData, setRecipientsData] = useState({ total: 0, groups: [], recipients: [] });
  const [recipientRoleFilter, setRecipientRoleFilter] = useState('All');
  const [blastForm, setBlastForm] = useState(DEFAULT_BLAST_FORM);
  const [blastHistory, setBlastHistory] = useState([]);
  const [blastSending, setBlastSending] = useState(false);
  const [blastProgress, setBlastProgress] = useState({
    running: false,
    total: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    items: [],
    error: '',
  });

  /* ── Division Signatories state ─────────────────────────────────── */
  const [divisionSignatories, setDivisionSignatories] = useState({
    sgod_noted_by_name: '', sgod_noted_by_title: '',
    cid_noted_by_name:  '', cid_noted_by_title:  '',
    osds_noted_by_name: '', osds_noted_by_title: '',
  });
  const [savingSignatories, setSavingSignatories] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const applyEmailConfig = (config) => {
    const nextConfig = {
      ...EMPTY_EMAIL_CONFIG,
      ...config,
      smtp_pass: config?.smtp_pass ?? '',
      has_password: Boolean(config?.has_password),
    };
    setEmailConfig(nextConfig);
    setTtlInputs({
      login: minutesToDurationInput(nextConfig.magic_link_ttl_login),
      welcome: minutesToDurationInput(nextConfig.magic_link_ttl_welcome),
      reminder: minutesToDurationInput(nextConfig.magic_link_ttl_reminder),
    });
  };

  const loadEmailAdminData = async () => {
    setEmailLoading(true);
    try {
      const [configRes, recipientsRes, historyRes] = await Promise.all([
        api.get('/api/admin/settings/email-config'),
        api.get('/api/admin/email-recipients'),
        api.get('/api/admin/email-blast/history'),
      ]);
      applyEmailConfig(configRes.data);
      setRecipientsData(recipientsRes.data ?? { total: 0, groups: [], recipients: [] });
      setBlastHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (error) {
      console.error(error);
      showToast(error.friendlyMessage ?? 'Failed to load email settings.', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const saveDivisionSignatories = async () => {
    setSavingSignatories(true);
    try {
      const { data } = await api.post('/api/admin/settings/division-config', divisionSignatories);
      setDivisionSignatories(prev => ({ ...prev, ...data }));
      showToast('Division signatories saved.');
    } catch (err) {
      showToast(err?.friendlyMessage || 'Failed to save signatories.', 'error');
    } finally {
      setSavingSignatories(false);
    }
  };

  const handleLogoUpload = async (file) => {
    setLogoUploading(true);
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await api.post('/api/admin/settings/app-logo', formData);
      await reloadBranding();
      showToast('App logo updated.');
    } catch (e) {
      showToast(e.friendlyMessage ?? 'Upload failed.', 'error');
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
    }
  };

  const handleSaveEmailConfig = async () => {
    const loginMinutes = durationInputToMinutes(ttlInputs.login);
    const welcomeMinutes = durationInputToMinutes(ttlInputs.welcome);
    const reminderMinutes = durationInputToMinutes(ttlInputs.reminder);

    if (!loginMinutes || !welcomeMinutes || !reminderMinutes) {
      showToast('Magic-link durations must be valid positive numbers.', 'error');
      return;
    }

    setEmailSaving(true);
    try {
      const { data } = await api.put('/api/admin/settings/email-config', {
        smtp_host: emailConfig.smtp_host,
        smtp_port: Number(emailConfig.smtp_port),
        smtp_user: emailConfig.smtp_user,
        smtp_pass: emailConfig.smtp_pass,
        from_name: emailConfig.from_name,
        is_enabled: emailConfig.is_enabled,
        magic_link_ttl_login: loginMinutes,
        magic_link_ttl_welcome: welcomeMinutes,
        magic_link_ttl_reminder: reminderMinutes,
      });
      applyEmailConfig(data);
      showToast('Email settings saved.');
    } catch (error) {
      showToast(error.friendlyMessage ?? 'Failed to save email settings.', 'error');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setEmailTesting(true);
    try {
      const { data } = await api.post('/api/admin/settings/email-config/test');
      showToast(`Test email sent to ${data.target}.`);
    } catch (error) {
      showToast(error.friendlyMessage ?? 'Test email failed.', 'error');
    } finally {
      setEmailTesting(false);
    }
  };

  const handleToggleBlastRole = (role) => {
    setBlastForm((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter((entry) => entry !== role)
        : [...prev.target_roles, role],
    }));
  };

  const handleSendPortalBlast = async () => {
    if (!blastForm.label.trim()) {
      showToast('Enter a period label before sending the blast.', 'error');
      return;
    }

    setBlastSending(true);
    setBlastProgress({
      running: true,
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      items: [],
      error: '',
    });

    try {
      const response = await fetch(`${API}/api/admin/email-blast`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: blastForm.type,
          label: blastForm.label,
          target_roles: blastForm.target_roles,
        }),
      });

      await readSSEJsonStream(response, (payload) => {
        if (payload.type === 'started') {
          setBlastProgress((prev) => ({
            ...prev,
            running: true,
            total: payload.total ?? prev.total,
          }));
          return;
        }

        if (payload.type === 'item') {
          setBlastProgress((prev) => {
            const existingIndex = prev.items.findIndex((item) => item.user_id === payload.user_id);
            const nextItems = existingIndex === -1
              ? [...prev.items, payload]
              : prev.items.map((item, index) => index === existingIndex ? payload : item);
            const counts = nextItems.reduce((acc, item) => {
              if (item.status === 'sent') acc.sent += 1;
              else if (item.status === 'failed') acc.failed += 1;
              else acc.skipped += 1;
              return acc;
            }, { sent: 0, failed: 0, skipped: 0 });

            return {
              ...prev,
              items: nextItems,
              ...counts,
            };
          });
          return;
        }

        if (payload.type === 'complete') {
          setBlastProgress((prev) => ({
            ...prev,
            running: false,
            total: payload.total ?? prev.total,
            sent: payload.sent ?? prev.sent,
            failed: payload.failed ?? prev.failed,
            skipped: payload.skipped ?? prev.skipped,
          }));
        }
      });

      const historyRes = await api.get('/api/admin/email-blast/history');
      setBlastHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      showToast('Portal-open email batch finished.');
    } catch (error) {
      setBlastProgress((prev) => ({
        ...prev,
        running: false,
        error: error.message || 'Portal-open email batch failed.',
      }));
      showToast(error.message || 'Portal-open email batch failed.', 'error');
    } finally {
      setBlastSending(false);
    }
  };

  const handleLogoReset = async () => {
    setLogoResetting(true);
    try {
      await api.delete('/api/admin/settings/app-logo');
      await reloadBranding();
      showToast('App logo reset to default.');
    } catch (e) {
      showToast(e.friendlyMessage ?? 'Reset failed.', 'error');
    } finally {
      setLogoResetting(false);
    }
  };

  /* ── Mention state ──────────────────────────────────────────────── */
  const [schools, setSchools]               = useState([]);
  const [mentionableUsers, setMentionableUsers] = useState([]);
  const [mentionOpen, setMentionOpen]       = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionPos, setMentionPos]         = useState({ top: 0, left: 0, width: 0 });
  const textareaRef    = useRef(null);
  const isInternalEdit = useRef(false);

  /* ── Sync editor HTML when announcement loads externally ─────────── */
  useEffect(() => {
    if (isInternalEdit.current) { isInternalEdit.current = false; return; }
    if (textareaRef.current) {
      const currentRaw = editorToRaw(textareaRef.current);
      if (currentRaw !== announcement.message) {
        textareaRef.current.innerHTML = rawToEditorHTML(announcement.message);
      }
    }
  }, [announcement.message]);

  /* ── Auto-save toggle state ─────────────────────────────────────── */
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaved,  setAutoSaved]  = useState(false);

  useEffect(() => {
    // Core settings — required for page to render
    setLoading(true);
    Promise.all([
      api.get('/api/admin/announcements'),
      api.get('/api/admin/settings/system-info'),
      api.get('/api/admin/settings/division-config'),
    ]).then(([ar, sr, dcr]) => {
      const loadedAnnouncement = announcementFromApi(ar.data);
      setAnnouncement(loadedAnnouncement);
      setSavedAnnouncement(loadedAnnouncement);
      setSysInfo(sr.data);
      setDivisionSignatories({
        sgod_noted_by_name:  dcr.data.sgod_noted_by_name  ?? '',
        sgod_noted_by_title: dcr.data.sgod_noted_by_title ?? '',
        cid_noted_by_name:   dcr.data.cid_noted_by_name   ?? '',
        cid_noted_by_title:  dcr.data.cid_noted_by_title  ?? '',
        osds_noted_by_name:  dcr.data.osds_noted_by_name  ?? '',
        osds_noted_by_title: dcr.data.osds_noted_by_title ?? '',
      });
    }).catch(e => { console.error(e); setFetchError('Failed to load settings. Please refresh and try again.'); })
      .finally(() => setLoading(false));

    // Mention candidates — non-critical, loaded independently
    api.get('/api/admin/schools')
      .then(res => setSchools(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    api.get('/api/admin/users')
      .then(res => {
        const rawUsers = Array.isArray(res.data) ? res.data : [];
        // Only Division Personnel can be mentioned directly.
        // Schools are mentioned separately via the schools list.
        setMentionableUsers(
          rawUsers
            .filter(u => u.is_active && u.role === 'Division Personnel')
            .map(u => ({
              label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || u.email,
              sub:   'Division Personnel',
              kind:  'person',
            }))
            .filter(u => u.label)
        );
      })
      .catch(err => console.warn('[mention] users load failed:', err?.response?.status, err?.message));
  }, []);

  useEffect(() => {
    loadEmailAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Announce save (Publish button) ──────────────────────────────── */
  const handleSave = async () => {
    const payload = normalizeAnnouncement(announcement);
    setSaving(true);
    setFormError('');
    try {
      const { data } = await api.post('/api/admin/announcements', payload);
      const persistedAnnouncement = data ? announcementFromApi(data) : payload;
      setSavedAnnouncement(persistedAnnouncement);
      setAnnouncement(current =>
        announcementsEqual(current, payload) ? persistedAnnouncement : current
      );
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  /* ── Active toggle: auto-saves immediately ───────────────────────── */
  const handleToggleActive = async () => {
    const updated = normalizeAnnouncement({ ...announcement, is_active: !announcement.is_active });
    setAnnouncement(updated);
    setAutoSaving(true);
    try {
      const { data } = await api.post('/api/admin/announcements', updated);
      const persistedAnnouncement = data ? announcementFromApi(data) : updated;
      setSavedAnnouncement(persistedAnnouncement);
      setAnnouncement(current =>
        announcementsEqual(current, updated) ? persistedAnnouncement : current
      );
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    } catch {
      // revert
      setAnnouncement(prev =>
        announcementsEqual(prev, updated) ? { ...updated, is_active: !updated.is_active } : prev
      );
    } finally {
      setAutoSaving(false);
    }
  };

  /* ── Delete announcement ─────────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleting(true);
    setFormError('');
    try {
      await api.delete('/api/admin/announcements');
      const emptyAnnouncement = normalizeAnnouncement(EMPTY_ANNOUNCEMENT);
      setAnnouncement(emptyAnnouncement);
      setSavedAnnouncement(emptyAnnouncement);
      if (textareaRef.current) textareaRef.current.innerHTML = '';
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Mention detection (contenteditable) ────────────────────────── */
  const handleEditorInput = () => {
    const editor = textareaRef.current;
    if (!editor) return;

    const raw = editorToRaw(editor);
    if (raw.length <= MAX_CHARS) {
      isInternalEdit.current = true;
      setAnnouncement(a => ({ ...a, message: raw }));
    }

    // Detect in-progress @mention via Selection API
    const sel = window.getSelection();
    if (!sel?.rangeCount) { setMentionOpen(false); return; }
    const range = sel.getRangeAt(0);
    const node  = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) { setMentionOpen(false); return; }

    const textBefore = node.textContent.slice(0, range.startOffset);
    const lastAt     = textBefore.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = textBefore.slice(lastAt + 1);
      if (!afterAt.includes('@') && !afterAt.includes('[')) {
        const query = afterAt.toLowerCase();
        const allItems = [
          ...schools.map(s => ({ label: s.name, sub: s.abbreviation || s.cluster?.name, kind: 'school' })),
          ...mentionableUsers,
        ].filter(item => item.label.toLowerCase().includes(query));
        const suggestions = allItems.slice(0, 8);
        setMentionSuggestions(suggestions);
        if (suggestions.length > 0) {
          const r = editor.getBoundingClientRect();
          setMentionPos({ top: r.bottom + 6, left: r.left, width: r.width });
          setMentionOpen(true);
        } else {
          setMentionOpen(false);
        }
        return;
      }
    }
    setMentionOpen(false);
  };

  const insertMention = (label) => {
    const editor = textareaRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel?.rangeCount) return;

    const range = sel.getRangeAt(0);
    const node  = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      const textBefore = node.textContent.slice(0, range.startOffset);
      const lastAt     = textBefore.lastIndexOf('@');

      if (lastAt !== -1) {
        // Remove @query text
        const del = document.createRange();
        del.setStart(node, lastAt);
        del.setEnd(node, range.startOffset);
        del.deleteContents();

        // Build pill element
        const pill = document.createElement('span');
        pill.className = 'mention-pill';
        pill.dataset.mention = label;
        pill.setAttribute('contenteditable', 'false');
        pill.textContent = `@${label}`;

        // Insert pill where @ was
        const ins = document.createRange();
        ins.setStart(node, lastAt);
        ins.collapse(true);
        ins.insertNode(pill);

        // Add a space after pill and place cursor there
        const space = document.createTextNode('\u00A0');
        pill.after(space);
        const after = document.createRange();
        after.setStartAfter(space);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
      }
    }

    // Sync state from DOM
    const raw = editorToRaw(editor);
    if (raw.length <= MAX_CHARS) {
      isInternalEdit.current = true;
      setAnnouncement(a => ({ ...a, message: raw }));
    }
    setMentionOpen(false);
    editor.focus();
  };

  const charsLeft = MAX_CHARS - announcement.message.length;
  const hasDraftMessage = hasAnnouncementMessage(announcement);
  const hasSavedMessage = hasAnnouncementMessage(savedAnnouncement);
  const hasUnpublishedChanges = !announcementsEqual(announcement, savedAnnouncement);
  const savedExpired = isAnnouncementExpired(savedAnnouncement);
  const savedExpiryText = formatAnnouncementExpiry(savedAnnouncement.expires_at);
  const savedStateLabel = !hasSavedMessage
    ? 'No announcement'
    : !savedAnnouncement.is_active
      ? 'Saved inactive'
      : savedExpired
        ? 'Expired'
        : 'Published';
  const savedStateDetail = !hasSavedMessage
    ? 'No announcement is currently visible to users.'
    : !savedAnnouncement.is_active
      ? 'Saved, but hidden from users.'
      : savedExpired
        ? savedExpiryText
          ? `Expired on ${savedExpiryText}.`
          : 'Expired and no longer visible to users.'
        : savedAnnouncement.expires_at && savedExpiryText
          ? `Visible to users until ${savedExpiryText}.`
          : 'Visible to all users with no expiration.';
  const statusTone = hasUnpublishedChanges
    ? 'amber'
    : !hasSavedMessage
      ? 'slate'
      : savedAnnouncement.is_active && !savedExpired
        ? 'emerald'
        : savedExpired
          ? 'rose'
          : 'slate';
  const announcementStatus = {
    label: hasUnpublishedChanges
      ? hasDraftMessage ? 'Unpublished changes' : 'Message cleared in editor'
      : savedStateLabel,
    detail: hasUnpublishedChanges
      ? hasDraftMessage
        ? `Publish changes to update users. Current saved state: ${savedStateLabel}.`
        : hasSavedMessage
          ? 'Use Clear to remove the saved announcement, or add a message to publish changes.'
          : 'Write a message before publishing.'
      : savedStateDetail,
    ...STATUS_TONE_CLASSES[statusTone],
  };
  const canPublishAnnouncement = hasDraftMessage && hasUnpublishedChanges && !saving;
  const publishButtonLabel = saving
    ? 'Saving…'
    : hasUnpublishedChanges
      ? hasSavedMessage ? 'Publish changes' : 'Publish'
      : hasSavedMessage
        ? savedStateLabel
        : 'Publish';
  const publishButtonStyle = saving || canPublishAnnouncement
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : hasSavedMessage && !hasUnpublishedChanges && savedAnnouncement.is_active && !savedExpired
      ? 'bg-emerald-500 text-white'
      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  const filteredRecipients = recipientRoleFilter === 'All'
    ? recipientsData.recipients
    : recipientsData.recipients.filter((recipient) => recipient.role === recipientRoleFilter);
  const estimatedBlastRecipients = recipientsData.recipients.filter((recipient) =>
    blastForm.target_roles.includes(recipient.role)
  ).length;
  const emailStatusLabel = emailConfig.is_enabled && emailConfig.smtp_user && emailConfig.has_password
    ? 'Configured'
    : 'Not configured';
  const emailStatusTone = emailConfig.is_enabled && emailConfig.smtp_user && emailConfig.has_password
    ? 'emerald'
    : 'amber';

  return (
    <>
      {fetchError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium mb-4">
          {fetchError}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">

          {/* ── Page header ─────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Gear size={16} weight="fill" className="text-slate-400 dark:text-slate-500" />
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Manage branding, announcements, email delivery, and deployment information.
            </p>
          </div>

          {/* ── App Branding ────────────────────────────── */}
          <SettingsCard
            icon={Palette}
            iconBg="bg-pink-100 dark:bg-pink-950/50"
            iconColor="text-pink-600 dark:text-pink-400"
            title="App Branding"
            description="Upload a custom logo for the application. Changes take effect immediately across all pages."
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Logo preview */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border flex items-center justify-center bg-slate-50 dark:bg-dark-base overflow-hidden">
                  <img src={appLogo} alt="Current app logo" className="max-h-24 max-w-[6rem] w-auto h-auto object-contain" />
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Current logo</span>
              </div>

              {/* Controls */}
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Accepted formats: WebP · PNG · JPEG · GIF<br />Maximum file size: 2 MB
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/webp,image/png,image/jpeg,image/gif"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
                  />
                  <button
                    onClick={() => logoFileRef.current?.click()}
                    disabled={logoUploading || logoResetting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {logoUploading
                      ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      : <UploadSimple size={15} weight="bold" />}
                    {logoUploading ? 'Uploading…' : 'Upload Logo'}
                  </button>
                  <button
                    onClick={handleLogoReset}
                    disabled={logoUploading || logoResetting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-base dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
                  >
                    {logoResetting
                      ? <span className="w-4 h-4 rounded-full border-2 border-slate-400/40 border-t-slate-500 animate-spin" />
                      : <Trash size={15} weight="bold" />}
                    {logoResetting ? 'Resetting…' : 'Reset to Default'}
                  </button>
                </div>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={EnvelopeSimple}
            iconBg="bg-blue-100 dark:bg-blue-950/50"
            iconColor="text-blue-600 dark:text-blue-400"
            title="Email Configuration"
            description="Configure Gmail SMTP delivery for welcome emails, reminders, and portal-open notifications."
          >
            {emailLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">SMTP Settings</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Use a Gmail or Google Workspace sender with an app password. Email delivery will no-op safely when disabled.
                    </p>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black ${STATUS_TONE_CLASSES[emailStatusTone].badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_TONE_CLASSES[emailStatusTone].dot}`} />
                    {emailStatusLabel}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">SMTP Host</label>
                    <input
                      value={emailConfig.smtp_host}
                      onChange={(e) => setEmailConfig((prev) => ({ ...prev, smtp_host: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">SMTP Port</label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      value={emailConfig.smtp_port}
                      onChange={(e) => setEmailConfig((prev) => ({ ...prev, smtp_port: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Sender Email</label>
                    <input
                      value={emailConfig.smtp_user}
                      onChange={(e) => setEmailConfig((prev) => ({ ...prev, smtp_user: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="aip-pir@deped.gov.ph"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">App Password</label>
                    <input
                      type="password"
                      value={emailConfig.smtp_pass}
                      onChange={(e) => setEmailConfig((prev) => ({ ...prev, smtp_pass: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder={emailConfig.has_password ? 'Saved password will be kept unless replaced' : 'Gmail app password'}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Sender Display Name</label>
                    <input
                      value={emailConfig.from_name}
                      onChange={(e) => setEmailConfig((prev) => ({ ...prev, from_name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="AIP-PIR System"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">Email sending</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enable or disable all outbound email delivery without removing the saved SMTP credentials.</p>
                  </div>
                  <button
                    onClick={() => setEmailConfig((prev) => ({ ...prev, is_enabled: !prev.is_enabled }))}
                    className="flex items-center gap-3"
                  >
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${emailConfig.is_enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${emailConfig.is_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                      {emailConfig.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSaveEmailConfig}
                    disabled={emailSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {emailSaving
                      ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      : <FloppyDisk size={15} weight="bold" />}
                    {emailSaving ? 'Saving…' : 'Save Email Settings'}
                  </button>
                  <button
                    onClick={handleSendTestEmail}
                    disabled={emailTesting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-base dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors"
                  >
                    {emailTesting
                      ? <span className="w-4 h-4 rounded-full border-2 border-slate-400/40 border-t-slate-500 animate-spin" />
                      : <PaperPlaneTilt size={15} weight="bold" />}
                    {emailTesting ? 'Sending Test…' : 'Send Test Email'}
                  </button>
                </div>
              </>
            )}
          </SettingsCard>

          <SettingsCard
            icon={Clock}
            iconBg="bg-amber-100 dark:bg-amber-950/50"
            iconColor="text-amber-600 dark:text-amber-400"
            title="Magic Link Settings"
            description="Set how long each type of magic link remains valid."
          >
            {emailLoading ? (
              <div className="flex items-center justify-center h-28">
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-amber-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <DurationField
                    label="Login"
                    description="Standard magic link for email-based sign-in."
                    value={ttlInputs.login}
                    onChange={(next) => setTtlInputs((prev) => ({ ...prev, login: next }))}
                  />
                  <DurationField
                    label="Welcome"
                    description="Magic link included in welcome emails for newly created accounts."
                    value={ttlInputs.welcome}
                    onChange={(next) => setTtlInputs((prev) => ({ ...prev, welcome: next }))}
                  />
                  <DurationField
                    label="Deadline Reminder"
                    description="Magic link included in deadline reminder emails."
                    value={ttlInputs.reminder}
                    onChange={(next) => setTtlInputs((prev) => ({ ...prev, reminder: next }))}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveEmailConfig}
                    disabled={emailSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                  >
                    <FloppyDisk size={15} weight="bold" />
                    Save TTLs
                  </button>
                </div>
              </>
            )}
          </SettingsCard>

          <SettingsCard
            icon={Users}
            iconBg="bg-emerald-100 dark:bg-emerald-950/50"
            iconColor="text-emerald-600 dark:text-emerald-400"
            title="Recipients Directory"
            description="Review the active users who can receive broadcast or reminder emails."
          >
            {emailLoading ? (
              <div className="flex items-center justify-center h-28">
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-emerald-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatTile icon={Users} label="Recipients" value={recipientsData.total ?? 0} />
                  {recipientsData.groups.slice(0, 3).map((group) => (
                    <StatTile key={group.role} icon={Buildings} label={group.role} value={group.count} />
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setRecipientRoleFilter('All')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${recipientRoleFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80'}`}
                  >
                    All ({recipientsData.total ?? 0})
                  </button>
                  {recipientsData.groups.map((group) => (
                    <button
                      key={group.role}
                      onClick={() => setRecipientRoleFilter(group.role)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${recipientRoleFilter === group.role ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80'}`}
                    >
                      {group.role} ({group.count})
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-dark-base">
                      <tr className="text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Affiliation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                      {filteredRecipients.map((recipient) => (
                        <tr key={recipient.id}>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{recipient.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{recipient.email}</td>
                          <td className="px-4 py-3"><StatusBadge status={recipient.role} size="xs" /></td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{recipient.affiliation}</td>
                        </tr>
                      ))}
                      {filteredRecipients.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                            No recipients match the selected role filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SettingsCard>

          <SettingsCard
            icon={PaperPlaneTilt}
            iconBg="bg-violet-100 dark:bg-violet-950/50"
            iconColor="text-violet-600 dark:text-violet-400"
            title="Portal Open Notification"
            description="Send a seasonal announcement that the AIP or PIR portal is now open."
          >
            {emailLoading ? (
              <div className="flex items-center justify-center h-28">
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-violet-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Notification Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['aip', 'pir'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setBlastForm((prev) => ({ ...prev, type }))}
                          className={`px-4 py-2 rounded-xl text-sm font-black border transition-colors ${blastForm.type === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-dark-base text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-indigo-300'}`}
                        >
                          {type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Period Label</label>
                    <input
                      value={blastForm.label}
                      onChange={(e) => setBlastForm((prev) => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder={blastForm.type === 'aip' ? '2027' : '2nd Quarter CY 2026'}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Target Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {recipientsData.groups.map((group) => {
                      const checked = blastForm.target_roles.includes(group.role);
                      return (
                        <button
                          key={group.role}
                          onClick={() => handleToggleBlastRole(group.role)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${checked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-dark-base text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-indigo-300'}`}
                        >
                          {group.role} ({group.count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">Estimated recipients</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Current selection will send to {estimatedBlastRecipients} active user{estimatedBlastRecipients === 1 ? '' : 's'}.
                    </p>
                  </div>
                  <button
                    onClick={handleSendPortalBlast}
                    disabled={blastSending || blastForm.target_roles.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {blastSending
                      ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      : <PaperPlaneTilt size={15} weight="bold" />}
                    {blastSending ? 'Sending…' : `Send to ${estimatedBlastRecipients} users`}
                  </button>
                </div>

                {(blastProgress.running || blastProgress.items.length > 0 || blastProgress.error) && (
                  <StreamProgressCard title="Portal Open Email Batch" progress={blastProgress} />
                )}

                <div>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Recent Blasts</p>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-dark-base">
                        <tr className="text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Label</th>
                          <th className="px-4 py-3">Recipients</th>
                          <th className="px-4 py-3">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                        {blastHistory.map((entry) => (
                          <tr key={entry.blast_key}>
                            <td className="px-4 py-3"><StatusBadge status={entry.blast_type?.toUpperCase?.() || entry.blast_type} size="xs" /></td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{entry.blast_label}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{entry.recipient_count}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(entry.sent_at)}</td>
                          </tr>
                        ))}
                        {blastHistory.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                              No portal-open email blasts have been sent yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </SettingsCard>

          {/* ── System Announcement ─────────────────────── */}
          <SettingsCard
            icon={Megaphone}
            iconBg="bg-indigo-100 dark:bg-indigo-950/50"
            iconColor="text-indigo-600 dark:text-indigo-400"
            title="System Announcement"
            description="Broadcast a message to all logged-in users across the portal."
          >
            {/* Live preview — always visible */}
            <div>
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                Live Preview
              </p>
              <BannerPreview announcement={announcement} />
            </div>

            <div className="h-px bg-slate-100 dark:bg-dark-border" />

            {/* Compose area */}
            <div className="space-y-4">

              {/* Message textarea with mention dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Message
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Type <span className="font-black text-indigo-500">@</span> to mention a school or personnel
                    </span>
                    <span className={`text-xs font-bold tabular-nums transition-colors ${charsLeft < 20 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      {charsLeft}/{MAX_CHARS}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div
                    ref={textareaRef}
                    contentEditable="true"
                    suppressContentEditableWarning
                    data-placeholder="Write a message for all users… Type @ to mention schools or personnel."
                    onInput={handleEditorInput}
                    onKeyDown={e => {
                      if (e.key === 'Escape') setMentionOpen(false);
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    onPaste={e => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text/plain');
                      document.execCommand('insertText', false, text);
                    }}
                    onBlur={() => setTimeout(() => setMentionOpen(false), 150)}
                    className="mention-editor w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
                  />

                  {/* Mention dropdown — rendered via portal so it escapes overflow:hidden */}
                  {mentionOpen && mentionSuggestions.length > 0 && createPortal(
                    <div
                      style={{ position: 'fixed', top: mentionPos.top, left: mentionPos.left, width: mentionPos.width, zIndex: 9999 }}
                      className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 shrink-0">
                        <At size={12} weight="bold" className="text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Mention
                        </span>
                      </div>
                      <div className="overflow-y-auto">
                        {mentionSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onMouseDown={e => { e.preventDefault(); insertMention(s.label); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors text-left"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              s.kind === 'school'
                                ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                                : 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400'
                            }`}>
                              {s.kind === 'school'
                                ? <Buildings size={14} weight="fill" />
                                : <User size={14} weight="fill" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                                {s.label}
                              </p>
                              {s.sub && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{s.sub}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              {/* Type selector — card style */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Severity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                    const isActive = announcement.type === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setAnnouncement(a => ({ ...a, type: key }))}
                        className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                          isActive ? cfg.cardActive : `${cfg.card} hover:border-opacity-80`
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className={`text-xs font-black ${isActive ? cfg.textColor : 'text-slate-600 dark:text-slate-400'}`}>
                            {cfg.label_str}
                          </span>
                          {isActive && (
                            <CheckCircle size={13} weight="fill" className={`ml-auto ${cfg.textColor}`} />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug pl-4">
                          {cfg.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expiration date */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CalendarBlank size={12} weight="bold" />
                    Expires At
                    <span className="normal-case font-medium text-slate-400">(optional — leave blank to never expire)</span>
                  </span>
                </label>
                <DateTimePicker
                  value={announcement.expires_at}
                  onChange={val => setAnnouncement(a => ({ ...a, expires_at: val }))}
                />
              </div>

              {/* Status toggles + save row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">

                  {/* Active toggle — auto-saves immediately */}
                  <button onClick={handleToggleActive} disabled={autoSaving} className="flex items-center gap-3 disabled:opacity-70">
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {autoSaving && (
                          <span className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
                        )}
                        {autoSaved && !autoSaving && (
                          <CheckCircle size={12} weight="fill" className="text-emerald-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {announcement.is_active ? 'Visible to all users' : 'Hidden from users'}
                      </span>
                    </div>
                  </button>

                  {/* Dismissible toggle */}
                  <button
                    onClick={() => setAnnouncement(a => ({ ...a, dismissible: !a.dismissible }))}
                    className="flex items-center gap-3"
                  >
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.dismissible ? 'bg-indigo-600' : 'bg-rose-500'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.dismissible ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">
                        {announcement.dismissible ? 'Dismissible' : 'Persistent'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {announcement.dismissible ? 'Users can close it' : 'Cannot be closed by users'}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                  {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black ${announcementStatus.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${announcementStatus.dot}`} />
                    {announcementStatus.label}
                  </div>
                  <p className="max-w-xs text-[10px] text-slate-400 dark:text-slate-500 sm:text-right leading-snug">
                    {announcementStatus.detail}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting || (!hasDraftMessage && !hasSavedMessage)}
                      title="Clear saved announcement"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-40 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    >
                      <Trash size={15} weight="bold" />
                      {deleting ? 'Clearing…' : 'Clear'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!canPublishAnnouncement}
                      className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:cursor-not-allowed ${publishButtonStyle}`}
                    >
                      {saving ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                      ) : hasSavedMessage && !hasUnpublishedChanges ? (
                        <CheckCircle size={15} weight="fill" />
                      ) : (
                        <FloppyDisk size={15} weight="bold" />
                      )}
                      {publishButtonLabel}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* ── Division Signatories ────────────────────── */}
          <SettingsCard
            icon={IdentificationCard}
            iconBg="bg-violet-100 dark:bg-violet-950/50"
            iconColor="text-violet-600 dark:text-violet-400"
            title="Division Signatories"
            description="Set the 'Noted by' name and title shown on PIR forms for each functional division (SGOD, CID, OSDS)."
          >
            <div className="space-y-4">
              {[
                { key: 'sgod', label: 'SGOD' },
                { key: 'cid',  label: 'CID'  },
                { key: 'osds', label: 'OSDS' },
              ].map(({ key, label }) => (
                <div key={key} className="rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 p-4">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={divisionSignatories[`${key}_noted_by_name`]}
                        onChange={e => setDivisionSignatories(prev => ({ ...prev, [`${key}_noted_by_name`]: e.target.value }))}
                        placeholder={`${label} signatory name`}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Title</label>
                      <input
                        type="text"
                        value={divisionSignatories[`${key}_noted_by_title`]}
                        onChange={e => setDivisionSignatories(prev => ({ ...prev, [`${key}_noted_by_title`]: e.target.value }))}
                        placeholder={`${label} signatory title`}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  onClick={saveDivisionSignatories}
                  disabled={savingSignatories}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                >
                  {savingSignatories
                    ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                    : <FloppyDisk size={15} weight="bold" />}
                  {savingSignatories ? 'Saving…' : 'Save Signatories'}
                </button>
              </div>
            </div>
          </SettingsCard>

          {/* ── System Information ──────────────────────── */}
          <SettingsCard
            icon={Database}
            iconBg="bg-slate-100 dark:bg-slate-800/60"
            iconColor="text-slate-500 dark:text-slate-400"
            title="System Information"
            description="Read-only snapshot of the current deployment."
          >
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={Users}     label="Total Users"    value={sysInfo?.userCount    ?? '—'} />
              <StatTile icon={Buildings} label="Total Schools"  value={sysInfo?.schoolCount  ?? '—'} />
              <StatTile icon={BookOpen}  label="Total Programs" value={sysInfo?.programCount ?? '—'} />
              <StatTile
                icon={Database}
                label="App Version"
                value={`v${CURRENT_VERSION}`}
                sub={`FY ${new Date().getFullYear()} · Deadlines managed in Deadlines page`}
              />
            </div>
          </SettingsCard>

        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold
          ${toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          }`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}
    </>
  );
}
