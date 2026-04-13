import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../../lib/api.js';
import { ExportButtons, Spinner } from './shared.jsx';

export function AccomplishmentReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/accomplishment?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load accomplishment report.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data?.data?.length) return <p className="text-center text-slate-400 py-16">No accomplishment data for FY {year}.</p>;

  const sorted = [...data.data].sort((a, b) => b.physicalRate - a.physicalRate).slice(0, 20);
  const rateColor = v => v >= 75 ? 'text-emerald-600 dark:text-emerald-400' : v >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="space-y-6">
      <ExportButtons type="accomplishment" year={year} />
      <ResponsiveContainer width="100%" height={Math.max(320, sorted.length * 42)}>
        <BarChart data={sorted} layout="vertical" barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="school" width={140} tick={{ fontSize: 10 }} />
          <Tooltip formatter={v => `${v}%`} />
          <Legend />
          <Bar dataKey="physicalRate" name="Physical Rate" fill="#6366f1" radius={[0, 4, 4, 0]} />
          <Bar dataKey="financialRate" name="Financial Rate" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-border">
              {['School', 'Cluster', 'Physical Rate', 'Financial Rate'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-black text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {data.data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-border/20">
                <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{row.school}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.cluster}</td>
                <td className="px-4 py-2.5"><span className={`font-mono font-bold ${rateColor(row.physicalRate)}`}>{row.physicalRate}%</span></td>
                <td className="px-4 py-2.5"><span className={`font-mono font-bold ${rateColor(row.financialRate)}`}>{row.financialRate}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
