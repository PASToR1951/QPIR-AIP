import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarSlash, CalendarBlank, ArrowCounterClockwise, FloppyDisk,
  ClockCountdown, CaretDown, Hourglass, Warning, Info,
  CalendarDots, ArrowsLeftRight, CheckCircle, X,
} from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

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

const QUARTER_LABELS = ['Q1 · Jan – Mar', 'Q2 · Apr – Jun', 'Q3 · Jul – Sep', 'Q4 · Oct – Dec'];
const DEFAULT_MONTHS = [{ month: 3, day: 31 }, { month: 6, day: 30 }, { month: 9, day: 30 }, { month: 12, day: 31 }];

const QUARTER_RANGES = [
  { start: [2026, 1, 1],  end: [2026, 3, 31]  },
  { start: [2026, 4, 1],  end: [2026, 6, 30]  },
  { start: [2026, 7, 1],  end: [2026, 9, 30]  },
  { start: [2026, 10, 1], end: [2026, 12, 31] },
];

function quarterProgress(i) {
  const r = QUARTER_RANGES[i];
  const start = new Date(r.start[0], r.start[1] - 1, r.start[2]).getTime();
  const end   = new Date(r.end[0],   r.end[1] - 1,   r.end[2]).getTime();
  const now   = Date.now();
  if (now <= start) return 0;
  if (now >= end)   return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function isCurrentQuarter(i) {
  const r = QUARTER_RANGES[i];
  const start = new Date(r.start[0], r.start[1] - 1, r.start[2]).getTime();
  const end   = new Date(r.end[0],   r.end[1] - 1,   r.end[2] + 1).getTime();
  return Date.now() >= start && Date.now() < end;
}

function urgencyStyle(daysLeft) {
  if (daysLeft < 0)    return 'border-rose-400 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/10';
  if (daysLeft <= 7)   return 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/10';
  if (daysLeft <= 14)  return 'border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/5';
  return 'border-white/60 dark:border-dark-border bg-white/70 dark:bg-dark-surface/80';
}

function urgencyGradient(days) {
  if (days < 0)  return 'from-rose-500/10 to-rose-500/0 dark:from-rose-500/15 dark:to-transparent';
  if (days <= 7) return 'from-amber-500/10 to-amber-500/0 dark:from-amber-500/12 dark:to-transparent';
  return 'from-indigo-500/5 to-transparent dark:from-indigo-500/5 dark:to-transparent';
}

function urgencyCountdownColor(days) {
  if (days < 0)  return 'text-rose-500 dark:text-rose-400';
  if (days <= 7) return 'text-amber-500 dark:text-amber-400';
  return 'text-indigo-600 dark:text-indigo-400';
}

function daysLeft(dateStr) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ─── Term Change Constants ────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TERM_OPTIONS = [
  {
    type: 'Trimester', label: 'Trimester', periods: '3 periods',
    description: 'T1 Jun–Sep · T2 Oct–Dec · T3 Jan–Mar',
    defaultPeriods: [
      { number: 1, ordinal: '1st', startMonth: 6,  endMonth: 9  },
      { number: 2, ordinal: '2nd', startMonth: 10, endMonth: 12 },
      { number: 3, ordinal: '3rd', startMonth: 1,  endMonth: 3  },
    ],
  },
  {
    type: 'Quarterly', label: 'Quarterly', periods: '4 periods',
    description: 'Q1 Jan–Mar · Q2 Apr–Jun · Q3 Jul–Sep · Q4 Oct–Dec',
    defaultPeriods: [
      { number: 1, ordinal: '1st', startMonth: 1,  endMonth: 3  },
      { number: 2, ordinal: '2nd', startMonth: 4,  endMonth: 6  },
      { number: 3, ordinal: '3rd', startMonth: 7,  endMonth: 9  },
      { number: 4, ordinal: '4th', startMonth: 10, endMonth: 12 },
    ],
  },
  {
    type: 'Bimester', label: 'Bimester', periods: '2 periods',
    description: 'B1 Jun–Oct · B2 Nov–Mar',
    defaultPeriods: [
      { number: 1, ordinal: '1st', startMonth: 6,  endMonth: 10 },
      { number: 2, ordinal: '2nd', startMonth: 11, endMonth: 3  },
    ],
  },
];

// ─── Term Change Modal ────────────────────────────────────────────────────────

function TermChangeModal({ isOpen, onClose, currentTermType, syStart, onConfirm, saving, error }) {
  const [selectedType, setSelectedType]   = useState(currentTermType);
  const [customPeriods, setCustomPeriods] = useState({});

  // Reset selected type when modal opens
  useEffect(() => {
    if (isOpen) setSelectedType(currentTermType);
  }, [isOpen, currentTermType]);

  // Lazily seed custom periods from defaults when a type is first selected
  useEffect(() => {
    if (!selectedType) return;
    if (customPeriods[selectedType]) return;
    const termOpt = TERM_OPTIONS.find(t => t.type === selectedType);
    if (!termOpt) return;
    setCustomPeriods(cp => ({ ...cp, [selectedType]: termOpt.defaultPeriods.map(p => ({ ...p })) }));
  }, [selectedType]);

  const hasChanged = selectedType !== currentTermType;
  const periodsForSelected = customPeriods[selectedType] ?? [];

  const updateMonth = (periodNumber, field, monthIndex) => {
    setCustomPeriods(cp => ({
      ...cp,
      [selectedType]: (cp[selectedType] ?? []).map(p =>
        p.number === periodNumber ? { ...p, [field]: monthIndex } : p
      ),
    }));
  };

  const handleConfirm = () => {
    if (!hasChanged) { onClose(); return; }
    onConfirm({ termType: selectedType, customPeriods: periodsForSelected });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative z-10 flex items-start justify-center min-h-full p-4 py-10 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
                    <CalendarDots size={18} weight="fill" className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-none">Change Term Structure</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">SY {syStart}-{syStart + 1}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Warning */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                  <Warning size={14} weight="fill" className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Switching term type only affects new submissions. Existing PIR records keep their original period labels. A system-wide announcement will be posted automatically and expires in 3 days.
                  </p>
                </div>

                {/* Term type selector */}
                <div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Term Type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TERM_OPTIONS.map(opt => {
                      const isActive = selectedType === opt.type;
                      const isCurrent = opt.type === currentTermType;
                      return (
                        <button
                          key={opt.type}
                          onClick={() => setSelectedType(opt.type)}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 ring-2 ring-violet-500/30'
                              : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <span className={`text-xs font-black ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                              {opt.label}
                            </span>
                            {isActive && <CheckCircle size={12} weight="fill" className="ml-auto text-violet-500" />}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-3.5 leading-snug">{opt.periods}</p>
                          {isCurrent && !isActive && (
                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 pl-3.5 font-bold">Current</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Month range editor */}
                {selectedType && periodsForSelected.length > 0 && (
                  <div>
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Customize Month Ranges
                    </p>
                    <div className="space-y-2">
                      {periodsForSelected.map(p => (
                        <div key={p.number} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-dark-base rounded-xl border border-slate-100 dark:border-dark-border">
                          <span className="w-8 text-xs font-black text-slate-500 dark:text-slate-400 shrink-0">{p.ordinal}</span>
                          <select
                            value={p.startMonth}
                            onChange={e => updateMonth(p.number, 'startMonth', Number(e.target.value))}
                            className="flex-1 px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                          >
                            {MONTH_NAMES.map((name, idx) => (
                              <option key={idx + 1} value={idx + 1}>{name}</option>
                            ))}
                          </select>
                          <ArrowsLeftRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                          <select
                            value={p.endMonth}
                            onChange={e => updateMonth(p.number, 'endMonth', Number(e.target.value))}
                            className="flex-1 px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                          >
                            {MONTH_NAMES.map((name, idx) => (
                              <option key={idx + 1} value={idx + 1}>{name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Wrap-around periods (e.g. Nov–Mar) are supported.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-2">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-base rounded-b-2xl">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!hasChanged || saving}
                  className="px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? 'Applying…' : 'Apply & Announce'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDeadlines() {
  const [year]          = useState(2026);
  const [deadlines, setDeadlines] = useState([]);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(null);
  const [localDates, setLocalDates] = useState({});
  const [formError, setFormError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  // Term change state
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [termSaving,    setTermSaving]    = useState(false);
  const [termSaved,     setTermSaved]     = useState(false);
  const [termError,     setTermError]     = useState('');

  const fetchDeadlines = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/deadlines?year=${year}`, { headers: authHeaders() }),
      axios.get(`${API}/api/admin/deadlines/history`,      { headers: authHeaders() }),
    ]).then(([dr, hr]) => {
      setDeadlines(dr.data);
      setLocalDates(Object.fromEntries(dr.data.map(d => [d.quarter, d.date?.slice(0, 10) ?? ''])));
      setHistory(hr.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);

  const handleSave = async (quarter) => {
    setSaving(quarter);
    try {
      setFormError('');
      await axios.post(`${API}/api/admin/deadlines`, { year, quarter, date: localDates[quarter] }, { headers: authHeaders() });
      fetchDeadlines();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setSaving(null); }
  };

  const handleReset = async (deadline) => {
    if (!deadline.id) return;
    setSaving(deadline.quarter);
    try {
      setFormError('');
      await axios.delete(`${API}/api/admin/deadlines/${deadline.id}`, { headers: authHeaders() });
      fetchDeadlines();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setSaving(null); }
  };

  const dateChanged = (q) => {
    if (!localDates[q]) return false;
    const orig = deadlines.find(d => d.quarter === q)?.date?.slice(0, 10);
    return localDates[q] !== orig;
  };

  const impactPreview = (q) => {
    const orig = deadlines.find(d => d.quarter === q)?.date;
    if (!orig || !localDates[q] || !dateChanged(q)) return null;
    const origDate = new Date(orig);
    const newDate  = new Date(localDates[q]);
    if (isNaN(newDate.getTime())) return null;
    const diffDays = Math.round((newDate - origDate) / 86400000);
    if (diffDays < 0) return { type: 'warning', msg: `⚠ Moving deadline earlier by ${Math.abs(diffDays)} days` };
    return { type: 'ok', msg: `✓ Extends deadline by ${diffDays} days` };
  };

  const handleTermChange = async ({ termType, customPeriods }) => {
    setTermSaving(true);
    setTermError('');
    try {
      await axios.patch(
        `${API}/api/admin/term-config`,
        { termType, customPeriods },
        { headers: authHeaders() },
      );
      setTermModalOpen(false);
      setTermSaved(true);
      setTimeout(() => { setTermSaved(false); window.location.reload(); }, 1400);
    } catch (e) {
      setTermError(e.response?.data?.error || 'Failed to update term structure');
    } finally {
      setTermSaving(false);
    }
  };

  // Summary stats
  const overdueCount = deadlines.filter(d => daysLeft(d.date) < 0).length;
  const customCount  = deadlines.filter(d => d.isCustom).length;
  const nextDeadline = deadlines
    .filter(d => daysLeft(d.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const nextDays = nextDeadline ? daysLeft(nextDeadline.date) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {formError && (
              <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-2">
                {formError}
              </p>
            )}

            {/* Hero Header */}
            <div className="bg-white/70 dark:bg-dark-surface/80 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                    <CalendarSlash size={20} weight="fill" className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">Deadlines</h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">FY 2026 · Fiscal Year Submission Windows</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 text-xs font-black rounded-xl bg-indigo-600 text-white tracking-widest uppercase">FY 2026</span>
              </div>

              {/* Summary stat row */}
              <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-slate-100 dark:divide-dark-border">
                {/* Overdue */}
                <div className="flex items-center gap-3 py-3 sm:py-0 pr-0 sm:pr-6">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${overdueCount > 0 ? 'bg-rose-100 dark:bg-rose-950/50' : 'bg-slate-100 dark:bg-dark-base'}`}>
                    <Warning size={16} weight="fill" className={overdueCount > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">{overdueCount}</p>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">Overdue <Tip text="Quarters whose deadline date has already passed." /></p>
                  </div>
                </div>

                {/* Next deadline */}
                <div className="flex items-center gap-3 py-3 sm:py-0 px-0 sm:px-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                    <ClockCountdown size={16} weight="fill" className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">
                      {nextDays !== null ? `${nextDays}d` : '—'}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">Next Deadline <Tip text="Days remaining until the nearest upcoming quarter deadline." /></p>
                  </div>
                </div>

                {/* Custom set */}
                <div className="flex items-center gap-3 py-3 sm:py-0 pl-0 sm:pl-6">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                    <Hourglass size={16} weight="fill" className="text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">{customCount}</p>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">Custom Set <Tip text="Quarters where the default deadline has been manually overridden. Use Reset to restore defaults." /></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quarter Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {deadlines.map((d, i) => {
                const days     = daysLeft(d.date);
                const impact   = impactPreview(d.quarter);
                const progress = quarterProgress(i);
                const isCurrent = isCurrentQuarter(i);

                return (
                  <motion.div
                    key={d.quarter}
                    variants={cardVariants}
                    className={`relative rounded-2xl border-2 overflow-hidden backdrop-blur-sm shadow-sm transition-colors ${urgencyStyle(days)} ${isCurrent ? 'ring-2 ring-indigo-500/40 dark:ring-indigo-400/30' : ''}`}
                  >
                    {/* Gradient tint overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${urgencyGradient(days)} pointer-events-none`} />

                    {/* Active quarter accent bar */}
                    {isCurrent && (
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500" />
                    )}

                    <div className="relative p-5 space-y-4">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                            {QUARTER_LABELS[i]}
                          </p>
                          {d.isCustom && (
                            <span className="inline-block mt-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
                              Custom
                            </span>
                          )}
                        </div>
                        <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                          isCurrent
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50'
                            : 'bg-slate-100 dark:bg-dark-base text-slate-400 dark:text-slate-500 border-slate-200 dark:border-dark-border'
                        }`}>
                          Q{i + 1}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Quarter Progress
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              progress >= 100 ? 'bg-rose-400 dark:bg-rose-500' :
                              isCurrent      ? 'bg-indigo-500 dark:bg-indigo-400' :
                                               'bg-slate-400 dark:bg-slate-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.08 }}
                          />
                        </div>
                      </div>

                      {/* Countdown */}
                      <div>
                        <p className={`text-2xl font-black leading-none tracking-tight ${urgencyCountdownColor(days)}`}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(d.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Date input */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          <CalendarBlank size={11} className="inline mr-1" />Deadline Date
                        </label>
                        <input
                          type="date"
                          value={localDates[d.quarter] ?? ''}
                          onChange={e => setLocalDates(ld => ({ ...ld, [d.quarter]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>

                      {/* Impact preview */}
                      {impact && (
                        <p className={`text-xs font-bold leading-snug ${impact.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {impact.msg}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSave(d.quarter)}
                          disabled={!dateChanged(d.quarter) || saving === d.quarter}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-dark-border disabled:text-slate-400 dark:disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                          <FloppyDisk size={14} weight="bold" />
                          {saving === d.quarter ? 'Saving…' : 'Save'}
                        </button>
                        {d.isCustom && (
                          <button
                            onClick={() => handleReset(d)}
                            disabled={saving === d.quarter}
                            className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <ArrowCounterClockwise size={14} /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

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
                      {history.slice(0, 20).length} changes
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
                    <motion.div
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
                              {['Quarter', 'Previous', 'New Date', 'Changed By', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-wide first:pl-6 last:pr-6">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                            {history.slice(0, 20).map(log => (
                              <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.03] transition-colors">
                                <td className="px-4 py-2.5 pl-6 font-bold text-slate-700 dark:text-slate-300">Q{log.details?.quarter}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.details?.previousDate ? new Date(log.details.previousDate).toLocaleDateString('en-PH') : '—'}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.details?.newDate ? new Date(log.details.newDate).toLocaleDateString('en-PH') : '—'}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.admin?.name ?? log.admin?.email}</td>
                                <td className="px-4 py-2.5 pr-6 text-slate-400 dark:text-slate-500 text-xs">{new Date(log.created_at).toLocaleDateString('en-PH')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
