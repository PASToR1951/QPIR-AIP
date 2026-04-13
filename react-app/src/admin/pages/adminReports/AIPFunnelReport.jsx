import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import api from '../../../lib/api.js';
import { ExportButtons, Spinner } from './shared.jsx';
import { STATUS_COLORS_FUNNEL } from './constants.js';

export function AIPFunnelReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/aip-funnel?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load AIP funnel data.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data?.data?.length) return <p className="text-center text-slate-400 py-16">No AIP data for FY {year}.</p>;

  const total = data.data.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <ExportButtons type="funnel" year={year} />
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data.data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
          <XAxis dataKey="status" tick={{ fontSize: 12, fontWeight: 700 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="AIPs" radius={[4, 4, 0, 0]}>
            {data.data.map((entry, i) => (
              <Cell key={i} fill={STATUS_COLORS_FUNNEL[entry.status] ?? '#6366f1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-border">
              {['Status', 'Count', '% of Total'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-black text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {data.data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-border/20">
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS_FUNNEL[row.status] ?? '#6366f1' }} />
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">{row.count}</td>
                <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">{((row.count / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
