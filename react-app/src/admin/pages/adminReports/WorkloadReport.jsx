import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../../lib/api.js';
import { Spinner } from './shared.jsx';

export function WorkloadReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/workload?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load workload report.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data?.length) return <p className="text-center text-slate-400 py-16">No Division Personnel found.</p>;

  const chartData = data.map(p => ({ name: (p.name ?? p.email).split(' ')[0], programs: p.programCount, aips: p.aipCount, pirs: p.pirCount }));

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="programs" name="Programs" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          <Bar dataKey="aips" name="AIPs" fill="#E94560" radius={[0, 4, 4, 0]} />
          <Bar dataKey="pirs" name="PIRs" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
