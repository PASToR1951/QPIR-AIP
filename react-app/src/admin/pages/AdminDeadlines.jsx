import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  CalendarSlash, CalendarBlank, ArrowCounterClockwise, FloppyDisk,
  ClockCountdown, CaretDown, Hourglass, Warning, Info, LockSimple,
  CheckCircle, Timer,
} from '@phosphor-icons/react';
import { Spinner } from '../components/Spinner.jsx';

function Tip({ text }) {
  return (
    <span className="relative group inline-flex items-center">
      <Info size={11} weight="fill" className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 cursor-default transition-colors" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 rounded-xl bg-slate-800 dark:bg-dark-base text-white text-[11px] font-medium leading-snug shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 text-center border border-slate-700 dark:border-dark-border normal-case tracking-normal">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-dark-base" />
      </span>
    </span>
  );
}

const QUARTERS_PER_YEAR = 4;
const MONTHS_PER_QUARTER = 12 / QUARTERS_PER_YEAR;
const MONTH_LABEL = new Intl.DateTimeFormat('en-PH', { month: 'short' });

function quarterBounds(year, i) {
  const startMonth = i * MONTHS_PER_QUARTER;
  const endMonth = startMonth + MONTHS_PER_QUARTER - 1;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, endMonth + 1, 0),
  };
}

function quarterLabel(year, i) {
  const { start, end } = quarterBounds(year, i);
  return `Q${i + 1} · ${MONTH_LABEL.format(start)} – ${MONTH_LABEL.format(end)}`;
}

function schoolYearLabel(year) {
  return `SY ${year}-${year + 1}`;
}

function currentSchoolYearStart() {
  const today = new Date();
  return today.getMonth() + 1 >= 6 ? today.getFullYear() : today.getFullYear() - 1;
}

function trimesterLabel(year, i) {
  const labels = [
    `T1 · Jun – Sep · ${schoolYearLabel(year)}`,
    `T2 · Sep – Dec · ${schoolYearLabel(year)}`,
    `T3 · Jan – Apr · ${schoolYearLabel(year)}`,
  ];
  return labels[i] ?? `T${i + 1} · ${schoolYearLabel(year)}`;
}

function quarterProgress(year, i) {
  const bounds = quarterBounds(year, i);
  const start = bounds.start.getTime();
  const end   = bounds.end.getTime();
  const now   = Date.now();
  if (now <= start) return 0;
  if (now >= end)   return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function urgencyStyle(daysLeft, closed) {
  if (closed)          return 'border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 shadow-slate-900/5';
  if (daysLeft < 0)    return 'border-rose-400/50 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 shadow-rose-500/10';
  if (daysLeft <= 7)   return 'border-amber-400/50 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 shadow-amber-500/10';
  if (daysLeft <= 14)  return 'border-amber-200/50 dark:border-amber-800/30 bg-amber-50/20 dark:bg-amber-950/10 shadow-amber-500/5';
  return 'border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 shadow-slate-900/5';
}

function urgencyGradient(days, closed) {
  if (closed)        return 'from-indigo-500/5 via-violet-500/5 to-transparent dark:from-indigo-500/10 dark:via-violet-500/5 dark:to-transparent';
  if (days < 0)      return 'from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/15 dark:via-rose-500/5 dark:to-transparent';
  if (days <= 7)     return 'from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/5 dark:to-transparent';
  return 'from-indigo-500/5 via-violet-500/5 to-transparent dark:from-indigo-500/10 dark:via-violet-500/5 dark:to-transparent';
}

function urgencyCountdownColor(days, closed) {
  if (closed)        return 'text-slate-400 dark:text-slate-500';
  if (days < 0)      return 'bg-clip-text text-transparent bg-gradient-to-br from-rose-500 to-rose-700 dark:from-rose-400 dark:to-rose-500';
  if (days <= 7)     return 'bg-clip-text text-transparent bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500';
  return 'bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-400';
}

function daysLeft(dateStr) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const deadline = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((deadline - today) / 86400000);
}

function localDateStr(dateObj) {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  // Build YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Compute current window status for a quarter */
function windowStatus(localDate, localOpenDate, localGraceDays, i, year) {
  const deadlineStr = localDate;
  if (!deadlineStr) return 'locked';

  const [dy, dm, dd] = deadlineStr.split('-').map(Number);
  const deadline = new Date(dy, dm - 1, dd, 23, 59, 59, 999);

  let openDate;
  if (localOpenDate) {
    const [oy, om, od] = localOpenDate.split('-').map(Number);
    openDate = new Date(oy, om - 1, od);
  } else {
    openDate = quarterBounds(year, i).start;
  }

  const graceDays = parseInt(localGraceDays) || 0;
  const graceEnd = new Date(deadline.getTime() + graceDays * 86400000);
  graceEnd.setHours(23, 59, 59, 999);

  const now = new Date();
  if (now < openDate) return 'locked';
  if (now <= deadline) return 'open';
  if (graceDays > 0 && now <= graceEnd) return 'grace';
  return 'closed';
}

function configuredWindowStatus(localDate, localOpenDate, localGraceDays) {
  if (!localDate || !localOpenDate) return 'locked';

  const [dy, dm, dd] = localDate.split('-').map(Number);
  const [oy, om, od] = localOpenDate.split('-').map(Number);
  const deadline = new Date(dy, dm - 1, dd, 23, 59, 59, 999);
  const openDate = new Date(oy, om - 1, od);
  if (isNaN(deadline.getTime()) || isNaN(openDate.getTime())) return 'locked';

  const graceDays = parseInt(localGraceDays) || 0;
  const graceEnd = new Date(deadline.getTime() + graceDays * 86400000);
  graceEnd.setHours(23, 59, 59, 999);

  const now = new Date();
  if (now < openDate) return 'locked';
  if (now <= deadline) return 'open';
  if (graceDays > 0 && now <= graceEnd) return 'grace';
  return 'closed';
}

const WINDOW_BADGE = {
  locked: { label: 'LOCKED',  classes: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: LockSimple },
  open:   { label: 'OPEN',    classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', icon: CheckCircle },
  grace:  { label: 'GRACE',   classes: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50', icon: Timer },
  closed: { label: 'CLOSED',  classes: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50', icon: LockSimple },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDeadlines() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [schoolYear, setSchoolYear] = useState(() => currentSchoolYearStart());
  const [deadlines, setDeadlines] = useState([]);
  const [trimesterDeadlines, setTrimesterDeadlines] = useState([]);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [saving,    setSaving]    = useState(null);
  const [localDates, setLocalDates] = useState({});
  const [trimesterLocalDates, setTrimesterLocalDates] = useState({});
  const [formError, setFormError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchDeadlines = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/admin/deadlines?year=${year}`),
      api.get(`/api/admin/deadlines/trimesters?year=${schoolYear}`),
      api.get('/api/admin/deadlines/history'),
    ]).then(([dr, tr, hr]) => {
      setDeadlines(dr.data);
      setLocalDates(Object.fromEntries(dr.data.map(d => [d.quarter, {
        date:       d.date?.slice(0, 10) ?? '',
        openDate:   d.open_date ? localDateStr(d.open_date) : '',
        graceDays:  d.grace_period_days ?? 0,
      }])));
      setTrimesterDeadlines(tr.data);
      setTrimesterLocalDates(Object.fromEntries(tr.data.map(d => [d.trimester, {
        date:       d.date ? localDateStr(d.date) : '',
        openDate:   d.open_date ? localDateStr(d.open_date) : '',
        graceDays:  d.grace_period_days ?? 0,
      }])));
      setHistory(hr.data);
    }).catch(e => { console.error(e); setFetchError('Failed to load deadlines. Please refresh and try again.'); })
      .finally(() => setLoading(false));
  }, [year, schoolYear]);

  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);

  const handleSave = async (quarter) => {
    setSaving(quarter);
    try {
      setFormError('');
      const ld = localDates[quarter];
      await api.post('/api/admin/deadlines', {
        year,
        quarter,
        date:              ld.date,
        open_date:         ld.openDate || null,
        grace_period_days: parseInt(ld.graceDays) || 0,
      });
      fetchDeadlines();
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally { setSaving(null); }
  };

  const handleReset = async (deadline) => {
    if (!deadline.id) return;
    setSaving(deadline.quarter);
    try {
      setFormError('');
      await api.delete(`/api/admin/deadlines/${deadline.id}`);
      fetchDeadlines();
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally { setSaving(null); }
  };

  const handleSaveTrimester = async (trimester) => {
    setSaving(`T${trimester}`);
    try {
      setFormError('');
      const ld = trimesterLocalDates[trimester];
      if (!ld?.openDate || !ld?.date) {
        setFormError('School trimester windows require both open date and deadline date.');
        return;
      }
      await api.post('/api/admin/deadlines/trimesters', {
        year: schoolYear,
        trimester,
        date:              ld.date,
        open_date:         ld.openDate,
        grace_period_days: parseInt(ld.graceDays) || 0,
      });
      fetchDeadlines();
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally { setSaving(null); }
  };

  const handleResetTrimester = async (deadline) => {
    if (!deadline.id) return;
    if (!window.confirm('Remove this trimester window? Schools cannot submit until it is reconfigured.')) return;
    setSaving(`T${deadline.trimester}`);
    try {
      setFormError('');
      await api.delete(`/api/admin/deadlines/trimesters/${deadline.id}`);
      fetchDeadlines();
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally { setSaving(null); }
  };

  const anyChanged = (q) => {
    if (!localDates[q]) return false;
    const orig = deadlines.find(d => d.quarter === q);
    if (!orig) return false;
    const origDate     = orig.date?.slice(0, 10) ?? '';
    const origOpen     = orig.open_date ? localDateStr(orig.open_date) : '';
    const origGrace    = orig.grace_period_days ?? 0;
    const ld = localDates[q];
    return ld.date !== origDate || ld.openDate !== origOpen || parseInt(ld.graceDays) !== origGrace;
  };

  const trimesterChanged = (t) => {
    if (!trimesterLocalDates[t]) return false;
    const orig = trimesterDeadlines.find(d => d.trimester === t);
    if (!orig) return false;
    const origDate  = orig.date ? localDateStr(orig.date) : '';
    const origOpen  = orig.open_date ? localDateStr(orig.open_date) : '';
    const origGrace = orig.grace_period_days ?? 0;
    const ld = trimesterLocalDates[t];
    return ld.date !== origDate || ld.openDate !== origOpen || parseInt(ld.graceDays) !== origGrace;
  };

  const impactPreview = (q) => {
    const orig = deadlines.find(d => d.quarter === q)?.date;
    const ld = localDates[q];
    if (!orig || !ld?.date || ld.date === orig.slice(0, 10)) return null;
    const origDate = new Date(orig);
    const [ny, nm, nd] = ld.date.split('-').map(Number);
    const newDate = new Date(ny, nm - 1, nd);
    if (isNaN(newDate.getTime())) return null;
    const diffDays = Math.round((newDate - origDate) / 86400000);
    if (diffDays < 0) return { type: 'warning', msg: `⚠ Moving deadline earlier by ${Math.abs(diffDays)} days` };
    return { type: 'ok', msg: `✓ Extends deadline by ${diffDays} days` };
  };

  // Summary stats — only count quarters that are past deadline but NOT fully closed
  // (closed = submission window is over, no action needed; grace = past due but still accepting)
  const overdueCount = deadlines.filter((d, i) => {
    if (daysLeft(d.date) >= 0) return false;
    const ld = localDates[d.quarter] ?? { date: '', openDate: '', graceDays: 0 };
    const status = windowStatus(ld.date, ld.openDate, ld.graceDays, i, year);
    return status !== 'closed';
  }).length;
  const customCount  = deadlines.filter(d => d.isCustom).length;
  const nextDeadline = deadlines
    .filter(d => daysLeft(d.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const nextDays = nextDeadline ? daysLeft(nextDeadline.date) : null;

  return (
    <>
      <div className="relative space-y-8">
        {/* Decorative Background Orbs */}
        <div className="absolute top-[5%] left-[-5%] w-[40%] h-[30%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-5%] w-[50%] h-[40%] rounded-full bg-violet-500/20 dark:bg-violet-600/10 blur-[120px] pointer-events-none" />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        ) : (
          <>
            {fetchError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium">
                {fetchError}
              </div>
            )}
            {formError && (
              <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-2">
                {formError}
              </p>
            )}

            {/* Hero Header */}
            <div className="relative backdrop-blur-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-xl shadow-indigo-900/5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 pointer-events-none" />
              <div className="relative flex items-center justify-between px-8 py-8 border-b border-white/40 dark:border-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center shrink-0">
                    <CalendarSlash size={28} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight leading-none mb-1.5">Deadlines</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">FY {year} · Fiscal Year Submission Windows</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={year}
                    onChange={(event) => setYear(parseInt(event.target.value, 10))}
                    className="px-4 py-2 text-xs font-black rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 tracking-widest uppercase shadow-inner focus:outline-none"
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = new Date().getFullYear() + 1 - i;
                      return <option key={value} value={value}>FY {value}</option>;
                    })}
                  </select>
                  <select
                    value={schoolYear}
                    onChange={(event) => setSchoolYear(parseInt(event.target.value, 10))}
                    className="px-4 py-2 text-xs font-black rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 tracking-widest uppercase shadow-inner focus:outline-none"
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = new Date().getFullYear() + 1 - i;
                      return <option key={value} value={value}>{schoolYearLabel(value)}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Summary stat row */}
              <div className="relative px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-slate-200/50 dark:divide-white/10">
                {/* Overdue */}
                <div className="flex items-center gap-4 py-2 sm:py-0 pr-0 sm:pr-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${overdueCount > 0 ? 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Warning size={22} weight="fill" className={overdueCount > 0 ? 'text-white' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tabular-nums">{overdueCount}</p>
                    <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Overdue <Tip text="Quarters whose deadline date has already passed." /></p>
                  </div>
                </div>

                {/* Next */}
                <div className="flex items-center gap-4 py-2 sm:py-0 px-0 sm:px-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-inner shadow-indigo-500/30 flex items-center justify-center shrink-0">
                    <ClockCountdown size={22} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                      {nextDays !== null ? (nextDays === 0 ? 'Today' : `${nextDays}d`) : '—'}
                    </p>
                    <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Next Deadline <Tip text="Days remaining until the nearest upcoming quarter deadline." /></p>
                  </div>
                </div>

                {/* Custom */}
                <div className="flex items-center gap-4 py-2 sm:py-0 pl-0 sm:pl-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-inner shadow-amber-500/30 flex items-center justify-center shrink-0">
                    <Hourglass size={22} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tabular-nums">{customCount}</p>
                    <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Custom Set <Tip text="Quarters where the default deadline has been manually overridden." /></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Division Quarters</h2>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Fiscal year {year} submission windows for Division Personnel.</p>
              </div>
            </div>

            {/* Quarter Cards */}
            <Motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {deadlines.map((d, i) => {
                const days    = daysLeft(d.date);
                const impact  = impactPreview(d.quarter);
                const progress = quarterProgress(year, i);
                const ld      = localDates[d.quarter] ?? { date: '', openDate: '', graceDays: 0 };
                const winStatus = windowStatus(ld.date, ld.openDate, ld.graceDays, i, year);
                const isClosed = winStatus === 'closed';
                const badge   = WINDOW_BADGE[winStatus];
                const BadgeIcon = badge.icon;

                return (
                  <Motion.div
                    key={d.quarter}
                    variants={cardVariants}
                    className={`relative rounded-3xl border backdrop-blur-2xl shadow-xl transition-shadow duration-200 hover:shadow-2xl ${urgencyStyle(days, isClosed)}`}
                  >
                    {/* Gradient tint overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${urgencyGradient(days, isClosed)} rounded-3xl pointer-events-none`} />

                    <div className="relative p-6 space-y-5">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                            {quarterLabel(year, i)}
                          </p>
                          {d.isCustom && (
                            <span className="inline-block mt-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Window status badge */}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-lg border ${badge.classes}`}>
                            <BadgeIcon size={9} weight="bold" />
                            {badge.label}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-dark-base text-slate-400 dark:text-slate-500 border-slate-200 dark:border-dark-border`}>
                            Q{i + 1}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Time Elapsed
                          </p>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                          <Motion.div
                            className={`h-full rounded-full ${
                              progress >= 100 && !isClosed ? 'bg-rose-400 dark:bg-rose-500' : 'bg-indigo-500 dark:bg-indigo-400'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.04 }}
                          />
                        </div>
                      </div>

                      {/* Countdown */}
                      <div>
                        <p className={`text-4xl font-black leading-none tracking-tight pb-1 ${urgencyCountdownColor(days, isClosed)}`}>
                          {isClosed ? 'Closed' : (days < 0 ? `${Math.abs(days)}d overdue` : (days === 0 ? 'Due Today' : `${days}d left`))}
                        </p>
                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                          {(() => { const [y,m,day] = d.date.slice(0,10).split('-').map(Number); return new Date(y, m-1, day).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }); })()}
                        </p>
                      </div>

                      {/* ── Date Inputs ── */}
                      <div className={`space-y-3 ${isClosed ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                        {/* Deadline date */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            <CalendarBlank size={12} className="inline mr-1" />Deadline Date
                          </label>
                          <input
                            type="date"
                            value={ld.date}
                            disabled={isClosed}
                            onChange={e => setLocalDates(prev => ({ ...prev, [d.quarter]: { ...prev[d.quarter], date: e.target.value } }))}
                            className="w-full px-4 py-2.5 text-sm font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Submissions open date */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            <LockSimple size={12} className="inline mr-1" />Submissions Open
                            <Tip text="Date when PIR submissions unlock. Leave blank to default to the start of the quarter." />
                          </label>
                          <input
                            type="date"
                            value={ld.openDate}
                            disabled={isClosed}
                            onChange={e => setLocalDates(prev => ({ ...prev, [d.quarter]: { ...prev[d.quarter], openDate: e.target.value } }))}
                            className="w-full px-4 py-2.5 text-sm font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Grace period */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            <Timer size={12} className="inline mr-1" />Grace Period (Days)
                            <Tip text="Number of days after the deadline when late submissions are still accepted. 0 means no grace period." />
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={ld.graceDays}
                            disabled={isClosed}
                            onChange={e => setLocalDates(prev => ({ ...prev, [d.quarter]: { ...prev[d.quarter], graceDays: e.target.value } }))}
                            className="w-full px-4 py-2.5 text-sm font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Impact preview */}
                      {impact && !isClosed && (
                        <p className={`text-[11px] font-bold leading-snug px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 ${impact.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {impact.msg}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleSave(d.quarter)}
                          disabled={isClosed || !anyChanged(d.quarter) || saving === d.quarter}
                          className="relative flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl transition-all text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/30 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed group"
                        >
                          {anyChanged(d.quarter) && !isClosed && <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          <FloppyDisk size={16} weight="bold" />
                          {saving === d.quarter ? 'Saving…' : 'Save'}
                        </button>
                        {d.isCustom && (
                          <button
                            onClick={() => handleReset(d)}
                            disabled={isClosed || saving === d.quarter}
                            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                          >
                            <ArrowCounterClockwise size={16} weight="bold" /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </Motion.div>
                );
              })}
            </Motion.div>

            <div className="flex items-center justify-between gap-3 px-1 pt-2">
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">School Trimesters</h2>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{schoolYearLabel(schoolYear)} windows. Open date and deadline are required before schools can submit.</p>
              </div>
            </div>

            <Motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {trimesterDeadlines.map((d, i) => {
                const ld = trimesterLocalDates[d.trimester] ?? { date: '', openDate: '', graceDays: 0 };
                const isConfigured = Boolean(d.id);
                const days = ld.date ? daysLeft(ld.date) : null;
                const winStatus = configuredWindowStatus(ld.date, ld.openDate, ld.graceDays);
                const badge = WINDOW_BADGE[winStatus];
                const BadgeIcon = badge.icon;
                const isClosed = winStatus === 'closed';
                const canSave = Boolean(ld.date && ld.openDate) && trimesterChanged(d.trimester) && saving !== `T${d.trimester}`;

                return (
                  <Motion.div
                    key={d.trimester}
                    variants={cardVariants}
                    className={`relative rounded-3xl border backdrop-blur-2xl shadow-xl transition-shadow duration-200 hover:shadow-2xl ${urgencyStyle(days ?? 99, isClosed)}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${urgencyGradient(days ?? 99, isClosed)} rounded-3xl pointer-events-none`} />
                    <div className="relative p-6 space-y-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                            {trimesterLabel(schoolYear, i)}
                          </p>
                          <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-lg ${
                            isConfigured
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40'
                              : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                          }`}>
                            {isConfigured ? 'Configured' : 'Not configured'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-lg border ${badge.classes}`}>
                            <BadgeIcon size={9} weight="bold" />
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-dark-base text-slate-400 dark:text-slate-500 border-slate-200 dark:border-dark-border">
                            T{i + 1}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className={`text-4xl font-black leading-none tracking-tight pb-1 ${urgencyCountdownColor(days ?? 99, isClosed)}`}>
                          {!ld.date ? 'Set window' : isClosed ? 'Closed' : (days < 0 ? `${Math.abs(days)}d overdue` : (days === 0 ? 'Due Today' : `${days}d left`))}
                        </p>
                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                          {ld.date ? (() => { const [y,m,day] = ld.date.split('-').map(Number); return new Date(y, m-1, day).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }); })() : 'Schools are blocked until configured'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            <LockSimple size={12} className="inline mr-1" />Submissions Open
                          </label>
                          <input
                            type="date"
                            value={ld.openDate}
                            onChange={e => setTrimesterLocalDates(prev => ({ ...prev, [d.trimester]: { ...prev[d.trimester], openDate: e.target.value } }))}
                            className="w-full px-4 py-2.5 text-sm font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            <CalendarBlank size={12} className="inline mr-1" />Deadline Date
                          </label>
                          <input
                            type="date"
                            value={ld.date}
                            onChange={e => setTrimesterLocalDates(prev => ({ ...prev, [d.trimester]: { ...prev[d.trimester], date: e.target.value } }))}
                            className="w-full px-4 py-2.5 text-sm font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            <Timer size={12} className="inline mr-1" />Grace Period (Days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={ld.graceDays}
                            onChange={e => setTrimesterLocalDates(prev => ({ ...prev, [d.trimester]: { ...prev[d.trimester], graceDays: e.target.value } }))}
                            className="w-full px-4 py-2.5 text-sm font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleSaveTrimester(d.trimester)}
                          disabled={!canSave}
                          className="relative flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl transition-all text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/30 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed group"
                        >
                          <FloppyDisk size={16} weight="bold" />
                          {saving === `T${d.trimester}` ? 'Saving…' : isConfigured ? 'Save' : 'Set window'}
                        </button>
                        {isConfigured && (
                          <button
                            onClick={() => handleResetTrimester(d)}
                            disabled={saving === `T${d.trimester}`}
                            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ArrowCounterClockwise size={16} weight="bold" /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </Motion.div>
                );
              })}
            </Motion.div>

            {/* Collapsible History */}
            {history.length > 0 && (
              <div className="bg-white/70 dark:bg-dark-surface/80 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setHistoryOpen(o => !o)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">Change History</p>
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-slate-100 dark:bg-dark-base text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-border tabular-nums">
                      {history.slice(0, 20).length} change{history.slice(0, 20).length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <CaretDown
                    size={15}
                    weight="bold"
                    className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {historyOpen && (
                    <Motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 dark:border-dark-border overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/[0.02]">
                              {[
                                { label: 'Period', cls: 'first:pl-6' },
                                { label: 'Previous', cls: '' },
                                { label: 'New Date', cls: '' },
                                { label: 'Changed By', cls: 'hidden sm:table-cell' },
                                { label: 'Date', cls: 'hidden md:table-cell last:pr-6' },
                              ].map(h => (
                                <th key={h.label} className={`px-4 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-wide ${h.cls}`}>
                                  {h.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                            {history.slice(0, 20).map(log => (
                              <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.03] transition-colors">
                                <td className="px-4 py-2.5 pl-6 font-bold text-slate-700 dark:text-slate-300">
                                  {log.details?.trimester ? `T${log.details.trimester}` : `Q${log.details?.quarter}`}
                                </td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.details?.previousDate ? (() => { const [y,m,d] = log.details.previousDate.slice(0,10).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-PH'); })() : '—'}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.details?.newDate ? (() => { const [y,m,d] = log.details.newDate.slice(0,10).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-PH'); })() : '—'}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell">{log.admin?.name ?? log.admin?.email}</td>
                                <td className="px-4 py-2.5 pr-6 text-slate-400 dark:text-slate-500 text-xs hidden md:table-cell">{new Date(log.created_at).toLocaleDateString('en-PH')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
