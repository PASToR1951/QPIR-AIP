import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Funnel, MagnifyingGlass } from '@phosphor-icons/react';
import api from '../lib/api.js';
import { StatusBadge } from '../admin/components/StatusBadge.jsx';
import { useReportingPeriod } from '../context/ReportingPeriodContext.jsx';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'aip', label: 'AIPs' },
  { value: 'pir', label: 'PIRs' },
];

export default function ProgramDocuments() {
  const { selectedYear, selectedQuarter } = useReportingPeriod();
  const [programs, setPrograms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({ type: 'all', program_id: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedYear) params.set('year', selectedYear);
    if (selectedQuarter && filters.type !== 'aip') params.set('quarter', selectedQuarter);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString() ? `?${params}` : '';
  }, [filters, selectedQuarter, selectedYear]);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/program-owner/programs')
      .then((res) => {
        if (!cancelled) setPrograms(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setPrograms([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/program-owner/documents${query}`)
      .then((res) => {
        if (!cancelled) setDocuments(res.data?.documents ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage ?? 'Failed to load program documents.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Program Owner</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">Program Documents</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-dark-border dark:bg-dark-surface">
          <Funnel size={17} className="text-slate-400" />
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-200"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filters.program_id}
            onChange={(e) => setFilters((prev) => ({ ...prev, program_id: e.target.value }))}
            className="h-9 max-w-56 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-200"
          >
            <option value="">All Programs</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>{program.title}</option>
            ))}
          </select>
          <label className="relative">
            <MagnifyingGlass size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              placeholder="Status"
              className="h-9 w-36 rounded-md border border-slate-200 bg-white pl-8 pr-2 text-xs font-bold text-slate-600 outline-none dark:border-dark-border dark:bg-dark-base dark:text-slate-200"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
        {loading ? (
          <div className="h-56 animate-pulse bg-slate-100 dark:bg-dark-base" />
        ) : documents.length === 0 ? (
          <div className="p-10 text-center text-sm font-bold text-slate-400 dark:text-slate-500">
            No documents found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-dark-border">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400 dark:bg-dark-base/50">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">School</th>
                  <th className="px-4 py-3 text-left">Program</th>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {documents.map((doc) => (
                  <tr key={`${doc.type}-${doc.id}`} className="hover:bg-slate-50/80 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300">
                        <FileText size={14} />
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100">{doc.school}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <Link
                        to={doc.type === 'PIR' ? `/division/pirs/${doc.id}/review` : `/division/aips/${doc.id}/review`}
                        className="hover:text-blue-600"
                      >
                        {doc.program}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{doc.type === 'PIR' ? doc.quarter : `FY ${doc.year}`}</td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
