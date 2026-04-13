import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../../lib/api.js';
import { Spinner } from './shared.jsx';

export function QuarterlyReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/quarterly?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load quarterly report.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data.summary} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
        <XAxis dataKey="quarter" tick={{ fontSize: 12, fontWeight: 700 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="returned" name="Returned" fill="#E94560" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
