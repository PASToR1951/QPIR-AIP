import { useEffect, useState } from 'react';
import api from '../../../lib/api.js';
import { SearchableSelect } from '../../components/SearchableSelect.jsx';
import { Spinner } from './shared.jsx';

const CY_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function ClusterPIRSummary({ year }) {
  const [clusters, setClusters] = useState([]);
  const [clusterId, setClusterId] = useState('');
  const [quarter, setQuarter] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/admin/clusters')
      .then((response) => setClusters(response.data))
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    if (!clusterId) {
      setData(null);
      return;
    }

    setLoading(true);
    api.get(`/api/admin/reports/cluster-pir-summary?year=${year}&quarter=${quarter}&cluster=${clusterId}`)
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error(error);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [year, quarter, clusterId]);

  const togglePresented = async (pirId, schoolId, programId) => {
    if (!pirId) return;
    const key = `${schoolId}_${programId}`;

    setData((previousData) => {
      const cell = previousData.matrix[key];
      const presented = !cell.presented;
      return {
        ...previousData,
        matrix: {
          ...previousData.matrix,
          [key]: { ...cell, presented },
        },
        totals: {
          ...previousData.totals,
          [schoolId]: {
            ...previousData.totals[schoolId],
            presented: previousData.totals[schoolId].presented + (presented ? 1 : -1),
          },
        },
      };
    });

    try {
      await api.patch(`/api/admin/pirs/${pirId}/presented`, {});
    } catch {
      setData((previousData) => {
        const cell = previousData.matrix[key];
        const presented = !cell.presented;
        return {
          ...previousData,
          matrix: {
            ...previousData.matrix,
            [key]: { ...cell, presented },
          },
          totals: {
            ...previousData.totals,
            [schoolId]: {
              ...previousData.totals[schoolId],
              presented: previousData.totals[schoolId].presented + (presented ? 1 : -1),
            },
          },
        };
      });
    }
  };

  const clusterOptions = clusters.map((cluster) => ({
    value: String(cluster.id),
    label: `Cluster ${cluster.cluster_number}`,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchableSelect
            options={clusterOptions}
            value={clusterId ? String(clusterId) : ''}
            onChange={(value) => setClusterId(value ? parseInt(value, 10) : '')}
            placeholder="Select Cluster…"
          />
        </div>
        <div className="flex items-center gap-1">
          {CY_QUARTERS.map((label, index) => (
            <button
              key={label}
              onClick={() => setQuarter(index + 1)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${index + 1 === quarter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-dark-border dark:text-slate-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!clusterId && (
        <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">Select a cluster to view the PIR summary matrix.</p>
      )}

      {loading && <Spinner />}

      {data && !loading && (
        <>
          <h2 className="text-center text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">
            Cluster Program Implementation Review (PIR) Summary of Submission
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-dark-border">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-surface">
                  <th rowSpan={2} className="sticky left-0 z-10 min-w-[220px] whitespace-nowrap border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-black uppercase tracking-wide text-slate-500 dark:border-dark-border dark:bg-dark-surface dark:text-slate-400">
                    Program
                  </th>
                  {data.schools.map((school) => (
                    <th key={school.id} colSpan={2} className="whitespace-nowrap border-l border-slate-200 px-2 py-2 text-center font-black text-slate-700 dark:border-dark-border dark:text-slate-200">
                      {school.abbreviation || school.name}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-50 dark:bg-dark-surface">
                  {data.schools.map((school) => (
                    <th key={school.id} className="border-l border-slate-200 px-1.5 py-1 text-center text-[10px] font-bold uppercase text-slate-400 dark:border-dark-border dark:text-slate-500">
                      <span>Tool</span>
                      <span className="sr-only"> for {school.name}</span>
                    </th>
                  )).flatMap((toolHeader, index) => ([
                    toolHeader,
                    <th key={`${data.schools[index].id}-presented`} className="px-1.5 py-1 text-center text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Pres.</th>,
                  ]))}
                </tr>
              </thead>
              <tbody>
                {data.programs.map((program) => (
                  <tr key={program.id} className="border-t border-slate-100 hover:bg-slate-50/50 dark:border-dark-border/50 dark:hover:bg-dark-border/20">
                    <td className="sticky left-0 z-10 whitespace-nowrap border-r border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-800 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200">
                      {program.title}
                    </td>
                    {data.schools.flatMap((school) => {
                      const cell = data.matrix[`${school.id}_${program.id}`];

                      if (!cell?.eligible) {
                        return [
                          <td key={`${school.id}-${program.id}-tool`} className="border-l border-slate-100 px-1.5 py-1.5 text-center dark:border-dark-border/50">
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          </td>,
                          <td key={`${school.id}-${program.id}-presented`} className="px-1.5 py-1.5 text-center">
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          </td>,
                        ];
                      }

                      const toolTone = cell.pirExists
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';

                      return [
                        <td key={`${school.id}-${program.id}-tool`} className="border-l border-slate-100 px-1.5 py-1.5 text-center dark:border-dark-border/50">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black ${toolTone}`}>
                            {cell.pirExists ? '✓' : '✗'}
                          </span>
                        </td>,
                        <td key={`${school.id}-${program.id}-presented`} className="px-1.5 py-1.5 text-center">
                          {cell.pirExists ? (
                            <button
                              onClick={() => togglePresented(cell.pirId, school.id, program.id)}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black transition-colors hover:ring-2 hover:ring-offset-1 ${cell.presented ? 'bg-emerald-100 text-emerald-700 hover:ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 hover:ring-rose-300 dark:bg-rose-950/40 dark:text-rose-400'}`}
                              title={cell.presented ? 'Presented — click to unmark' : 'Not presented — click to mark'}
                            >
                              {cell.presented ? '✓' : '✗'}
                            </button>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-[11px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">✗</span>
                          )}
                        </td>,
                      ];
                    })}
                  </tr>
                ))}

                <tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-dark-border dark:bg-dark-surface">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-700 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200">
                    Totals
                  </td>
                  {data.schools.flatMap((school) => {
                    const totals = data.totals[school.id] || { pirTool: 0, presented: 0 };
                    return [
                      <td key={`${school.id}-total-tool`} className="border-l border-slate-200 px-1.5 py-2 text-center font-black text-slate-700 dark:border-dark-border dark:text-slate-200">{totals.pirTool}</td>,
                      <td key={`${school.id}-total-presented`} className="px-1.5 py-2 text-center font-black text-slate-700 dark:text-slate-200">{totals.presented}</td>,
                    ];
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
