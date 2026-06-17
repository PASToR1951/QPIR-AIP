import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, MagnifyingGlass, Table, XCircle } from '@phosphor-icons/react';
import { useReportingPeriod } from '../context/ReportingPeriodContext.jsx';
import api from '../lib/api.js';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function FocalPersonQueue() {
  const navigate = useNavigate();
  const [aips, setAips] = useState([]);
  const [pirs, setPirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const { selectedYear, selectedQuarter } = useReportingPeriod();

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedYear) params.set('year', selectedYear);
    if (selectedQuarter) params.set('quarter', selectedQuarter);
    const suffix = params.toString() ? `?${params.toString()}` : '';

    try {
      const [aipRes, pirRes] = await Promise.all([
        api.get(`/api/admin/focal/aips${suffix}`),
        api.get(`/api/admin/focal/pirs${suffix}`),
      ]);
      setAips(aipRes.data ?? []);
      setPirs(pirRes.data ?? []);
    } catch {
      setAips([]);
      setPirs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedQuarter]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const rows = useMemo(() => {
    const combined = [
      ...aips.map(item => ({ ...item, type: 'AIP' })),
      ...pirs.map(item => ({ ...item, type: 'PIR' })),
    ];
    const q = search.toLowerCase();
    return combined
      .filter(item => kind === 'all' || item.type.toLowerCase() === kind)
      .filter(item => !q || [item.program, item.school, item.quarter, String(item.year ?? '')].some(value => String(value ?? '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0));
  }, [aips, pirs, kind, search]);

  const tabs = [
    { key: 'all', label: 'All', count: aips.length + pirs.length },
    { key: 'aip', label: 'AIPs', count: aips.length },
    { key: 'pir', label: 'PIRs', count: pirs.length },
  ];
  const hasActiveFilters = kind !== 'all' || search.trim().length > 0;
  const clearFilters = () => {
    setKind('all');
    setSearch('');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Focal review
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Recommendation Queue
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              School submissions assigned to your focal programs.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 dark:border-dark-border/60 lg:w-[360px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {tabs.map(tab => (
              <div key={tab.key}>
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{tab.label}</dt>
                <dd className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-slate-100">{tab.count}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div data-tour="division-focal-filters" className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-surface sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 dark:bg-dark-base sm:w-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setKind(tab.key)}
              aria-pressed={kind === tab.key}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black transition-colors sm:flex-none ${kind === tab.key ? 'bg-white text-blue-700 shadow-sm dark:bg-dark-surface dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${kind === tab.key ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-white text-slate-400 dark:bg-dark-surface dark:text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search program or school..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:border-dark-border dark:bg-dark-base dark:text-slate-200 dark:focus:border-blue-700 dark:focus:ring-blue-950"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-dark-border dark:hover:text-slate-200"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      </div>

      <div data-tour="division-focal-queue" className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle size={26} weight="bold" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              {hasActiveFilters ? 'No matching documents' : 'Queue clear'}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {hasActiveFilters ? 'No assigned submissions match the current filters.' : 'No documents are pending your recommendation.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-dark-border dark:bg-dark-base dark:text-slate-300 dark:hover:bg-dark-border/40"
              >
                <XCircle size={14} />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:border-dark-border dark:text-slate-500">
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Program</th>
                  <th className="hidden px-5 py-3 text-left md:table-cell">School</th>
                  <th className="px-5 py-3 text-left">Period</th>
                  <th className="hidden px-5 py-3 text-left sm:table-cell">Submitted</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-dark-border/40">
                {rows.map(item => {
                  const path = item.type === 'AIP'
                    ? `/division/aips/${item.id}/review`
                    : `/division/pirs/${item.id}/review`;
                  return (
                    <tr
                      key={`${item.type}-${item.id}`}
                      onClick={() => navigate(path)}
                      className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/20"
                    >
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black ${item.type === 'AIP' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'}`}>
                          {item.type === 'AIP' ? <FileText size={13} /> : <Table size={13} />}
                          {item.type}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-200">{item.program}</td>
                      <td className="hidden px-5 py-3.5 text-slate-500 dark:text-slate-400 md:table-cell">{item.school}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{item.type === 'AIP' ? `FY ${item.year}` : item.quarter}</td>
                      <td className="hidden px-5 py-3.5 text-xs text-slate-400 dark:text-slate-500 sm:table-cell">{formatDate(item.submittedAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300">
                          Review
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
