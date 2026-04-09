import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api.js';
import {
  FloppyDisk, Buildings, Users, BookOpen, Database,
  Megaphone, XCircle, LockSimple,
  Gear, CheckCircle, At, User, Trash, CalendarBlank,
  CaretLeft, CaretRight, Clock, CaretUp, CaretDown,
} from '@phosphor-icons/react';
import { CURRENT_VERSION } from '../../version.js';

const MAX_CHARS = 280;
const EMPTY_ANNOUNCEMENT = {
  message: '',
  type: 'info',
  is_active: true,
  dismissible: true,
  expires_at: '',
};

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

/* ─── Main component ─────────────────────────────────────────────── */
export default function AdminSettings() {
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [savedAnnouncement, setSavedAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [sysInfo, setSysInfo]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(null);
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState('');
  const [deleting, setDeleting]         = useState(false);

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
    ]).then(([ar, sr]) => {
      const loadedAnnouncement = announcementFromApi(ar.data);
      setAnnouncement(loadedAnnouncement);
      setSavedAnnouncement(loadedAnnouncement);
      setSysInfo(sr.data);
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
              Manage system-wide announcements and review deployment information.
            </p>
          </div>

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
    </>
  );
}
