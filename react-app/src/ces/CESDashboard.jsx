import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import {
  ArrowClockwise,
  ArrowRight,
  CheckCircle,
  ClipboardText,
  Clock,
  FileText,
  FunnelSimple,
  Hourglass,
  MagnifyingGlass,
  Stack,
  Stamp,
  Tray,
  WarningCircle,
  ArrowUUpLeft,
} from '@phosphor-icons/react';
import { EndOfListCue } from '../components/ui/EndOfListCue.jsx';
import { shouldShowEndOfListCue } from '../components/ui/endOfListCue';
import { emitOnboardingSignal } from '../lib/onboardingSignals.js';
import { useReportingPeriod } from '../context/ReportingPeriodContext.jsx';

function getFirstName() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (user?.first_name) return user.first_name;
    if (user?.name) return user.name.split(' ')[0];
  } catch {
    /* ignore */
  }
  return 'Reviewer';
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getItemTitle(item) {
  return item?.program || item?.title || 'Untitled submission';
}

function getItemOwner(item) {
  return item?.school || item?.owner || 'Division submission';
}

function getStatusMeta(status) {
  const normalized = String(status || 'For CES Review').toLowerCase();
  if (normalized.includes('under')) {
    return {
      label: status || 'Under Review',
      className: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-300',
    };
  }
  if (normalized.includes('return') || normalized.includes('revision')) {
    return {
      label: status || 'Needs Revision',
      className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300',
    };
  }
  if (normalized.includes('approved')) {
    return {
      label: status || 'Approved',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    };
  }
  return {
    label: status || 'For CES Review',
    className: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800/60 dark:bg-teal-950/30 dark:text-teal-300',
  };
}

function StatCard({ label, value, hint, icon, tone = 'teal', active = false, onClick }) {
  const toneMap = {
    teal: {
      icon: 'bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-950/30 dark:text-teal-300 dark:ring-teal-800/50',
      active: 'border-teal-300 ring-2 ring-teal-100 dark:border-teal-700 dark:ring-teal-900/40',
      bar: 'bg-teal-500',
    },
    violet: {
      icon: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50',
      active: 'border-violet-300 ring-2 ring-violet-100 dark:border-violet-700 dark:ring-violet-900/40',
      bar: 'bg-violet-500',
    },
    emerald: {
      icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50',
      active: 'border-emerald-300 ring-2 ring-emerald-100 dark:border-emerald-700 dark:ring-emerald-900/40',
      bar: 'bg-emerald-500',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50',
      active: 'border-amber-300 ring-2 ring-amber-100 dark:border-amber-700 dark:ring-amber-900/40',
      bar: 'bg-amber-500',
    },
    sky: {
      icon: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50',
      active: 'border-sky-300 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-900/40',
      bar: 'bg-sky-500',
    },
  };
  const palette = toneMap[tone] ?? toneMap.teal;
  const isInteractive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      className={`group relative min-h-[116px] overflow-hidden rounded-lg border bg-white p-4 text-left shadow-sm transition-all dark:bg-dark-surface ${
        active ? palette.active : 'border-slate-200 dark:border-dark-border'
      } ${isInteractive ? 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600' : 'cursor-default'}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${active ? palette.bar : 'bg-slate-100 dark:bg-dark-border'}`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${palette.icon}`}>
          {icon}
        </div>
        {active && (
          <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            Active
          </span>
        )}
      </div>
      <div className="mt-4 min-w-0">
        <p className="text-3xl font-black leading-none text-slate-900 dark:text-slate-100">{value}</p>
        <p className="mt-2 truncate text-sm font-black text-slate-700 dark:text-slate-200">{label}</p>
        {hint && <p className="mt-0.5 truncate text-xs font-medium text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    </button>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[0, 1, 2].map((row) => (
        <div key={row} className="grid grid-cols-[1fr_180px_120px] gap-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4 dark:border-dark-border dark:bg-dark-base/50">
          <div className="space-y-2">
            <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-dark-border" />
            <div className="h-2.5 w-1/3 rounded-full bg-slate-200/80 dark:bg-dark-border/80" />
          </div>
          <div className="hidden h-8 rounded-md bg-slate-200/80 dark:bg-dark-border/80 sm:block" />
          <div className="h-8 rounded-md bg-slate-200/80 dark:bg-dark-border/80" />
        </div>
      ))}
    </div>
  );
}

export default function CESDashboard() {
  const navigate = useNavigate();
  const { selectedYear, selectedQuarter } = useReportingPeriod();
  const [pirs, setPirs] = useState([]);
  const [aips, setAips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pirs');
  const firstName = useMemo(getFirstName, []);
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  const [modal, setModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPIRs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedYear) params.set('year', selectedYear);
    if (selectedQuarter) params.set('quarter', selectedQuarter);
    const suffix = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      api.get(`/api/admin/ces/pirs${suffix}`),
      api.get(`/api/admin/ces/aips${suffix}`),
    ])
      .then(([pirRes, aipRes]) => {
        setPirs(Array.isArray(pirRes.data) ? pirRes.data : []);
        setAips(Array.isArray(aipRes.data) ? aipRes.data : []);
      })
      .catch(() => {
        setPirs([]);
        setAips([]);
      })
      .finally(() => setLoading(false));
  }, [selectedYear, selectedQuarter]);

  useEffect(() => {
    fetchPIRs();
  }, [fetchPIRs]);

  const stats = useMemo(() => {
    const awaiting = pirs.filter((p) => p.status === 'For CES Review').length;
    const inProgress = pirs.filter((p) => p.status === 'Under Review').length;
    const timestamps = [...pirs, ...aips]
      .map((p) => new Date(p.submittedAt).getTime())
      .filter(Number.isFinite);
    const oldestDays = timestamps.length
      ? Math.max(0, Math.floor((Date.now() - Math.min(...timestamps)) / 86400000))
      : 0;
    const latestSubmitted = timestamps.length ? Math.max(...timestamps) : null;
    return {
      awaiting,
      inProgress,
      aips: aips.length,
      oldestDays,
      hasItems: pirs.length + aips.length > 0,
      latestSubmitted,
    };
  }, [pirs, aips]);

  const visibleItems = activeTab === 'pirs' ? pirs : aips;
  const filtered = visibleItems.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.program?.toLowerCase().includes(q) ||
      item.school?.toLowerCase().includes(q) ||
      item.owner?.toLowerCase().includes(q) ||
      item.submittedBy?.toLowerCase().includes(q) ||
      String(item.year ?? '').includes(q)
    );
  });

  const showReviewEndCue = shouldShowEndOfListCue(filtered.length);
  const periodLabel = selectedQuarter ? `Q${selectedQuarter} / FY ${selectedYear}` : selectedYear ? `FY ${selectedYear}` : 'All periods';
  const totalPending = stats.awaiting + stats.inProgress + stats.aips;
  const activeLabel = activeTab === 'pirs' ? 'PIRs' : 'AIPs';
  const otherLabel = activeTab === 'pirs' ? 'AIPs' : 'PIRs';
  const otherCount = activeTab === 'pirs' ? aips.length : pirs.length;
  const hasSearch = search.trim().length > 0;
  const queueTitle = activeTab === 'pirs' ? 'PIR review queue' : 'AIP review queue';
  const queueHint = activeTab === 'pirs'
    ? 'PIRs recommended for CES action in the selected period.'
    : 'AIPs recommended by focal reviewers in the selected period.';
  const emptyTitle = hasSearch ? 'No matching submissions' : totalPending > 0 ? `${activeLabel} queue is clear` : 'All clear for this period';
  const emptyMessage = hasSearch
    ? 'Try a different program, school, owner, or year.'
    : activeTab === 'pirs'
      ? 'There are no PIRs waiting in this view right now.'
      : 'There are no AIPs waiting in this view right now.';
  const latestLabel = stats.latestSubmitted ? formatDate(stats.latestSubmitted) : 'No submissions yet';

  const openModal = (type, pir, event) => {
    event.stopPropagation();
    setModal({ type, pirId: pir.id, program: pir.program, quarter: pir.quarter });
    setRemarks('');
    setError('');
  };

  const openItem = (item) => {
    navigate(activeTab === 'pirs' ? `/ces/pirs/${item.id}` : `/ces/aips/${item.id}`);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const endpoint = modal.type === 'note'
        ? `/api/admin/ces/pirs/${modal.pirId}/note`
        : `/api/admin/ces/pirs/${modal.pirId}/return`;
      await api.post(endpoint, { ces_remarks: remarks });
      setModal(null);
      fetchPIRs();
    } catch (err) {
      setError(err.friendlyMessage ?? 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-teal-50/70 p-5 dark:border-dark-border dark:from-dark-surface dark:via-dark-surface dark:to-teal-950/20 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-teal-500">
                  <ClipboardText size={24} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">CES Review Queue</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                    {greeting}, {firstName}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {totalPending > 0
                      ? `${totalPending} submission${totalPending !== 1 ? 's' : ''} need attention across PIR and AIP review.`
                      : 'No CES items are waiting in the selected reporting period.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm dark:border-dark-border dark:bg-dark-base dark:text-slate-300">
                  <Clock size={14} weight="bold" />
                  {periodLabel}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black shadow-sm ${
                  totalPending > 0
                    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                }`}
                >
                  {totalPending > 0 ? <WarningCircle size={14} weight="fill" /> : <CheckCircle size={14} weight="fill" />}
                  {totalPending > 0 ? 'Needs action' : 'All clear'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-0 divide-y divide-slate-100 dark:divide-dark-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4 sm:px-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Current View</p>
              <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{queueTitle}</p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Latest Submission</p>
              <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{latestLabel}</p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Oldest Waiting</p>
              <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">
                {stats.hasItems ? `${stats.oldestDays} day${stats.oldestDays === 1 ? '' : 's'}` : 'None'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-sm dark:border-dark-border dark:bg-black/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Workload</p>
              <p className="mt-1 text-sm text-slate-400">Selected reporting period</p>
            </div>
            <button
              type="button"
              onClick={fetchPIRs}
              disabled={loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              aria-label="Refresh review queue"
            >
              <ArrowClockwise size={16} weight="bold" className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-black leading-none tracking-tight">{totalPending}</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">Open review items</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-right">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Status</p>
              <p className={totalPending > 0 ? 'mt-0.5 text-sm font-black text-amber-300' : 'mt-0.5 text-sm font-black text-emerald-300'}>
                {totalPending > 0 ? 'Active queue' : 'Clear'}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              ['PIRs', stats.awaiting],
              ['In Review', stats.inProgress],
              ['AIPs', stats.aips],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <p className="text-lg font-black">{value}</p>
                <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="PIRs Awaiting"
          value={stats.awaiting}
          hint="Ready for CES decision"
          icon={<Stack size={21} weight="bold" />}
          tone="teal"
          active={activeTab === 'pirs'}
          onClick={() => setActiveTab('pirs')}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          hint="Opened by a reviewer"
          icon={<Hourglass size={21} weight="bold" />}
          tone="violet"
        />
        <StatCard
          label="AIPs to Review"
          value={stats.aips}
          hint="Focal-recommended plans"
          icon={<FileText size={21} weight="bold" />}
          tone="emerald"
          active={activeTab === 'aips'}
          onClick={() => setActiveTab('aips')}
        />
        <StatCard
          label={stats.hasItems ? 'Queue Age' : 'Queue Health'}
          value={stats.hasItems ? `${stats.oldestDays}d` : 'Clear'}
          hint={stats.hasItems ? 'Oldest submitted item' : 'Nothing waiting'}
          icon={stats.hasItems ? <Clock size={21} weight="bold" /> : <CheckCircle size={21} weight="bold" />}
          tone={stats.hasItems && stats.oldestDays >= 7 ? 'amber' : 'sky'}
        />
      </section>

      <section data-tour="ces-queue" className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="border-b border-slate-100 p-4 dark:border-dark-border sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-dark-base dark:text-slate-300">
                  <FunnelSimple size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black text-slate-900 dark:text-slate-100">{queueTitle}</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">{queueHint}</p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500">
              <Tray size={15} weight="bold" />
              {filtered.length} of {visibleItems.length} shown
            </div>
          </div>

          <div data-tour="ces-filters" className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 dark:bg-dark-base sm:w-auto">
              {[
                { key: 'pirs', label: 'PIRs', count: pirs.length, icon: Stack },
                { key: 'aips', label: 'AIPs', count: aips.length, icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-xs font-black transition-colors sm:flex-none ${
                      isActive
                        ? 'bg-white text-teal-700 shadow-sm dark:bg-dark-surface dark:text-teal-300'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon size={15} weight={isActive ? 'fill' : 'regular'} />
                    {tab.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                        : 'bg-white text-slate-400 dark:bg-dark-surface dark:text-slate-500'
                    }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    emitOnboardingSignal('ces.filter_applied', { control: 'search' });
                  }}
                  placeholder="Search program, school, owner"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-dark-border dark:bg-dark-base dark:text-slate-200 dark:focus:border-teal-700 dark:focus:ring-teal-900/40"
                />
              </div>
              <button
                type="button"
                onClick={fetchPIRs}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50 dark:border-dark-border dark:bg-dark-base dark:text-slate-300 dark:hover:bg-teal-950/30 dark:hover:text-teal-300"
              >
                <ArrowClockwise size={14} weight="bold" className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <QueueSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center px-6 py-12 text-center">
            <div className="max-w-md">
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-lg ${
                hasSearch
                  ? 'bg-slate-100 text-slate-500 dark:bg-dark-base dark:text-slate-300'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300'
              }`}
              >
                {hasSearch ? <MagnifyingGlass size={26} weight="bold" /> : <CheckCircle size={28} weight="fill" />}
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-slate-100">{emptyTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{emptyMessage}</p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                {hasSearch ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-black text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    Clear search
                  </button>
                ) : otherCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'pirs' ? 'aips' : 'pirs')}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-black text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    View {otherCount} {otherLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={fetchPIRs}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 dark:border-dark-border dark:bg-dark-base dark:text-slate-300 dark:hover:bg-dark-border/40"
                >
                  <ArrowClockwise size={14} weight="bold" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:border-dark-border dark:bg-dark-base/60 dark:text-slate-500">
                  <th className="px-5 py-3 text-left">Program</th>
                  <th className="px-5 py-3 text-left">School / Owner</th>
                  <th className="px-5 py-3 text-left">Period</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Submitted</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border/70">
                {filtered.map((item) => {
                  const status = getStatusMeta(item.status);
                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer bg-white transition-colors hover:bg-slate-50 dark:bg-dark-surface dark:hover:bg-dark-border/20"
                      onClick={() => openItem(item)}
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[280px]">
                          <p className="truncate font-black text-slate-800 dark:text-slate-100">{getItemTitle(item)}</p>
                          <p className="mt-1 truncate text-xs font-medium text-slate-400 dark:text-slate-500">
                            {activeTab === 'pirs' ? item.quarter || periodLabel : `FY ${item.year ?? selectedYear ?? 'N/A'}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[240px] truncate font-semibold text-slate-600 dark:text-slate-300">{getItemOwner(item)}</p>
                        {item.owner && item.school && (
                          <p className="mt-1 max-w-[240px] truncate text-xs text-slate-400 dark:text-slate-500">{item.owner}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                        {activeTab === 'pirs' ? item.quarter || `Q${selectedQuarter ?? '-'}` : `FY ${item.year ?? selectedYear ?? '-'}`}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {formatDate(item.submittedAt)}
                        {item.submittedBy && (
                          <span className="block max-w-[160px] truncate pt-1 text-slate-500 dark:text-slate-400">{item.submittedBy}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openItem(item)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-black text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                          >
                            {activeTab === 'aips' ? 'Review' : item.status === 'Under Review' ? 'Continue' : 'Open'}
                            <ArrowRight size={13} weight="bold" />
                          </button>
                          {activeTab === 'pirs' && item.status !== 'Under Review' && (
                            <>
                              <button
                                type="button"
                                onClick={(event) => openModal('note', item, event)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-black text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-800/60 dark:bg-teal-950/30 dark:text-teal-300 dark:hover:bg-teal-950/50"
                              >
                                <Stamp size={13} weight="bold" />
                                Note
                              </button>
                              <button
                                type="button"
                                onClick={(event) => openModal('return', item, event)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
                              >
                                <ArrowUUpLeft size={13} weight="bold" />
                                Return
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {filtered.length > 0 && (
        <div className="mt-3">
          <EndOfListCue
            count={filtered.length}
            message={search || activeTab === 'aips' ? `All matching ${activeTab.toUpperCase()} shown` : 'End of review queue'}
            countLabel={activeTab === 'pirs' ? 'PIR' : 'AIP'}
            showCount
          />
          {!showReviewEndCue && (
            <p className="text-right text-xs text-slate-400 dark:text-slate-500">
              {filtered.length} {activeTab === 'pirs' ? 'PIR' : 'AIP'}{filtered.length !== 1 ? 's' : ''} pending review
            </p>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-dark-border dark:bg-dark-surface">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-dark-border">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  modal.type === 'note'
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                }`}
                >
                  {modal.type === 'note' ? <Stamp size={20} weight="bold" /> : <ArrowUUpLeft size={20} weight="bold" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {modal.type === 'note' ? 'Note / Forward to SDS' : 'Return to Submitter'}
                  </h2>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {modal.program} / {modal.quarter}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {modal.type === 'note'
                  ? 'This PIR will be forwarded to the SDS for final review. Remarks are optional.'
                  : 'This PIR will be returned to the submitter for corrections. Feedback is required for a useful return.'}
              </p>

              <label className="mt-4 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {modal.type === 'note' ? 'Remarks' : 'Feedback / Reason for return'}
              </label>
              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={4}
                placeholder={modal.type === 'note' ? 'Add notes for SDS...' : 'Explain what needs to be corrected...'}
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-dark-border dark:bg-dark-base dark:text-slate-200 dark:focus:border-teal-700 dark:focus:ring-teal-900/40"
              />

              {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-dark-border dark:bg-dark-base">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={submitting}
                className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className={`inline-flex h-10 items-center rounded-lg px-4 text-xs font-black text-white transition-colors disabled:opacity-60 ${
                  modal.type === 'note'
                    ? 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600'
                    : 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500'
                }`}
              >
                {submitting ? 'Saving...' : modal.type === 'note' ? 'Note & Forward' : 'Return PIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
