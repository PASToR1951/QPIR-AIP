import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, MagnifyingGlass, Table } from '@phosphor-icons/react';
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

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [aipRes, pirRes] = await Promise.all([
        api.get('/api/admin/focal/aips'),
        api.get('/api/admin/focal/pirs'),
      ]);
      setAips(aipRes.data ?? []);
      setPirs(pirRes.data ?? []);
    } catch {
      setAips([]);
      setPirs([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          Recommendation Queue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          School submissions assigned to your focal programs.
        </p>
      </div>

      <div data-tour="division-focal-filters" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setKind(tab.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-colors ${kind === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-dark-surface dark:text-slate-400 dark:hover:bg-dark-border'}`}
            >
              {tab.label}
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${kind === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 dark:bg-dark-border'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search program or school..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-300 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 dark:focus:ring-blue-700"
          />
        </div>
      </div>

      <div data-tour="division-focal-queue" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">No documents pending your recommendation.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
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
                      <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300">
                        Review
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
