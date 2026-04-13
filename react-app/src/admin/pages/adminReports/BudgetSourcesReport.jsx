import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '../../../lib/api.js';
import { ExportButtons, Spinner } from './shared.jsx';
import { SOURCE_PALETTE } from './constants.js';

export function BudgetSourcesReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/budget?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load budget sources data.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data?.data?.length) return <p className="text-center text-slate-400 py-16">No budget data for FY {year}.</p>;

  const sourceMap = {};
  for (const prog of data.data) {
    for (const [src, amt] of Object.entries(prog.sources ?? {})) {
      const key = src.trim() || 'Unspecified';
      sourceMap[key] = (sourceMap[key] ?? 0) + amt;
    }
  }
  const sourceKeys = Object.keys(sourceMap);
  const pieData = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const stackedData = data.data.map(prog => {
    const row = { name: prog.program.slice(0, 18) };
    for (const key of sourceKeys) row[key] = prog.sources?.[key.trim()] ?? 0;
    return row;
  });

  return (
    <div className="space-y-8">
      <ExportButtons type="sources" year={year} />
      <div>
        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Total Budget by Funding Source</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
              label={({ name, percent }) => percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : null}>
              {pieData.map((_, i) => <Cell key={i} fill={SOURCE_PALETTE[i % SOURCE_PALETTE.length]} />)}
            </Pie>
            <Tooltip formatter={v => `₱${Number(v).toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {sourceKeys.length > 1 && (
        <div>
          <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Budget Sources per Program</p>
          <ResponsiveContainer width="100%" height={Math.max(280, stackedData.length * 40)}>
            <BarChart data={stackedData} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `₱${Number(v).toLocaleString()}`} />
              <Legend />
              {sourceKeys.map((key, i) => (
                <Bar key={key} dataKey={key} name={key} stackId="a" fill={SOURCE_PALETTE[i % SOURCE_PALETTE.length]}
                  radius={i === sourceKeys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
