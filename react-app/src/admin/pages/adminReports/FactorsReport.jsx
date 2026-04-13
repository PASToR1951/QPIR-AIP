import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../../lib/api.js';
import { ExportButtons, Spinner } from './shared.jsx';

export function FactorsReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/factors?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load factors report.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data?.data) return null;
  const hasData = data.data.some(d => d.facilitating + d.hindering > 0);
  if (!hasData) return <p className="text-center text-slate-400 py-16">No factor data for FY {year}.</p>;

  return (
    <div className="space-y-6">
      <ExportButtons type="factors" year={year} />
      <ResponsiveContainer width="100%" height={Math.max(280, data.data.length * 50)}>
        <BarChart data={data.data} layout="vertical" barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="type" width={140} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="facilitating" name="Facilitating" stackId="a" fill="#10b981" />
          <Bar dataKey="hindering" name="Hindering" stackId="a" fill="#E94560" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-border">
              {['Factor Type', 'Facilitating', 'Hindering', 'Total'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-black text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {data.data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-border/20">
                <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{row.type}</td>
                <td className="px-4 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.facilitating}</td>
                <td className="px-4 py-2.5 font-mono font-bold text-rose-600 dark:text-rose-400">{row.hindering}</td>
                <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">{row.facilitating + row.hindering}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
