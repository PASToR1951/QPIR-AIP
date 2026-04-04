import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
import { Buildings, BookOpen, Eye, ChartBar, ChartDonut, ArrowRight, Users, UserCircle, Warning, ClockCountdown, CaretDown, CaretUp, Info, ClockCounterClockwise, Notification } from '@phosphor-icons/react';
import { StatusBadge } from '../components/StatusBadge.jsx';

const API = import.meta.env.VITE_API_URL;


const CHART_COLORS = ['#E94560', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];
const BAR_COLORS = { Submitted: '#3b82f6', Approved: '#10b981', 'Under Review': '#f59e0b', Returned: '#E94560' };

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

function getNivoTheme(isDark) {
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#413D37' : '#e2e8f0';
  const tooltipBg = isDark ? '#262421' : '#ffffff';
  const tooltipBorder = isDark ? '#413D37' : '#e2e8f0';
  return {
    background: 'transparent',
    text: { fontSize: 11, fontWeight: 700, fill: textColor },
    grid: { line: { stroke: gridColor, strokeWidth: 1 } },
    axis: {
      ticks: {
        line: { stroke: gridColor, strokeWidth: 1 },
        text: { fill: textColor, fontSize: 11, fontWeight: 700 },
      },
      legend: { text: { fill: textColor } },
    },
    legends: { text: { fill: textColor, fontSize: 11, fontWeight: 700 } },
    tooltip: {
      container: {
        background: tooltipBg,
        color: isDark ? '#e2e8f0' : '#1e293b',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 10,
        border: `1px solid ${tooltipBorder}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        padding: '8px 12px',
      },
    },
  };
}

function relativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function pirBarColor(pct) {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}
function pirBarTrack(pct) {
  if (pct >= 90) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (pct >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-rose-100 dark:bg-rose-900/30';
}
function pirTextColor(pct) {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}
function pirPctBadge(pct) {
  if (pct >= 90) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
  if (pct >= 60) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300';
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  const btnRef = React.useRef(null);
  const [pos, setPos] = useState(null);

  React.useEffect(() => {
    if (!show || !btnRef.current) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    const tipW = 208;
    let left = r.left + r.width / 2 - tipW / 2;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - 8 - tipW;
    setPos({ top: r.top - 6, left });
  }, [show]);

  return (
    <span className="inline-flex">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); setShow(s => !s); }}
        className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
      >
        <Info size={15} weight="fill" />
      </button>
      {show && pos && ReactDOM.createPortal(
        <span
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 208, transform: 'translateY(-100%)' }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 dark:bg-dark-border text-slate-100 text-[10px] leading-snug font-medium shadow-lg z-[9999] pointer-events-none text-center"
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

function PirClusterPanel({ cluster: cl, navigate }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden">
      {/* Cluster header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/80 dark:hover:bg-dark-border/20 transition-colors"
      >
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 ${pirPctBadge(cl.pct)}`}>
          {cl.pct}%
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">
            Cluster {cl.cluster_number}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {cl.submittedAips}/{cl.totalAips} PIRs filed · {cl.approvedAips} approved · {cl.totalSchools} schools
          </p>
        </div>
        {/* Cluster-level progress bar */}
        <div className={`hidden sm:block w-32 h-2 rounded-full ${pirBarTrack(cl.pct)} shrink-0`}>
          <div className={`h-full rounded-full transition-all ${pirBarColor(cl.pct)}`} style={{ width: `${Math.max(cl.pct, 2)}%` }} />
        </div>
        <span className="text-slate-400 dark:text-slate-500 shrink-0">
          {open ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
        </span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="border-t border-slate-100 dark:border-dark-border overflow-hidden"
        >
          {/* Cluster summary row */}
          <div className="grid grid-cols-3 gap-3 px-4 py-3 bg-slate-50 dark:bg-dark-border/15 border-b border-slate-100 dark:border-dark-border/60">
            <div className="text-center">
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{cl.totalAips}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1">
                Total AIPs <InfoTip text="Number of Annual Implementation Plans (programs) submitted by all schools in this cluster for the current year." />
              </p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-black ${pirTextColor(cl.pct)}`}>{cl.submittedAips}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1">
                PIRs Filed <InfoTip text="PIRs submitted this quarter. Each AIP (program) requires its own PIR per quarter." />
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{cl.approvedAips}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1">
                Approved <InfoTip text="PIRs that have been reviewed and approved by admin this quarter." />
              </p>
            </div>
          </div>

          {/* Per-school list */}
          <div className="px-4 py-2">
            {/* Column header */}
            <div className="flex items-center gap-3 px-2 py-1.5 mb-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex-1">School</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 w-24 text-center hidden sm:block">Progress</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 w-20 text-right flex items-center justify-end gap-1">
                PIRs <InfoTip text="Submitted / Total programs. Shows how many program PIRs this school has filed out of its total AIPs." />
              </p>
            </div>
            {cl.schools.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">No schools in this cluster</p>
            )}
            {cl.schools.map(sch => (
              <div
                key={sch.id}
                className="flex items-center gap-3 px-2 py-2 -mx-0 rounded-lg hover:bg-slate-100/80 dark:hover:bg-dark-border/25 transition-colors cursor-default"
              >
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-0 flex-1 truncate">{sch.name}</p>
                <div className={`hidden sm:block w-24 h-1.5 rounded-full ${pirBarTrack(sch.pct)} shrink-0`}>
                  <div className={`h-full rounded-full ${pirBarColor(sch.pct)}`} style={{ width: `${Math.max(sch.pct, sch.totalAips > 0 ? 3 : 0)}%` }} />
                </div>
                <span className={`text-xs font-black w-20 text-right shrink-0 tabular-nums ${pirTextColor(sch.pct)}`}>
                  {sch.submitted}/{sch.totalAips}
                </span>
              </div>
            ))}
          </div>

          {/* Footer link */}
          <div className="border-t border-slate-100 dark:border-dark-border/60 px-4 py-2.5">
            <button
              onClick={() => navigate(`/admin/submissions?type=pir&cluster=${cl.id}`)}
              className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 uppercase tracking-widest transition-colors"
            >
              View all submissions <ArrowRight size={12} weight="bold" />
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [clusterSort, setClusterSort] = useState('desc'); // 'asc' | 'desc'
  const navigate = useNavigate();
  const isDark = useIsDark();
  const nivoTheme = getNivoTheme(isDark);

  useEffect(() => {
    axios.get(`${API}/api/admin/overview`, { withCredentials: true })
      .then(r => setData(r.data))
      .catch(e => { console.error(e); setFetchError('Failed to load dashboard data. Please refresh and try again.'); })
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  const sortedClusters = React.useMemo(() => {
    const list = data?.pirClusterStatus ?? [];
    return [...list].sort((a, b) =>
      clusterSort === 'desc' ? b.pct - a.pct : a.pct - b.pct
    );
  }, [data?.pirClusterStatus, clusterSort]);

  const quarterData = (data?.pirQuarterly ?? []).map((q) => ({
    name: q.quarter,
    Submitted: q.submitted,
    Approved: q.approved,
    'Under Review': q.underReview,
    Returned: q.returned,
  }));

  const pieData = (data?.clusterCompliance ?? []).map((entry, i) => ({
    id: entry.name,
    label: entry.name,
    value: entry.compliant,
    color: CHART_COLORS[i % CHART_COLORS.length],
    total: entry.total,
    pct: entry.pct,
  }));

  const user = (() => {
    try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  return (
    <>
      {fetchError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium mb-4">
          {fetchError}
        </div>
      )}
      {loading ? (
        <div className="space-y-6">
          {/* Hero skeleton */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] overflow-hidden animate-pulse">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-dark-border">
              <div className="flex-1 p-8 md:p-10 space-y-3">
                <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded" />
                <div className="h-9 w-72 bg-slate-200 dark:bg-dark-border rounded-xl" />
                <div className="h-4 w-80 bg-slate-100 dark:bg-dark-border/60 rounded" />
                <div className="flex gap-3 pt-4">
                  <div className="h-10 w-40 bg-slate-200 dark:bg-dark-border rounded-2xl" />
                  <div className="h-10 w-24 bg-slate-100 dark:bg-dark-border/60 rounded-2xl" />
                </div>
              </div>
              <div className="w-full lg:w-80 xl:w-96 p-5 space-y-3">
                <div className="h-3 w-28 bg-slate-200 dark:bg-dark-border rounded" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-dark-border/50 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          {/* Chart skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
                <div className="h-4 w-40 bg-slate-200 dark:bg-dark-border rounded-lg animate-pulse mb-4" />
                <div className="h-52 bg-slate-100 dark:bg-dark-border/50 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <div className="h-4 w-36 bg-slate-200 dark:bg-dark-border rounded-lg animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-dark-border/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >

          {/* Hero Welcome Card */}
          <motion.div variants={fadeUp} className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] shadow-sm overflow-hidden group">
            {/* SDO Facade background */}
            <div
              className="absolute inset-y-0 -left-4 w-[65%] opacity-30 grayscale pointer-events-none transition-all duration-700 group-hover:opacity-45 group-hover:grayscale-0"
              style={{
                backgroundImage: "url('/SDO_Facade.webp')",
                backgroundSize: 'cover',
                backgroundPosition: 'center 70%',
                maskImage: 'linear-gradient(to right, black 30%, transparent)',
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-dark-border">

              {/* Left — Welcome + CTAs */}
              <div className="relative flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-center gap-6 min-h-[240px] overflow-hidden">
                {/* AIP-PIR watermark */}
                <img
                  src="/AIP-PIR-logo.webp"
                  alt=""
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-52 md:h-64 lg:h-72 w-auto object-contain opacity-[0.05] dark:opacity-[0.04] pointer-events-none select-none"
                />
                <div>
                  {/* Institutional logos */}
                  <div className="flex items-center gap-3 mb-5">
                    <img src="/DepEd_Seal.webp" alt="DepEd" className="h-10 sm:h-12 w-auto object-contain" />
                    <img src="/DepEd NIR Logo.webp" alt="DepEd NIR" className="h-10 sm:h-12 w-auto object-contain" />
                    <img src="/Division_Logo.webp" alt="Division" className="h-10 sm:h-12 w-auto object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Admin Overview</span>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1.5 mb-3">
                    Welcome back,{' '}
                    <span className="text-pink-600">{user?.name || 'Admin'}</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
                    {s?.pirSubmittedThisQ != null
                      ? `${s.pirSubmittedThisQ} PIR submission${s.pirSubmittedThisQ !== 1 ? 's' : ''} this quarter · ${s.aipCompliancePct ?? 0}% AIP compliance · Q${s.currentQuarter} deadline ${s.daysLeft != null && s.daysLeft >= 0 ? `in ${s.daysLeft}d` : 'overdue'}.`
                      : 'Loading system status…'
                    }
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => navigate('/admin/submissions')}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-black transition-all duration-150 shadow-md hover:shadow-lg active:scale-95"
                  >
                    View Submissions
                    <ArrowRight size={18} weight="bold" />
                  </button>
                  <button
                    onClick={() => navigate('/admin/reports')}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-dark-border border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-200 text-sm font-black transition-all duration-150 hover:shadow-md active:scale-95"
                  >
                    Reports
                  </button>
                </div>
              </div>

              {/* Right — At a Glance panel */}
              <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-dark-border">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">At a Glance</span>
                </div>
                <div className="flex-1 flex flex-col divide-y divide-slate-50 dark:divide-dark-border/60">

                  {/* Deadline */}
                  <button
                    onClick={() => navigate('/admin/deadlines')}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-base text-left transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      s?.daysLeft < 0 ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500' :
                      s?.daysLeft <= 14 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' :
                      'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500'
                    }`}>
                      <ClockCountdown size={18} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {s?.daysLeft == null ? '—' : s.daysLeft < 0 ? 'Deadline Overdue' : s.daysLeft === 0 ? 'Deadline Today' : `${s.daysLeft} days left`}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Q{s?.currentQuarter} submission deadline</p>
                    </div>
                    <ArrowRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-colors" />
                  </button>

                  {/* Submissions needing review */}
                  <button
                    onClick={() => navigate('/admin/submissions')}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-base text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500">
                      <BookOpen size={18} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {s?.pirSubmittedThisQ ?? '—'} PIR · {s?.aipCompliantCount ?? '—'} AIP filed
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Submissions this quarter</p>
                    </div>
                    <ArrowRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-colors" />
                  </button>

                  {/* Non-compliant schools */}
                  <button
                    onClick={() => navigate('/admin/schools')}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-base text-left transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      (s?.totalSchools - s?.aipCompliantCount) > 0
                        ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500'
                        : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500'
                    }`}>
                      <Warning size={18} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {s != null ? `${s.totalSchools - s.aipCompliantCount} schools non-compliant` : '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">AIP compliance status</p>
                    </div>
                    <ArrowRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-colors" />
                  </button>

                  {/* Total schools */}
                  <button
                    onClick={() => navigate('/admin/schools')}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-base text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                      <Buildings size={18} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">{s?.totalSchools ?? '—'} schools enrolled</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">School management</p>
                    </div>
                    <ArrowRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-colors" />
                  </button>

                  {/* Program owners */}
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-base text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-100 dark:bg-violet-950/40 text-violet-500">
                      <UserCircle size={18} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">{s?.totalProgramOwners ?? '—'} program owners</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{s?.totalPrograms ?? '—'} programs registered</p>
                    </div>
                    <ArrowRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-colors" />
                  </button>

                </div>
              </div>

            </div>
          </motion.div>

          {/* Charts Section Header */}
          <motion.div variants={fadeUp} className="flex items-center gap-4 px-1">
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Analytics</h2>
            <span className="flex-1 h-px bg-slate-200 dark:bg-dark-border/60" />
          </motion.div>

          {/* Charts Row */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PIR Quarterly Progress (primary) */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ChartBar size={17} weight="bold" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">PIR Quarterly Progress</h3>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveBar
                  data={quarterData}
                  keys={['Submitted', 'Approved', 'Under Review', 'Returned']}
                  indexBy="name"
                  margin={{ top: 10, right: 16, bottom: 28, left: 36 }}
                  padding={0.28}
                  groupMode="grouped"
                  colors={({ id }) => BAR_COLORS[id]}
                  borderRadius={4}
                  theme={nivoTheme}
                  enableGridX={false}
                  enableLabel={false}
                  axisBottom={{ tickSize: 0, tickPadding: 10 }}
                  axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
                  animate
                  motionConfig="gentle"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-3">
                {Object.entries(BAR_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AIP Compliance by Cluster (secondary) */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ChartDonut size={17} weight="bold" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">AIP Compliance by Cluster</h3>
              </div>
              {pieData.length > 0 ? (
                <>
                  <div style={{ height: 200 }}>
                    <ResponsivePie
                      data={pieData}
                      margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                      innerRadius={0.62}
                      padAngle={2}
                      cornerRadius={4}
                      colors={{ datum: 'data.color' }}
                      theme={nivoTheme}
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={20}
                      arcLabelsTextColor="#ffffff"
                      tooltip={({ datum }) => (
                        <div style={{
                          background: isDark ? '#262421' : '#ffffff',
                          border: `1px solid ${isDark ? '#413D37' : '#e2e8f0'}`,
                          borderRadius: 10,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDark ? '#e2e8f0' : '#1e293b',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        }}>
                          <strong style={{ color: datum.color }}>{datum.label}</strong>
                          <div style={{ marginTop: 2, color: isDark ? '#94a3b8' : '#64748b' }}>
                            {datum.data.value}/{datum.data.total} schools ({datum.data.pct}%)
                          </div>
                        </div>
                      )}
                      animate
                      motionConfig="gentle"
                    />
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                    {pieData.map(d => (
                      <div key={d.id} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{d.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({d.value}/{d.total})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-52 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">No data</div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* PIR Submission Status by Cluster — per-school breakdown */}
            {data?.pirClusterStatus?.length > 0 && (
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Notification size={17} weight="bold" />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Q{s?.currentQuarter} PIR Status by Cluster</h3>
                    <InfoTip text="Shows how many program-level PIRs each school has submitted this quarter. Each AIP (program) needs its own PIR — percentage reflects programs filed vs total programs." />
                  </div>
                  <button
                    onClick={() => setClusterSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
                  >
                    {clusterSort === 'desc' ? 'Highest' : 'Lowest'} first
                    <span className="flex flex-col -space-y-1">
                      <CaretUp size={10} weight="bold" className={clusterSort === 'asc' ? 'text-indigo-500' : 'opacity-30'} />
                      <CaretDown size={10} weight="bold" className={clusterSort === 'desc' ? 'text-indigo-500' : 'opacity-30'} />
                    </span>
                  </button>
                </div>
                <div className="space-y-3">
                  {sortedClusters.map(cl => (
                    <PirClusterPanel key={cl.id} cluster={cl} navigate={navigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Submissions Table */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ClockCounterClockwise size={17} weight="bold" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Recent Submissions</h3>
                </div>
                <button onClick={() => navigate('/admin/submissions')} className="flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest">
                  View All
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
              {data?.recentSubmissions?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-dark-border">
                        <th className="px-3 py-2 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">School</th>
                        <th className="px-3 py-2 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Program</th>
                        <th className="px-3 py-2 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Type</th>
                        <th className="px-3 py-2 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">Quarter</th>
                        <th className="px-3 py-2 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Submitted</th>
                        <th className="px-3 py-2 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Status</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                      {data.recentSubmissions.map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200 max-w-[140px] truncate">{sub.school}</td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-[160px] truncate hidden sm:table-cell">{sub.program}</td>
                          <td className="px-3 py-2.5"><StatusBadge status={sub.type} size="xs" /></td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">{sub.quarter ?? '—'}</td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap hidden sm:table-cell">{relativeTime(sub.submitted)}</td>
                          <td className="px-3 py-2.5"><StatusBadge status={sub.status} size="xs" /></td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => navigate(`/admin/submissions`)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              <Eye size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-600 py-8 text-center">No submissions yet.</p>
              )}
            </div>
          </motion.div>

        </motion.div>
      )}
    </>
  );
}
