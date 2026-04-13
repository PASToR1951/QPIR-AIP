import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../../lib/api.js';
import { Spinner } from './shared.jsx';

export function BudgetReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/budget?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load budget report.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data?.data?.length) return <p className="text-center text-slate-400 py-16">No budget data for FY {year}.</p>;

  const chartData = data.data.slice(0, 10).map(d => ({ name: d.program.slice(0, 16), total: d.total }));

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
          <Tooltip formatter={v => `₱${Number(v).toLocaleString()}`} />
          <Bar dataKey="total" name="Budget" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-border">
              {['Program', 'Total Budget', 'Activities'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-black text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {data.data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-border/20">
                <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{row.program}</td>
                <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">₱{Number(row.total).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.activityCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
