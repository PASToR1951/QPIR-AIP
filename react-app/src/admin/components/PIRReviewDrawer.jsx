import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ArrowsOut, ArrowsIn, Check, ArrowBendUpLeft, NotePencil,
  FloppyDisk, CaretDown, CaretRight, ArrowsLeftRight, ListDashes,
  Warning, ChartBar, CurrencyCircleDollar, Checks, XCircle,
} from '@phosphor-icons/react';
import { StatusBadge } from './StatusBadge.jsx';

const API = import.meta.env.VITE_API_URL;


const fmt = (n) => Number(n ?? 0).toLocaleString('en-PH');
const fmtPeso = (n) => `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function pct(num, den) {
  const n = Number(num), d = Number(den);
  if (!d || isNaN(n) || isNaN(d)) return null;
  return Math.round((n / d) * 100);
}

// Mirrors PIRForm's calculateGap: returns 0 if met, negative % if under
function calculateGap(target, accomplished) {
  const t = parseFloat(target) || 0;
  const a = parseFloat(accomplished) || 0;
  if (t > 0) {
    if (a >= t) return 0;
    return ((a - t) / t) * 100;
  }
  return 0;
}

function getValidationFlags(review) {
  const flags = [];
  const pT = Number(review.physical_target);
  const fT = Number(review.financial_target);
  const pA = Number(review.physical_accomplished);
  const fA = Number(review.financial_accomplished);
  const physRate = pT > 0 ? pA / pT : null;
  const finRate = fT > 0 ? fA / fT : null;
  if (!review.aip_activity_id)
    flags.push({ type: 'not_in_aip', label: 'Not in AIP', color: 'yellow' });
  if (physRate !== null && physRate < 0.5)
    flags.push({ type: 'low_phys', label: `Low: ${Math.round(physRate * 100)}%`, color: 'red' });
  if (finRate !== null && finRate > 1.05)
    flags.push({ type: 'overrun', label: 'Budget Overrun', color: 'orange' });
  if (physRate !== null && finRate !== null && physRate >= 0.9 && finRate < 0.1)
    flags.push({ type: 'suspicious', label: 'Suspicious', color: 'black' });
  return flags;
}

const FLAG_CLS = {
  red: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  black: 'bg-slate-900 text-slate-100 dark:bg-dark-base dark:text-slate-200',
};

function FlagChip({ flag }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${FLAG_CLS[flag.color]}`}>
      <Warning size={10} weight="bold" />
      {flag.label}
    </span>
  );
}

function RateBar({ value, max = 100 }) {
  if (value === null) return <span className="text-slate-400 text-xs">—</span>;
  const capped = Math.min(value, 150);
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 dark:bg-dark-border rounded-full h-1.5 overflow-hidden max-w-[80px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(capped, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${value >= 80 ? 'text-emerald-600 dark:text-emerald-400' : value >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
        {value}%{value > 100 ? ' ↑' : ''}
      </span>
    </div>
  );
}

// ─── Activity Row (inline mode) ───────────────────────────────────────────────
function ActivityRow({ review, onSaveNotes, pirId }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(review.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const physGap = calculateGap(review.physical_target, review.physical_accomplished);
  const finGap = calculateGap(review.financial_target, review.financial_accomplished);
  const flags = getValidationFlags(review);
  const aip = review.aip_activity;

  const handleBlur = async () => {
    if (notes === (review.admin_notes ?? '')) return;
    setSaving(true);
    setSaved(false);
    try {
      await axios.patch(
        `${API}/api/admin/pirs/${pirId}/activity-notes`,
        { activity_review_id: review.id, notes },
        { withCredentials: true }
      );
      onSaveNotes(review.id, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <>
      <tr className="bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors align-top">
        {/* Expand toggle (AIP reference) */}
        <td className="px-3 py-3 w-8">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-0.5"
            title={expanded ? 'Collapse AIP detail' : 'Expand AIP detail'}
          >
            {expanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
          </button>
        </td>

        {/* Activity name + flags */}
        <td className="px-3 py-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
            {aip?.activity_name ?? <span className="italic text-slate-400">Manual entry</span>}
          </p>
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {flags.map(f => <FlagChip key={f.type} flag={f} />)}
            </div>
          )}
        </td>

        {/* Implementation period */}
        <td className="px-3 py-3 text-center">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 leading-snug">
            {aip?.implementation_period ?? '—'}
          </span>
        </td>

        {/* Target: Physical */}
        <td className="px-3 py-3 text-center border-l border-slate-100 dark:border-dark-border">
          <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(review.physical_target)}</span>
        </td>

        {/* Target: Financial */}
        <td className="px-3 py-3 text-center border-r border-slate-100 dark:border-dark-border">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">{fmtPeso(review.financial_target)}</span>
        </td>

        {/* Accomplishment: Physical */}
        <td className="px-3 py-3 text-center border-l border-slate-100 dark:border-dark-border">
          <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(review.physical_accomplished)}</span>
        </td>

        {/* Accomplishment: Financial */}
        <td className="px-3 py-3 text-center border-r border-slate-100 dark:border-dark-border">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">{fmtPeso(review.financial_accomplished)}</span>
        </td>

        {/* Gap %: Physical */}
        <td className="px-3 py-3 text-center bg-slate-50/50 dark:bg-dark-base/30 border-l border-slate-100 dark:border-dark-border">
          <span className={`text-sm font-bold font-mono tabular-nums ${physGap < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {physGap.toFixed(2)}%
          </span>
        </td>

        {/* Gap %: Financial */}
        <td className="px-3 py-3 text-center bg-slate-50/50 dark:bg-dark-base/30 border-r border-slate-100 dark:border-dark-border">
          <span className={`text-sm font-bold font-mono tabular-nums ${finGap < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {finGap.toFixed(2)}%
          </span>
        </td>

        {/* Actions to Address Gap (from school) */}
        <td className="px-3 py-3">
          {review.actions_to_address_gap ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{review.actions_to_address_gap}</p>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600 italic">—</span>
          )}
        </td>

        {/* Admin notes */}
        <td className="px-3 py-3 min-w-[160px]">
          <div className="relative">
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setSaved(false); }}
              onBlur={handleBlur}
              rows={2}
              placeholder="Add remarks…"
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
            />
            {saving && <span className="absolute right-2 bottom-2 text-[10px] text-slate-400">Saving…</span>}
            {saved && <span className="absolute right-2 bottom-2 text-[10px] text-emerald-500">Saved</span>}
          </div>
        </td>
      </tr>

      {/* AIP reference sub-row (phase, persons, outputs, budget) */}
      {expanded && aip && (
        <tr className="bg-indigo-50/60 dark:bg-indigo-950/10 border-b border-indigo-100 dark:border-indigo-900/30">
          <td />
          <td colSpan={10} className="px-4 py-3">
            <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">AIP Reference</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Phase</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{aip.phase}</p>
              </div>
              <div>
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Budget Source</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{aip.budget_source} · {fmtPeso(aip.budget_amount)}</p>
              </div>
              <div className="col-span-2">
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Persons Involved</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{aip.persons_involved}</p>
              </div>
              <div className="col-span-2 md:col-span-4">
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Expected Outputs</p>
                <p className="text-slate-600 dark:text-slate-300">{aip.outputs}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Side-by-side mode ────────────────────────────────────────────────────────
function SideBySideView({ reviews, allAipActivities, pirId, onSaveNotes }) {
  const reviewed = reviews;
  const reviewedIds = new Set(reviews.map(r => r.aip_activity_id));
  const unreviewed = allAipActivities.filter(a => !reviewedIds.has(a.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* LEFT: PIR activities */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-dark-border pb-2">
          PIR Reported Activities
        </h3>
        {reviewed.map(review => {
          const flags = getValidationFlags(review);
          const physPct = pct(review.physical_accomplished, review.physical_target);
          const finPct = pct(review.financial_accomplished, review.financial_target);
          return (
            <SidePIRCard key={review.id} review={review} flags={flags} physPct={physPct} finPct={finPct} pirId={pirId} onSaveNotes={onSaveNotes} />
          );
        })}
      </div>

      {/* RIGHT: AIP reference activities */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-dark-border pb-2">
          AIP Planned Activities
        </h3>
        {reviewed.map(review => (
          <SideAIPCard key={review.id} activity={review.aip_activity} />
        ))}
        {unreviewed.map(a => (
          <SideAIPCard key={a.id} activity={a} greyed />
        ))}
      </div>
    </div>
  );
}

function SidePIRCard({ review, flags, physPct, finPct, pirId, onSaveNotes }) {
  const [notes, setNotes] = useState(review.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBlur = async () => {
    if (notes === (review.admin_notes ?? '')) return;
    setSaving(true);
    setSaved(false);
    try {
      await axios.patch(
        `${API}/api/admin/pirs/${pirId}/activity-notes`,
        { activity_review_id: review.id, notes },
        { withCredentials: true }
      );
      onSaveNotes(review.id, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-3 space-y-2">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
        {review.aip_activity?.activity_name ?? <span className="italic text-slate-400">Manual entry</span>}
      </p>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flags.map(f => <FlagChip key={f.type} flag={f} />)}
        </div>
      )}
      <div className="grid grid-cols-2 xs:grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-black mb-0.5">Physical</p>
          <p className="font-bold text-slate-700 dark:text-slate-200">{fmt(review.physical_accomplished)} / {fmt(review.physical_target)}</p>
          <RateBar value={physPct} />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-black mb-0.5">Financial</p>
          <p className="font-bold text-slate-700 dark:text-slate-200">{fmtPeso(review.financial_accomplished)}</p>
          <RateBar value={finPct} />
        </div>
      </div>
      {review.actions_to_address_gap && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Gap actions: {review.actions_to_address_gap}</p>
      )}
      <div className="relative">
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false); }}
          onBlur={handleBlur}
          rows={2}
          placeholder="Admin notes…"
          className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-accent transition-colors"
        />
        {saving && <span className="absolute right-2 bottom-2 text-[10px] text-slate-400">Saving…</span>}
        {saved && <span className="absolute right-2 bottom-2 text-[10px] text-emerald-500">Saved</span>}
      </div>
    </div>
  );
}

function SideAIPCard({ activity, greyed = false }) {
  if (!activity) return <div className="h-24 rounded-xl border border-dashed border-slate-200 dark:border-dark-border" />;
  return (
    <div className={`border rounded-xl p-3 space-y-2 ${greyed ? 'border-dashed border-slate-200 dark:border-dark-border opacity-50' : 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/40'}`}>
      {greyed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Not reported this quarter</p>}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{activity.activity_name}</p>
      <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span><span className="font-bold">Phase:</span> {activity.phase}</span>
        <span><span className="font-bold">Period:</span> {activity.implementation_period}</span>
        <span><span className="font-bold">Budget:</span> {fmtPeso(activity.budget_amount)}</span>
        <span><span className="font-bold">Source:</span> {activity.budget_source}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
        <span className="font-bold">Persons:</span> {activity.persons_involved}
      </p>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export function PIRReviewDrawer({ open, pir, onClose, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('inline'); // 'inline' | 'sidebyside'

  // Overall remarks
  const [remarks, setRemarks] = useState('');
  const [remarksSaving, setRemarksSaving] = useState(false);
  const [remarksSaved, setRemarksSaved] = useState(false);
  const [remarksError, setRemarksError] = useState(null);

  // Return flow
  const [returning, setReturning] = useState(false);
  const [returnFeedback, setReturnFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Mutable notes cache
  const notesCache = useRef({});

  const load = useCallback(async () => {
    if (!pir) return;
    setLoading(true);
    setData(null);
    notesCache.current = {};
    try {
      const r = await axios.get(`${API}/api/admin/submissions/${pir.id}?type=pir`, { withCredentials: true });
      setData(r.data);
      setRemarks(r.data.remarks ?? '');
      // Seed notes cache
      (r.data.activity_reviews ?? []).forEach(rev => {
        notesCache.current[rev.id] = rev.admin_notes ?? '';
      });
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [pir]);

  useEffect(() => {
    if (open) {
      setActiveTab('overview');
      setViewMode('inline');
      setReturning(false);
      setReturnFeedback('');
      load();
    }
  }, [open, load]);

  const handleSaveRemarks = async () => {
    setRemarksSaving(true);
    setRemarksError(null);
    setRemarksSaved(false);
    try {
      await axios.patch(`${API}/api/admin/pirs/${pir.id}/remarks`, { remarks }, { withCredentials: true });
      setRemarksSaved(true);
      setTimeout(() => setRemarksSaved(false), 2500);
    } catch { setRemarksError('Failed to save. Please try again.'); }
    finally { setRemarksSaving(false); }
  };

  const handleSaveNotes = (reviewId, notes) => {
    notesCache.current[reviewId] = notes;
  };

  const handleStatus = async (status) => {
    setActionLoading(true);
    try {
      await axios.patch(
        `${API}/api/admin/submissions/${pir.id}/status`,
        { type: 'pir', status, feedback: returnFeedback },
        { withCredentials: true }
      );
      onStatusChange?.();
      onClose();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  // ── Derived stats ──
  const reviews = data?.activity_reviews ?? [];
  const allAipActivities = data?.aip?.activities ?? [];
  const totalFlags = reviews.flatMap(r => getValidationFlags(r));
  const metCount = reviews.filter(r => pct(r.physical_accomplished, r.physical_target) >= 80).length;
  const partialCount = reviews.filter(r => { const p = pct(r.physical_accomplished, r.physical_target); return p !== null && p >= 50 && p < 80; }).length;
  const lowCount = reviews.filter(r => { const p = pct(r.physical_accomplished, r.physical_target); return p !== null && p < 50; }).length;

  const totalPhysTarget = reviews.reduce((s, r) => s + Number(r.physical_target), 0);
  const totalPhysAcc = reviews.reduce((s, r) => s + Number(r.physical_accomplished), 0);
  const totalFinTarget = reviews.reduce((s, r) => s + Number(r.financial_target), 0);
  const totalFinAcc = reviews.reduce((s, r) => s + Number(r.financial_accomplished), 0);
  const overallPhysPct = pct(totalPhysAcc, totalPhysTarget);
  const overallFinPct = pct(totalFinAcc, totalFinTarget);

  const flaggedCount = reviews.filter(r => getValidationFlags(r).length > 0).length;
  const school = data?.aip?.school?.name ?? pir?.school ?? 'Division';
  const program = data?.aip?.program?.title ?? pir?.program ?? '—';
  const quarter = data?.quarter ?? pir?.quarter ?? '—';
  const status = data?.status ?? pir?.status ?? '—';

  const factors = data?.factors ?? [];
  const FACTOR_TYPES = ['Institutional', 'Technical', 'Infrastructure', 'Learning Resources', 'Environmental', 'Others'];

  return (
    <AnimatePresence>
      {open && (
      <div key="pir-drawer">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`fixed z-50 flex flex-col bg-white dark:bg-dark-surface shadow-2xl transition-all duration-300 overflow-hidden ${isFullscreen ? 'inset-0' : 'inset-y-0 left-1/2 -translate-x-1/2 w-[75vw] rounded-2xl my-4'}`}
      >
        {/* ── Header ── */}
        <div className="shrink-0 flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">PIR Review</span>
              <StatusBadge status={status} size="xs" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 leading-tight truncate max-w-[600px]">
              {school} <span className="text-slate-400 font-normal">·</span> {program} <span className="text-slate-400 font-normal">·</span> {quarter}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            {/* Status actions */}
            {!returning ? (
              <>
                <button
                  onClick={() => setReturning(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 transition-colors disabled:opacity-50"
                >
                  <ArrowBendUpLeft size={15} /> Return
                </button>
                <button
                  onClick={() => handleStatus('Approved')}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Check size={15} weight="bold" /> Approve
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={returnFeedback}
                  onChange={e => setReturnFeedback(e.target.value)}
                  placeholder="Feedback for school (optional)"
                  className="px-3 py-1.5 text-xs border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-base text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-accent w-56"
                  autoFocus
                />
                <button
                  onClick={() => handleStatus('Returned')}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <ArrowBendUpLeft size={15} /> Confirm Return
                </button>
                <button
                  onClick={() => { setReturning(false); setReturnFeedback(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            >
              {isFullscreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            >
              <XCircle size={22} weight="fill" />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 flex items-center border-b border-slate-200 dark:border-dark-border px-4 bg-white dark:bg-dark-surface">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'activities', label: `Activities${flaggedCount > 0 ? ` (${flaggedCount} ⚠)` : ` (${reviews.length})`}` },
            { key: 'factors', label: 'Factors' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-bold transition-colors relative ${activeTab === tab.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {tab.label}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
            </button>
          ))}
        </div>

        {/* ── Tab Content (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-accent animate-spin" />
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center h-40 text-slate-400">Failed to load PIR data.</div>
          ) : (
            <>
              {/* ─ OVERVIEW TAB ─ */}
              {activeTab === 'overview' && (
                <div className="p-6 space-y-6">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Activities" value={reviews.length} icon={<ListDashes size={20} />} tooltip="Total number of AIP activities reported in this PIR quarter." />
                    <StatCard label="Met (≥80%)" value={metCount} icon={<Checks size={20} />} color="emerald" tooltip="Activities where physical accomplishment reached at least 80% of the target." />
                    <StatCard label="Partial (50–79%)" value={partialCount} icon={<ChartBar size={20} />} color="amber" tooltip="Activities where physical accomplishment is between 50% and 79% of the target." />
                    <StatCard label="Low (<50%)" value={lowCount} icon={<Warning size={20} />} color="red" tooltip="Activities where physical accomplishment is below 50% of the target. These may require follow-up." />
                  </div>

                  {/* Aggregate rates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-2xl p-4">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Physical Accomplishment</p>
                      <div className="flex items-end gap-3">
                        <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{overallPhysPct ?? '—'}%</span>
                        <span className="text-xs text-slate-400 mb-1">{fmt(totalPhysAcc)} / {fmt(totalPhysTarget)}</span>
                      </div>
                      <RateBar value={overallPhysPct} />
                    </div>
                    <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-2xl p-4">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Financial Utilization</p>
                      <div className="flex items-end gap-3">
                        <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{overallFinPct ?? '—'}%</span>
                        <span className="text-xs text-slate-400 mb-1">{fmtPeso(totalFinAcc)} / {fmtPeso(totalFinTarget)}</span>
                      </div>
                      <RateBar value={overallFinPct} />
                    </div>
                  </div>

                  {/* Validation issues */}
                  {totalFlags.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4">
                      <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Warning size={14} weight="bold" /> Validation Issues ({totalFlags.length})
                      </p>
                      <div className="space-y-1.5">
                        {reviews.flatMap(r => {
                          const flags = getValidationFlags(r);
                          if (!flags.length) return [];
                          return flags.map(f => (
                            <div key={`${r.id}-${f.type}`} className="flex items-center gap-2 text-xs">
                              <FlagChip flag={f} />
                              <span className="text-slate-600 dark:text-slate-300">{r.aip_activity?.activity_name ?? 'Manual activity'}</span>
                            </div>
                          ));
                        })}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MetaField label="Submitted By" value={data.created_by ? (data.created_by.name ?? data.created_by.email) : '—'} />
                    <MetaField label="Date Submitted" value={new Date(data.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} />
                    <MetaField label="Program Owner" value={data.program_owner ?? '—'} />
                    <MetaField label="Total Budget" value={fmtPeso(data.total_budget)} />
                    <MetaField label="Fund Source" value={data.fund_source ?? '—'} />
                    <MetaField label="AIP Year" value={data.aip?.year ?? '—'} />
                    {data.cesReviewer && <MetaField label="CES / Cluster Head Reviewer" value={data.cesReviewer} />}
                    {data.cesNotedAt && <MetaField label="Noted At" value={new Date(data.cesNotedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} />}
                    {data.cesRemarks && <MetaField label="Reviewer Remarks" value={data.cesRemarks} />}
                  </div>

                  {/* Overall Remarks */}
                  <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
                      <NotePencil size={14} className="text-accent" /> Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={e => { setRemarks(e.target.value); setRemarksSaved(false); }}
                      rows={3}
                      placeholder="Write official remarks for this PIR submission…"
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-accent transition-colors"
                    />
                    {remarksError && <p className="mt-1.5 text-xs text-red-500">{remarksError}</p>}
                    {remarksSaved && <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">Remarks saved.</p>}
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleSaveRemarks}
                        disabled={remarksSaving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-accent text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        <FloppyDisk size={16} />
                        {remarksSaving ? 'Saving…' : 'Save Remarks'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ ACTIVITIES TAB ─ */}
              {activeTab === 'activities' && (
                <div className="p-4">
                  {/* View mode toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {reviews.length} reported activit{reviews.length === 1 ? 'y' : 'ies'}
                      {allAipActivities.length > reviews.length && (
                        <span className="ml-2 text-slate-400 font-normal text-xs">· {allAipActivities.length - reviews.length} not reported this quarter</span>
                      )}
                    </p>
                    <div className="flex items-center bg-slate-100 dark:bg-dark-border rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setViewMode('inline')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'inline' ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        <ListDashes size={14} /> Inline
                      </button>
                      <button
                        onClick={() => setViewMode('sidebyside')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'sidebyside' ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        <ArrowsLeftRight size={14} /> Side-by-Side
                      </button>
                    </div>
                  </div>

                  {viewMode === 'inline' ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-dark-border overflow-x-auto">
                      <table className="w-full text-sm min-w-[1100px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-dark-base text-center border-b border-slate-200 dark:border-dark-border">
                            <th rowSpan={2} className="w-8 px-3 py-2.5" />
                            <th rowSpan={2} className="px-3 py-2.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wide border-r border-slate-200 dark:border-dark-border">Activity</th>
                            <th rowSpan={2} className="px-3 py-2.5 text-[11px] font-black text-slate-500 uppercase tracking-wide border-r border-slate-200 dark:border-dark-border">Period</th>
                            <th colSpan={2} className="px-3 py-2 text-[11px] font-black text-slate-500 uppercase tracking-wide border-r border-slate-200 dark:border-dark-border">Target</th>
                            <th colSpan={2} className="px-3 py-2 text-[11px] font-black text-slate-500 uppercase tracking-wide border-r border-slate-200 dark:border-dark-border">Accomplishment</th>
                            <th colSpan={2} className="px-3 py-2 text-[11px] font-black text-slate-500 uppercase tracking-wide bg-slate-100/50 dark:bg-dark-base/50 border-r border-slate-200 dark:border-dark-border">Gap (%)</th>
                            <th rowSpan={2} className="px-3 py-2.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wide border-r border-slate-200 dark:border-dark-border">Actions to Address Gap</th>
                            <th rowSpan={2} className="px-3 py-2.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wide">Remarks</th>
                          </tr>
                          <tr className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border text-center">
                            <th className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-dark-border">Physical</th>
                            <th className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-dark-border">Financial</th>
                            <th className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-dark-border">Physical</th>
                            <th className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-dark-border">Financial</th>
                            <th className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-dark-base/30 border-r border-slate-200 dark:border-dark-border">Physical</th>
                            <th className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-dark-base/30 border-r border-slate-200 dark:border-dark-border">Financial</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                          {reviews.map(review => (
                            <ActivityRow key={review.id} review={review} pirId={pir.id} onSaveNotes={handleSaveNotes} />
                          ))}
                        </tbody>
                      </table>

                      {/* AIP activities not reported */}
                      {allAipActivities.length > reviews.length && (
                        <div className="border-t border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base px-4 py-3">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            AIP Activities Not Reported This Quarter
                          </p>
                          {allAipActivities
                            .filter(a => !reviews.some(r => r.aip_activity_id === a.id))
                            .map(a => (
                              <div key={a.id} className="flex items-center gap-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 opacity-60">
                                <span className="font-semibold">{a.activity_name}</span>
                                <span>·</span>
                                <span>{a.phase}</span>
                                <span>·</span>
                                <span>{a.implementation_period}</span>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  ) : (
                    <SideBySideView
                      reviews={reviews}
                      allAipActivities={allAipActivities}
                      pirId={pir.id}
                      onSaveNotes={handleSaveNotes}
                    />
                  )}
                </div>
              )}

              {/* ─ FACTORS TAB ─ */}
              {activeTab === 'factors' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {FACTOR_TYPES.map(type => {
                      const f = factors.find(x => x.factor_type === type);
                      return (
                        <div key={type} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-slate-50 dark:bg-dark-base border-b border-slate-200 dark:border-dark-border">
                            <p className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{type}</p>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-dark-border">
                            <FactorCell label="Facilitating" value={f?.facilitating_factors} />
                            <FactorCell label="Hindering" value={f?.hindering_factors} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none">
          <div className="w-2 h-2 bg-slate-900 dark:bg-dark-base rotate-45 mx-auto -mb-1" />
          <div className="bg-slate-900 dark:bg-dark-base text-slate-100 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg max-w-[220px] text-center leading-snug">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, tooltip }) {
  const colorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20',
    default: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20',
  };
  const cls = colorMap[color] ?? colorMap.default;
  const card = (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 flex items-center gap-3 cursor-default">
      <div className={`p-2.5 rounded-xl ${cls}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
  return tooltip ? <Tooltip text={tooltip}>{card}</Tooltip> : card;
}

function MetaField({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function FactorCell({ label, value }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      {value ? (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{value}</p>
      ) : (
        <p className="text-xs text-slate-300 dark:text-slate-600 italic">Not provided</p>
      )}
    </div>
  );
}
