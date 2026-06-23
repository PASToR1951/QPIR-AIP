import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChatCircleText,
  CheckCircle,
  ClipboardText,
  Funnel,
  House,
  MagnifyingGlass,
  SignOut,
  WarningCircle,
} from '@phosphor-icons/react';
import api from '../lib/api.js';
import { auth } from '../lib/auth.js';
import { NotificationBell } from '../components/ui/NotificationBell.jsx';
import { ReportingPeriodPicker } from '../components/ui/ReportingPeriodPicker.jsx';
import { useReportingPeriod } from '../context/ReportingPeriodContext.jsx';
import { StatusBadge } from '../admin/components/StatusBadge.jsx';

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

function KpiCard({ children, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-700 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
    blue: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200',
  };
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest opacity-70">{label}</p>
        {children}
      </div>
      <p className="mt-3 text-2xl font-black">{value ?? 0}</p>
    </div>
  );
}

function PirTable({ pirs }) {
  if (!pirs?.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-500">
        No PIRs match the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-dark-border">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400 dark:bg-dark-base/50">
            <tr>
              <th className="px-4 py-3 text-left">School</th>
              <th className="px-4 py-3 text-left">Program</th>
              <th className="px-4 py-3 text-left">Quarter</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {pirs.map((pir) => (
              <tr key={pir.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100">
                  <Link to={`/cluster-consultant/pirs/${pir.id}`} className="hover:text-blue-600">
                    {pir.school}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{pir.program}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{pir.quarter}</td>
                <td className="px-4 py-3"><StatusBadge status={pir.status} /></td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {pir.commentCount ? `${pir.commentCount} added` : 'None yet'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClusterDashboard() {
  const [overview, setOverview] = useState(null);
  const [pirs, setPirs] = useState([]);
  const [filters, setFilters] = useState({ status: '', school: '', program: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = usePeriodQuery(filters);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get(`/api/cluster-consultant/overview${query}`),
      api.get(`/api/cluster-consultant/pirs${query}`),
    ])
      .then(([overviewRes, pirsRes]) => {
        if (cancelled) return;
        setError('');
        setOverview(overviewRes.data);
        setPirs(pirsRes.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage ?? 'Failed to load cluster dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Assigned Cluster</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
            {overview?.cluster ? `Cluster ${overview.cluster.cluster_number}: ${overview.cluster.name}` : 'Cluster Dashboard'}
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-dark-border dark:bg-dark-surface">
          <Funnel size={17} className="text-slate-400" />
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-200"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status || 'all'} value={status}>{status || 'All Statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Schools" value={overview?.schoolCount}>
          <House size={20} weight="duotone" />
        </KpiCard>
        <KpiCard label="PIRs Submitted" value={overview?.pirCount} tone="blue">
          <ClipboardText size={20} weight="duotone" />
        </KpiCard>
        <KpiCard label="Needs Revision" value={overview?.needsRevisionCount} tone="amber">
          <WarningCircle size={20} weight="duotone" />
        </KpiCard>
        <KpiCard label="Approved" value={overview?.approvedCount} tone="green">
          <CheckCircle size={20} weight="duotone" />
        </KpiCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-dark-border dark:bg-dark-surface sm:flex-row">
            <label className="relative flex-1">
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.school}
                onChange={(e) => setFilters((prev) => ({ ...prev, school: e.target.value }))}
                placeholder="Filter by school"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
              />
            </label>
            <label className="relative flex-1">
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.program}
                onChange={(e) => setFilters((prev) => ({ ...prev, program: e.target.value }))}
                placeholder="Filter by program"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
              />
            </label>
          </div>
          {loading ? <div className="h-52 rounded-lg bg-slate-100 dark:bg-dark-surface animate-pulse" /> : <PirTable pirs={pirs} />}
        </section>

        <aside className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">School Completion</h2>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
              {(overview?.schoolCompletion ?? []).map((school) => (
                <div key={school.schoolId} className="rounded-md border border-slate-100 p-3 dark:border-dark-border">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-black text-slate-700 dark:text-slate-200">{school.school}</p>
                    <span className="text-xs font-black text-slate-400">{school.pirCount}</span>
                  </div>
                  <div className="mt-2 flex gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>{school.approvedCount} approved</span>
                    <span>{school.needsRevisionCount} needs revision</span>
                  </div>
                </div>
              ))}
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
    if (!form.body.trim()) {
      setError('Comment body is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/cluster-consultant/pirs/${id}/comments`, form);
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
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
              <ChatCircleText size={18} />
              Add Remarks
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ['suggested_change', 'Suggested Change'],
                ['mistake', 'Mistake'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, category: value }))}
                  className={`h-10 rounded-md border text-xs font-black ${form.category === value ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200' : 'border-slate-200 text-slate-500 dark:border-dark-border dark:text-slate-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ['overall', 'Overall'],
                ['section', 'Section'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, scope: value }))}
                  className={`h-10 rounded-md border text-xs font-black ${form.scope === value ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900' : 'border-slate-200 text-slate-500 dark:border-dark-border dark:text-slate-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.scope === 'section' && (
              <select
                value={form.section_key}
                onChange={(e) => setForm((prev) => ({ ...prev, section_key: e.target.value }))}
                className="mt-3 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
              >
                {SECTION_OPTIONS.map((section) => (
                  <option key={section.value} value={section.value}>{section.label}</option>
                ))}
              </select>
            )}
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              maxLength={5000}
              rows={7}
              className="mt-3 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-100"
              placeholder="Write remarks for the submitter"
            />
            <button
              disabled={saving}
              className="mt-3 h-10 w-full rounded-md bg-blue-600 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Submit Remarks'}
            </button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Your Comment History</h2>
            <div className="mt-3 space-y-3">
              {(pir.comments ?? []).length ? pir.comments.map((comment) => (
                <div key={comment.id} className="rounded-md border border-slate-100 p-3 dark:border-dark-border">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span>{comment.category?.replace('_', ' ')}</span>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{comment.body}</p>
                  <p className="mt-2 text-xs font-bold text-slate-400">{comment.scope === 'section' ? comment.sectionKey : 'overall'}</p>
                </div>
              )) : <p className="text-sm font-bold text-slate-400">No remarks added yet.</p>}
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
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = async () => {
    try {
      await auth.logout({ clearDrafts: true });
    } catch {
      window.alert('This browser was cleared, but the server could not confirm logout.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-dark-base dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/90">
        <div className="h-0.5 w-full bg-blue-600" />
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-5">
          <Link to="/cluster-consultant" className="flex min-w-0 items-center gap-2">
            <ClipboardText size={24} weight="duotone" className="text-blue-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">Cluster Consultant</p>
              <p className="hidden truncate text-[10px] font-black uppercase tracking-widest text-slate-400 sm:block">
                {user?.cluster_number ? `Cluster ${user.cluster_number}` : 'Assigned Cluster'}
              </p>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ReportingPeriodPicker />
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="flex h-9 items-center gap-2 rounded-lg px-2 text-xs font-black text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 sm:px-3"
            >
              <SignOut size={17} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5">
        <Routes>
          <Route index element={<ClusterDashboard />} />
          <Route path="pirs/:id" element={<PirDetail />} />
        </Routes>
      </main>
    </div>
  );
}
