import { useRef, useState, useEffect } from 'react';
import { DownloadSimple, FileText, FunnelSimple, CaretDown } from '@phosphor-icons/react';
import { SearchableSelect } from '../../components/SearchableSelect.jsx';

const QUARTERS = [
  { value: 0, label: 'All' },
  { value: 1, label: 'Q1' },
  { value: 2, label: 'Q2' },
  { value: 3, label: 'Q3' },
  { value: 4, label: 'Q4' },
];

const GROUP_BY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'cluster', label: 'By Cluster' },
  { value: 'program', label: 'By Program' },
  { value: 'division', label: 'Division-Wide' },
];

const ALL_STATUSES = [
  'Approved',
  'Submitted',
  'For CES Review',
  'For Cluster Head Review',
  'For Admin Review',
  'Under Review',
  'Returned',
];

export function ConsolidationToolbar({
  quarter, setQuarter,
  groupBy, setGroupBy,
  clusterId, setClusterId,
  programId, setProgramId,
  statuses, setStatuses,
  clusters, programs,
  onGenerateDocument, onExport,
  hasData,
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleStatus = (s) => {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const clusterOptions = clusters.map((c) => ({
    value: c.id,
    label: c.name || `Cluster ${c.cluster_number}`,
  }));
  const programOptions = programs.map((p) => ({
    value: p.id,
    label: p.title,
  }));

  return (
    <div className="space-y-3">
      {/* Row 1: Quarter + GroupBy */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Quarter selector — mobile dropdown */}
        <div className="relative sm:hidden">
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            className="appearance-none rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-4 py-2 pr-8 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400"
          >
            {QUARTERS.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
          </select>
          <CaretDown size={12} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Quarter selector — desktop pill buttons */}
        <div className="hidden sm:flex items-center rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface overflow-hidden">
          {QUARTERS.map((q) => (
            <button
              key={q.value}
              onClick={() => setQuarter(q.value)}
              className={`px-4 py-2 text-xs font-bold transition-colors ${
                quarter === q.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* GroupBy selector — mobile dropdown */}
        <div className="relative sm:hidden">
          <select
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value);
              setClusterId('');
              setProgramId('');
            }}
            className="appearance-none rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-4 py-2 pr-8 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400"
          >
            {GROUP_BY_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <CaretDown size={12} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* GroupBy selector — desktop pill buttons */}
        <div className="hidden sm:flex items-center rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface overflow-hidden">
          {GROUP_BY_OPTIONS.map((g) => (
            <button
              key={g.value}
              onClick={() => {
                setGroupBy(g.value);
                setClusterId('');
                setProgramId('');
              }}
              className={`px-4 py-2 text-xs font-bold transition-colors ${
                groupBy === g.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {groupBy === 'cluster' && (
          <div className="w-52">
            <SearchableSelect
              options={clusterOptions}
              value={clusterId}
              onChange={setClusterId}
              placeholder="All Clusters"
              clearable
            />
          </div>
        )}

        {groupBy === 'program' && (
          <div className="w-52">
            <SearchableSelect
              options={programOptions}
              value={programId}
              onChange={setProgramId}
              placeholder="All Programs"
              clearable
            />
          </div>
        )}

        {/* Status multi-select */}
        <div ref={statusRef} className="relative">
          <button
            onClick={() => setStatusOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            <FunnelSimple size={14} />
            <span>Status ({statuses.size})</span>
            <CaretDown size={12} weight="bold" className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-56 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-xl overflow-hidden">
              {ALL_STATUSES.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={statuses.has(s)}
                    onChange={() => toggleStatus(s)}
                    className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  {s}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGenerateDocument}
          disabled={!hasData}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 transition-colors"
        >
          <FileText size={15} weight="bold" />
          Generate Consolidated Report
        </button>

        <button
          onClick={() => onExport('csv')}
          disabled={!hasData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors uppercase disabled:opacity-40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700"
        >
          <DownloadSimple size={14} /> CSV
        </button>
        <button
          onClick={() => onExport('xlsx')}
          disabled={!hasData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors uppercase disabled:opacity-40 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700"
        >
          <DownloadSimple size={14} /> XLSX
        </button>
      </div>
    </div>
  );
}
