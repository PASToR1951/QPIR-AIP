import { useEffect, useState, useCallback } from 'react';
import api from '../../../lib/api.js';
import { ConsolidationToolbar } from './ConsolidationToolbar.jsx';
import { ConsolidationKpiCards } from './ConsolidationKpiCards.jsx';
import { ConsolidationGroupTable } from './ConsolidationGroupTable.jsx';
import { ConsolidationFactors } from './ConsolidationFactors.jsx';
import { ConsolidatedPIRDocument } from './ConsolidatedPIRDocument.jsx';
import { Spinner } from './shared.jsx';

const API_URL = import.meta.env.VITE_API_URL;

export function ConsolidationReport({ year }) {
  const [quarter, setQuarter] = useState(1);
  const [groupBy, setGroupBy] = useState('cluster');
  const [clusterId, setClusterId] = useState('');
  const [programId, setProgramId] = useState('');
  const [statuses, setStatuses] = useState(new Set(['Approved']));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDocument, setShowDocument] = useState(false);

  const [clusters, setClusters] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/clusters'),
      api.get('/api/admin/programs'),
    ]).then(([c, p]) => {
      setClusters(c.data);
      setPrograms(p.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (statuses.size === 0) { setData(null); return; }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      year: String(year),
      quarter: String(quarter),
      groupBy,
      statuses: Array.from(statuses).join(','),
    });
    if (groupBy === 'cluster' && clusterId) params.set('cluster', String(clusterId));
    if (groupBy === 'program' && programId) params.set('program', String(programId));

    api.get(`/api/admin/reports/consolidation?${params}`)
      .then((r) => setData(r.data))
      .catch((e) => {
        console.error(e);
        setError('Failed to load consolidation data.');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [year, quarter, groupBy, clusterId, programId, statuses]);

  const handleExport = useCallback(async (format) => {
    const params = new URLSearchParams({
      year: String(year),
      quarter: String(quarter),
      groupBy,
      statuses: Array.from(statuses).join(','),
      format,
    });
    if (groupBy === 'cluster' && clusterId) params.set('cluster', String(clusterId));
    if (groupBy === 'program' && programId) params.set('program', String(programId));

    const url = `${API_URL}/api/admin/reports/consolidation/export?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `consolidation-Q${quarter}-${year}.${format}`;

    try {
      const response = await fetch(url, { credentials: 'include' });
      const blob = await response.blob();
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error('Export failed:', e);
    }
  }, [year, quarter, groupBy, clusterId, programId, statuses]);

  return (
    <div className="space-y-5">
      <ConsolidationToolbar
        quarter={quarter}
        setQuarter={setQuarter}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        clusterId={clusterId}
        setClusterId={setClusterId}
        programId={programId}
        setProgramId={setProgramId}
        statuses={statuses}
        setStatuses={setStatuses}
        clusters={clusters}
        programs={programs}
        onGenerateDocument={() => setShowDocument(true)}
        onExport={handleExport}
        hasData={!!data && data.kpis?.totalPIRs > 0}
      />

      {loading && <Spinner />}
      {error && <p className="text-center text-red-500 font-bold py-8">{error}</p>}

      {!loading && data && data.kpis?.totalPIRs > 0 && (
        <>
          <ConsolidationKpiCards kpis={data.kpis} />
          <ConsolidationGroupTable groups={data.groups} groupBy={groupBy} />
          <ConsolidationFactors factors={data.factors} />

          {data.actionItems?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Action Items</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-dark-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-surface text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="px-3 py-2.5">Action</th>
                      <th className="px-3 py-2.5">Response (ASDS)</th>
                      <th className="px-3 py-2.5">Response (SDS)</th>
                      <th className="px-3 py-2.5">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {data.actionItems.map((ai, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{ai.action}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ai.responseAsds || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ai.responseSds || '—'}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">{ai.sourceLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && data && data.kpis?.totalPIRs === 0 && (
        <p className="text-center text-slate-400 dark:text-slate-500 py-12 text-sm font-medium">
          No PIRs match the selected filters.
        </p>
      )}

      {showDocument && data && (
        <ConsolidatedPIRDocument
          data={data}
          year={year}
          quarter={quarter}
          groupBy={groupBy}
          onClose={() => setShowDocument(false)}
        />
      )}
    </div>
  );
}
