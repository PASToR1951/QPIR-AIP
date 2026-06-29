import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  ChatCircleText,
  CheckCircle,
  ClipboardText,
  Funnel,
  House,
  List as Menu,
  MagnifyingGlass,
  PaperPlaneTilt,
  SignOut,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import api from '../lib/api.js';
import { auth } from '../lib/auth.js';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { NotificationBell } from '../components/ui/NotificationBell.jsx';
import { ReportingPeriodPicker } from '../components/ui/ReportingPeriodPicker.jsx';
import { useReportingPeriod } from '../context/ReportingPeriodContext.jsx';
import { getRoleVisualTheme } from '../lib/roleVisualTheme.js';
import { StatusBadge } from '../admin/components/StatusBadge.jsx';

const NAV_BASE = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative select-none border';
const NAV_ACTIVE = 'bg-white/55 dark:bg-white/[0.10] text-slate-900 dark:text-slate-50 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm border-white/60 dark:border-white/[0.08]';

function NavItem({ to, label, Icon, end, onNavigate, roleTheme }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${NAV_BASE} ${isActive ? NAV_ACTIVE : `text-slate-600 dark:text-slate-300 font-medium border-transparent hover:border-slate-900/[0.06] dark:hover:border-white/[0.08] ${roleTheme.hoverNav}`}`
      }
    >
      {({ isActive }) => (
        <>
          {createElement(Icon, {
            size: 20,
            weight: isActive ? 'fill' : 'regular',
            className: `shrink-0 transition-all duration-200 ${isActive ? `${roleTheme.text} drop-shadow-sm` : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`,
          })}
          <span className="truncate flex-1">{label}</span>
        </>
      )}
    </NavLink>
  );
}

const SECTION_OPTIONS = [
  { value: 'profile', label: 'Profile' },
  { value: 'financials', label: 'Financials' },
  { value: 'indicators', label: 'Indicators' },
  { value: 'activities', label: 'Activities' },
  { value: 'factors', label: 'Factors' },
  { value: 'action_items', label: 'Action Items' },
  { value: 'monitoring_evaluation', label: 'Monitoring & Evaluation' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  '',
  'For Recommendation',
  'For CES Review',
  'Under Review',
  'Needs Revision',
  'Approved',
  'Returned',
];

const PIR_PAGE_SIZE = 10;
const REMARK_BODY_LIMIT = 5000;

const REMARK_CATEGORY_OPTIONS = [
  {
    value: 'suggested_change',
    label: 'Suggested Change',
    helper: 'Request an edit or missing detail',
  },
  {
    value: 'mistake',
    label: 'Mistake',
    helper: 'Flag incorrect data or evidence',
  },
];

const REMARK_SCOPE_OPTIONS = [
  { value: 'overall', label: 'Overall', helper: 'Applies to the whole PIR' },
  { value: 'section', label: 'Section', helper: 'Targets one part of the PIR' },
];

function usePeriodQuery(extra = {}) {
  const { selectedYear, selectedQuarter } = useReportingPeriod();
  return useMemo(() => {
    const params = new URLSearchParams();
    if (selectedYear) params.set('year', selectedYear);
    if (selectedQuarter) params.set('quarter', selectedQuarter);
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.set(key, value);
      }
    });
    const text = params.toString();
    return text ? `?${text}` : '';
  }, [selectedQuarter, selectedYear, extra]);
}

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return 'No submission yet';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Recently submitted';
  }
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count ?? 0} ${Number(count) === 1 ? singular : plural}`;
}

function statusTone(status) {
  if (status === 'Approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300';
  if (status === 'Needs Revision' || status === 'Returned') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300';
  if (status === 'Under Review' || status === 'For CES Review' || status === 'For Recommendation') return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300';
  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-dark-border dark:bg-dark-base dark:text-slate-300';
}

function humanizeToken(value) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sectionLabel(value) {
  return SECTION_OPTIONS.find((section) => section.value === value)?.label ?? humanizeToken(value);
}

function categoryLabel(value) {
  return REMARK_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? humanizeToken(value);
}

function categoryTone(value) {
  if (value === 'mistake') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300';
  return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300';
}

function KpiCard({ icon, label, value, hint, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-600 bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300',
    amber: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
    green: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300',
    blue: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300',
  };
  return (
    <div className="flex min-h-[104px] items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-dark-border dark:bg-dark-surface dark:hover:border-slate-700">
      <div className={`shrink-0 rounded-lg p-2.5 ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none text-slate-800 dark:text-slate-100">{value ?? 0}</p>
        <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">{label}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

function EmptyWorklist({ hasFilters, onClearFilters }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-dark-border dark:bg-dark-surface">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
        <ClipboardText size={24} weight="duotone" />
      </div>
      <h3 className="mt-4 text-sm font-black text-slate-800 dark:text-slate-100">
        {hasFilters ? 'No PIRs match these filters' : 'No PIRs submitted for this period yet'}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
        {hasFilters
          ? 'Try clearing the school, program, or status filters to widen the cluster worklist.'
          : 'When schools submit PIRs, they will appear here for monitoring and remarks.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-dark-border dark:text-slate-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function PaginationControls({ currentPage, pageCount, totalCount, pageStart, pageEnd, onPageChange }) {
  if (totalCount <= PIR_PAGE_SIZE) return null;

  const pages = [];
  for (let page = 1; page <= pageCount; page += 1) {
    const visible =
      page === 1 ||
      page === pageCount ||
      Math.abs(page - currentPage) <= 1 ||
      (currentPage <= 3 && page <= 4) ||
      (currentPage >= pageCount - 2 && page >= pageCount - 3);
    if (visible) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap');
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        Showing {pageStart}-{pageEnd} of {pluralize(totalCount, 'record')}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-border dark:text-slate-300 dark:hover:bg-blue-950/30"
          aria-label="Previous page"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        {pages.map((page, index) => (
          page === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-xs font-black text-slate-300 dark:text-slate-600">...</span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-9 min-w-9 rounded-md border px-3 text-xs font-black transition-colors ${currentPage === page
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-blue-950/30'
                }`}
            >
              {page}
            </button>
          )
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-border dark:text-slate-300 dark:hover:bg-blue-950/30"
          aria-label="Next page"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function PirTable({
  pirs,
  totalCount,
  pageStart,
  pageEnd,
  currentPage,
  pageCount,
  hasFilters,
  onClearFilters,
  onPageChange,
}) {
  if (!pirs?.length) {
    return <EmptyWorklist hasFilters={hasFilters} onClearFilters={onClearFilters} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-dark-border">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">PIR Worklist</h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Showing {pageStart}-{pageEnd} of {pluralize(totalCount, 'record')} with current filters
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-dark-border">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400 dark:bg-dark-base/50">
            <tr>
              <th className="px-4 py-3 text-left">School</th>
              <th className="px-4 py-3 text-left">Program</th>
              <th className="px-4 py-3 text-left">Submitted</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {pirs.map((pir) => (
              <tr key={pir.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100">
                  <Link to={`/cluster-consultant/pirs/${pir.id}`} className="hover:text-blue-600 dark:hover:text-blue-300">
                    {pir.school}
                  </Link>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-400">{pir.quarter}</p>
                </td>
                <td className="max-w-[320px] px-4 py-3 text-slate-600 dark:text-slate-300">
                  <p className="truncate font-bold">{pir.program}</p>
                  {pir.submittedBy && <p className="truncate text-[11px] font-semibold text-slate-400">by {pir.submittedBy}</p>}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400">{formatDateTime(pir.submittedAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={pir.status} /></td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  <Link
                    to={`/cluster-consultant/pirs/${pir.id}`}
                    className={`inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-black transition-colors ${pir.commentCount
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300'
                        : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-dark-border dark:text-slate-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-300'
                      }`}
                  >
                    <ChatCircleText size={15} weight="duotone" />
                    {pir.commentCount ? pluralize(pir.commentCount, 'remark') : 'Add remark'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        pageCount={pageCount}
        totalCount={totalCount}
        pageStart={pageStart}
        pageEnd={pageEnd}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function ClusterDashboard() {
  const [overviewResult, setOverviewResult] = useState({ query: null, data: null });
  const [pirResult, setPirResult] = useState({ query: null, data: [] });
  const [filters, setFilters] = useState({ status: '', school: '', program: '' });
  const [pageState, setPageState] = useState({ query: '', page: 1 });
  const [error, setError] = useState('');
  const overviewQuery = usePeriodQuery();
  const listQuery = usePeriodQuery(filters);
  const overview = overviewResult.data;
  const pirs = pirResult.data;
  const overviewLoading = overviewResult.query !== overviewQuery;
  const listLoading = pirResult.query !== listQuery;
  const firstName = useMemo(() => {
    const user = getUser();
    return user?.first_name || user?.name?.split(' ')[0] || 'Consultant';
  }, []);
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/cluster-consultant/overview${overviewQuery}`)
      .then((overviewRes) => {
        if (cancelled) return;
        setError('');
        setOverviewResult({ query: overviewQuery, data: overviewRes.data });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.friendlyMessage ?? 'Failed to load cluster dashboard.');
          setOverviewResult((previous) => ({ ...previous, query: overviewQuery }));
        }
      });
    return () => { cancelled = true; };
  }, [overviewQuery]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/cluster-consultant/pirs${listQuery}`)
      .then((pirsRes) => {
        if (cancelled) return;
        setError('');
        setPirResult({ query: listQuery, data: pirsRes.data ?? [] });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.friendlyMessage ?? 'Failed to load PIR worklist.');
          setPirResult({ query: listQuery, data: [] });
        }
      });
    return () => { cancelled = true; };
  }, [listQuery]);

  const approvalRate = overview?.pirCount ? Math.round((overview.approvedCount / overview.pirCount) * 100) : 0;
  const needsAttention = overview?.needsRevisionCount ?? 0;
  const pendingReview = overview?.pendingReviewCount ?? 0;
  const hasFilters = Boolean(filters.status || filters.school.trim() || filters.program.trim());
  const setFiltersAndResetPage = (nextFilters) => {
    setPageState({ query: '', page: 1 });
    setFilters(nextFilters);
  };
  const clearFilters = () => setFiltersAndResetPage({ status: '', school: '', program: '' });
  const currentPage = pageState.query === listQuery ? pageState.page : 1;
  const totalPirs = pirs.length;
  const pageCount = Math.max(1, Math.ceil(totalPirs / PIR_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pageStartIndex = totalPirs ? (safePage - 1) * PIR_PAGE_SIZE : 0;
  const pageEndIndex = Math.min(pageStartIndex + PIR_PAGE_SIZE, totalPirs);
  const paginatedPirs = useMemo(() => pirs.slice(pageStartIndex, pageEndIndex), [pageEndIndex, pageStartIndex, pirs]);
  const changePage = (page) => {
    const nextPage = Math.max(1, Math.min(page, pageCount));
    setPageState({ query: listQuery, page: nextPage });
  };
  const schoolCompletion = useMemo(() => {
    return [...(overview?.schoolCompletion ?? [])].sort((left, right) => {
      if ((right.needsRevisionCount ?? 0) !== (left.needsRevisionCount ?? 0)) {
        return (right.needsRevisionCount ?? 0) - (left.needsRevisionCount ?? 0);
      }
      if ((right.pirCount ?? 0) !== (left.pirCount ?? 0)) return (right.pirCount ?? 0) - (left.pirCount ?? 0);
      return String(left.school).localeCompare(String(right.school));
    });
  }, [overview?.schoolCompletion]);
  const activeStatusFilters = [
    { label: 'All', value: '', count: overview?.pirCount ?? 0 },
    { label: 'Needs Revision', value: 'Needs Revision', count: overview?.needsRevisionCount ?? 0 },
    { label: 'For CES Review', value: 'For CES Review' },
    { label: 'Approved', value: 'Approved', count: overview?.approvedCount ?? 0 },
  ];
  const clusterTitle = (() => {
    const cluster = overview?.cluster;
    if (!cluster) return 'Cluster Dashboard';
    const base = `Cluster ${cluster.cluster_number}`;
    const name = String(cluster.name ?? '').trim();
    // Avoid "Cluster 1: Cluster 1" / "Cluster 11: 11" when the name just echoes the number.
    if (!name || name === base || name === String(cluster.cluster_number)) return base;
    return `${base}: ${name}`;
  })();

  return (
    <div className="space-y-5">
      {/* Greeting hero */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {greeting}, {firstName}
            </p>
            <h1 className="mt-1 truncate text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
              {clusterTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {needsAttention > 0
                ? `${pluralize(needsAttention, 'PIR')} need revision across your assigned schools.`
                : overview?.pirCount
                  ? 'No PIRs are awaiting revision right now.'
                  : 'Waiting for schools to submit PIRs for this reporting period.'}
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2 dark:bg-dark-base">
            <div className="rounded-md bg-white px-3 py-2 dark:bg-dark-surface">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approval</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-300">{approvalRate}%</p>
            </div>
            <div className="rounded-md bg-white px-3 py-2 dark:bg-dark-surface">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">In Review</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-300">{pendingReview}</p>
            </div>
            <div className="rounded-md bg-white px-3 py-2 dark:bg-dark-surface">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Schools</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{overview?.schoolCount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Cluster Overview</p>
        <div className="flex flex-wrap gap-2">
          {activeStatusFilters.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => setFiltersAndResetPage((prev) => ({ ...prev, status: option.value }))}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black transition-colors ${filters.status === option.value
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-dark-border dark:bg-dark-surface dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              {option.label}
              {option.count !== undefined && <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] dark:bg-dark-surface">{option.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Schools"
          value={overviewLoading ? '—' : overview?.schoolCount}
          hint="In your cluster"
          icon={<House size={20} weight="duotone" />}
        />
        <KpiCard
          label="PIRs Submitted"
          value={overviewLoading ? '—' : overview?.pirCount}
          hint="This reporting period"
          tone="blue"
          icon={<ClipboardText size={20} weight="duotone" />}
        />
        <KpiCard
          label="Needs Revision"
          value={overviewLoading ? '—' : overview?.needsRevisionCount}
          hint="Awaiting corrections"
          tone="amber"
          icon={<WarningCircle size={20} weight="duotone" />}
        />
        <KpiCard
          label="Approved"
          value={overviewLoading ? '—' : overview?.approvedCount}
          hint={`${approvalRate}% of submitted`}
          tone="green"
          icon={<CheckCircle size={20} weight="duotone" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={filters.school}
                  onChange={(e) => setFiltersAndResetPage((prev) => ({ ...prev, school: e.target.value }))}
                  placeholder="Filter by school"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
                />
              </label>
              <label className="relative flex-1">
                <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={filters.program}
                  onChange={(e) => setFiltersAndResetPage((prev) => ({ ...prev, program: e.target.value }))}
                  placeholder="Filter by program"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
                />
              </label>
              <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 dark:border-dark-border">
                <Funnel size={16} className="text-slate-400" />
                <select
                  value={filters.status}
                  onChange={(e) => setFiltersAndResetPage((prev) => ({ ...prev, status: e.target.value }))}
                  className="h-10 rounded-md border-none bg-transparent px-1 text-xs font-bold text-slate-600 outline-none dark:text-slate-200"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status || 'all'} value={status}>{status || 'All Statuses'}</option>
                  ))}
                </select>
              </div>
            </div>
            {hasFilters && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-dark-base">
                <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">Filters are narrowing the PIR worklist.</p>
                <button type="button" onClick={clearFilters} className="shrink-0 text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-300">
                  Clear all
                </button>
              </div>
            )}
          </div>
          {listLoading ? (
            <div className="h-52 rounded-lg bg-slate-100 dark:bg-dark-surface animate-pulse" />
          ) : (
            <PirTable
              pirs={paginatedPirs}
              totalCount={totalPirs}
              pageStart={totalPirs ? pageStartIndex + 1 : 0}
              pageEnd={pageEndIndex}
              currentPage={safePage}
              pageCount={pageCount}
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
              onPageChange={changePage}
            />
          )}
        </section>

        <aside className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">School Completion</h2>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sorted by attention needed</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-dark-base dark:text-slate-300">
                {overview?.schoolCount ?? 0}
              </span>
            </div>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
              {schoolCompletion.map((school) => {
                const rate = school.pirCount ? Math.round((school.approvedCount / school.pirCount) * 100) : 0;
                return (
                  <div key={school.schoolId} className="rounded-md border border-slate-100 p-3 dark:border-dark-border">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-black text-slate-700 dark:text-slate-200">{school.school}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(school.needsRevisionCount ? 'Needs Revision' : school.approvedCount ? 'Approved' : 'None')}`}>
                        {school.pirCount || 0}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-base">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{school.approvedCount} approved</span>
                      <span>{school.needsRevisionCount} needs revision</span>
                      <span>{rate}% rate</span>
                    </div>
                  </div>
                );
              })}
              {!schoolCompletion.length && (
                <p className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-400 dark:bg-dark-base">No schools are assigned to this cluster.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Recent Activity</h2>
            <div className="mt-3 space-y-2">
              {(overview?.recentPirs ?? []).slice(0, 5).map((pir) => (
                <Link
                  key={pir.id}
                  to={`/cluster-consultant/pirs/${pir.id}`}
                  className="block rounded-md border border-slate-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50 dark:border-dark-border dark:hover:bg-blue-950/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">{pir.school}</p>
                    <StatusBadge status={pir.status} />
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-400">{pir.program}</p>
                </Link>
              ))}
              {!(overview?.recentPirs ?? []).length && (
                <p className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-400 dark:bg-dark-base">No recent PIR activity for this period.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PirDetail() {
  const { id } = useParams();
  const [pir, setPir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    scope: 'overall',
    section_key: 'profile',
    category: 'suggested_change',
    body: '',
  });

  const loadPir = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    api.get(`/api/cluster-consultant/pirs/${id}`)
      .then((res) => setPir(res.data))
      .catch((err) => setError(err.friendlyMessage ?? 'Failed to load PIR.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadPir();
  }, [loadPir]);

  const submitComment = async (event) => {
    event.preventDefault();
    const body = form.body.trim();
    if (!body) {
      setError('Comment body is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/cluster-consultant/pirs/${id}/comments`, {
        ...form,
        body,
        section_key: form.scope === 'section' ? form.section_key : null,
      });
      setForm((prev) => ({ ...prev, body: '' }));
      loadPir(false);
    } catch (err) {
      setError(err.friendlyMessage ?? 'Failed to add comment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-80 rounded-lg bg-slate-100 dark:bg-dark-surface animate-pulse" />;
  if (!pir) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error || 'PIR not found.'}</div>;

  const comments = pir.comments ?? [];
  const canSubmitRemark = Boolean(form.body.trim()) && !saving;
  const remarkCharacters = form.body.length;

  return (
    <div className="space-y-5">
      <Link to="/cluster-consultant" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-blue-600 dark:text-slate-400">
        <ArrowLeft size={18} />
        Dashboard
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{pir.school}</h1>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{pir.program} · {pir.quarter}</p>
        </div>
        <StatusBadge status={pir.status} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Financials</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <InfoCell label="Division Budget" value={pir.budgetFromDivision} />
              <InfoCell label="CO / PSF" value={pir.budgetFromCoPSF} />
              <InfoCell label="Functional Division" value={pir.functionalDivision || '—'} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Activities</h2>
            <div className="mt-3 space-y-3">
              {(pir.activities ?? []).map((activity) => (
                <div key={activity.id} className="rounded-md border border-slate-100 p-3 dark:border-dark-border">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{activity.name || 'Untitled activity'}</p>
                  <div className="mt-2 grid gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                    <p>Actual: {activity.actualTasksConducted || '—'}</p>
                    <p>MOVs: {activity.movsExpectedOutputs || '—'}</p>
                    <p>Physical: {activity.physicalAccomplished ?? '—'} / {activity.physicalTarget ?? '—'}</p>
                    <p>Financial: {activity.financialAccomplished ?? '—'} / {activity.financialTarget ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Action Items</h2>
            <div className="mt-3 space-y-2">
              {(pir.actionItems ?? []).length ? pir.actionItems.map((item, index) => (
                <p key={index} className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-600 dark:bg-dark-base dark:text-slate-300">
                  {item.action ?? item.response_asds ?? item.response_sds ?? JSON.stringify(item)}
                </p>
              )) : <p className="text-sm font-bold text-slate-400">No action items recorded.</p>}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <form onSubmit={submitComment} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
                  <ChatCircleText size={18} weight="duotone" />
                  Add Remarks
                </h2>
                <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500">
                  {comments.length ? `${pluralize(comments.length, 'remark')} recorded` : 'No remarks yet'}
                </p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${categoryTone(form.category)}`}>
                {categoryLabel(form.category)}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {REMARK_CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, category: option.value }))}
                  className={`rounded-md border p-3 text-left transition-colors ${form.category === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-dark-border dark:text-slate-300 dark:hover:bg-white/5'
                    }`}
                >
                  <span className="block text-xs font-black">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] font-bold opacity-70">{option.helper}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-1 dark:bg-dark-base">
              {REMARK_SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, scope: option.value }))}
                  className={`rounded-md px-3 py-2 text-left transition-colors ${form.scope === option.value
                      ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-dark-surface'
                    }`}
                >
                  <span className="block text-xs font-black">{option.label}</span>
                  <span className="mt-0.5 block text-[10px] font-bold opacity-70">{option.helper}</span>
                </button>
              ))}
            </div>

            {form.scope === 'section' && (
              <label className="mt-3 block">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Section</span>
                <select
                  value={form.section_key}
                  onChange={(e) => setForm((prev) => ({ ...prev, section_key: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-blue-400 dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
                >
                  {SECTION_OPTIONS.map((section) => (
                    <option key={section.value} value={section.value}>{section.label}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="mt-3 block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Remark</span>
                <span className="text-[11px] font-bold text-slate-400">{remarkCharacters}/{REMARK_BODY_LIMIT}</span>
              </div>
              <textarea
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                maxLength={REMARK_BODY_LIMIT}
                rows={7}
                className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-blue-400 dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
                placeholder="Enter remark"
              />
            </label>

            <div className="mt-3 flex items-center gap-2">
              {form.body && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, body: '' }))}
                  className="h-10 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-dark-border dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={!canSubmitRemark}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              >
                <PaperPlaneTilt size={17} weight="bold" />
                {saving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Remarks History</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-dark-base dark:text-slate-300">
                {comments.length}
              </span>
            </div>
            <div className="mt-3 max-h-[420px] space-y-3 overflow-auto pr-1">
              {comments.length ? comments.map((comment) => (
                <div key={comment.id} className="rounded-md border border-slate-100 p-3 dark:border-dark-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${categoryTone(comment.category)}`}>
                      {categoryLabel(comment.category)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-dark-base dark:text-slate-300">
                      {comment.scope === 'section' ? sectionLabel(comment.sectionKey) : 'Overall'}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-200">{comment.body}</p>
                  <p className="mt-3 text-[11px] font-bold text-slate-400">{formatDateTime(comment.createdAt)}</p>
                </div>
              )) : (
                <div className="rounded-md border border-dashed border-slate-200 p-4 text-center dark:border-dark-border">
                  <ChatCircleText size={22} weight="duotone" className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-400">No remarks added yet.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-dark-base">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{value ?? '—'}</p>
    </div>
  );
}

export default function ClusterConsultantLayout() {
  const appLogo = useAppLogo();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getUser();
  const roleTheme = getRoleVisualTheme('Cluster Consultant');
  const clusterLabel = user?.cluster_number ? `Cluster ${user.cluster_number}` : 'Assigned Cluster';

  const handleLogout = async () => {
    try {
      await auth.logout({ clearDrafts: true });
    } catch {
      window.alert('This browser was cleared, but the server could not confirm logout.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const closeMobile = () => setMobileOpen(false);

  const navItems = [
    { to: '/cluster-consultant', label: 'Dashboard', icon: House, end: true },
  ];

  const initials = (user?.name || 'C')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const glassClasses = `bg-white/40 dark:bg-dark-base/40 backdrop-blur-2xl backdrop-saturate-[1.8] border-r ${roleTheme.header}`;
  const glassShadow = { boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(255,255,255,0.2)' };

  const sidebarContent = (
    <div className="flex flex-col h-full w-[240px]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <img src={appLogo} alt="AIP-PIR" className="h-8 w-auto shrink-0 drop-shadow-sm" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-[-0.01em]">AIP-PIR</span>
          <span className={`text-[11px] font-medium leading-tight tracking-wide truncate ${roleTheme.subtleText}`}>Cluster Consultant</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-5 scrollbar-thin scrollbar-thumb-white/30 dark:scrollbar-thumb-white/10">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.06em] px-3 mb-1.5">
            {clusterLabel}
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} Icon={item.icon} end={item.end} onNavigate={closeMobile} roleTheme={roleTheme} />
            ))}
          </div>
        </div>
      </nav>

      {/* Profile section */}
      <div className="px-2 py-3 mt-auto">
        <div className="mx-2 mb-3 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/[0.06] to-transparent" />

        <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/30 dark:bg-white/[0.03] border backdrop-blur-sm mb-1.5 ${roleTheme.border}`}>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleTheme.gradient} flex items-center justify-center shrink-0 shadow-md ${roleTheme.shadow} ring-2 ring-white/30 dark:ring-white/10`}>
            <span className="text-[11px] font-semibold text-white leading-none">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">{user?.name || 'Cluster Consultant'}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">{user?.email || clusterLabel}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/[0.08] rounded-xl transition-all duration-200 border border-transparent hover:border-red-200/40 dark:hover:border-red-500/10"
        >
          <SignOut size={17} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 dark:bg-none dark:bg-dark-base font-sans text-slate-900 dark:text-slate-100">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <Motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`fixed inset-y-0 left-0 z-50 ${glassClasses} shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] lg:hidden print:hidden`}
            style={glassShadow}
          >
            <button
              onClick={closeMobile}
              className="absolute top-4 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/40 dark:hover:bg-white/[0.08] transition-all border border-transparent hover:border-white/40 dark:hover:border-white/[0.06]"
            >
              <XCircle size={15} weight="bold" />
            </button>
            {sidebarContent}
          </Motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col ${glassClasses} h-screen sticky top-0 shrink-0 overflow-hidden w-[240px] print:hidden`}
        style={glassShadow}
      >
        <div className={`absolute top-0 left-0 right-0 h-0.5 pointer-events-none ${roleTheme.topAccent}`} />
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <header className={`sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md ${roleTheme.header}`}>
          <div className={`absolute inset-x-0 top-0 h-0.5 ${roleTheme.topAccent}`} />
          <button
            onClick={() => setMobileOpen(true)}
            className={`lg:hidden text-slate-500 dark:text-slate-400 ${roleTheme.hoverNav}`}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate flex-1">Cluster Consultant</h1>
          <ReportingPeriodPicker />
          <NotificationBell />
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-5">
          <Routes>
            <Route index element={<ClusterDashboard />} />
            <Route path="pirs/:id" element={<PirDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
