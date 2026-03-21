import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { DownloadSimple } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TABS = [
  { key: 'compliance', label: 'AIP Compliance' },
  { key: 'quarterly', label: 'PIR Quarterly' },
  { key: 'budget', label: 'Budget' },
  { key: 'workload', label: 'Personnel Workload' },
];

async function downloadReport(type, format, year) {
  const url = `${API}/api/admin/reports/${type}/export?format=${format}&year=${year}`;
  const blob = await fetch(url, { headers: authHeaders() }).then(r => r.blob());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${type}-report-${year}.${format}`;
  a.click();
}

function ExportButtons({ type, year }) {
  const formats = type === 'workload' ? ['csv'] : ['csv', 'pdf'];
  return (
    <div className="flex items-center gap-2">
      {formats.map(fmt => (
        <button key={fmt} onClick={() => downloadReport(type, fmt, year)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl hover:bg-slate-50 dark:hover:bg-dark-border transition-colors uppercase">
          <DownloadSimple size={13} /> {fmt}
        </button>
      ))}
    </div>
  );
}

// ─── Compliance Tab ──────────────────────────────────────────────────────────
function ComplianceReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/compliance?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (!data) return null;

  const STATUS_COLORS = { submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', missing: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400', na: 'bg-slate-100 text-slate-400 dark:bg-dark-border dark:text-slate-600' };
  const STATUS_SYMBOLS = { submitted: '✓', missing: '✗', na: '—' };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-dark-surface">
            <th className="px-3 py-2 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap sticky left-0 bg-slate-50 dark:bg-dark-surface">School</th>
            {data.programs.map(p => (
              <th key={p} className="px-3 py-2 text-center font-black text-slate-500 dark:text-slate-400 max-w-[100px] truncate" title={p}>{p.slice(0, 14)}{p.length > 14 ? '…' : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
          {data.matrix.map(row => (
            <tr key={row.schoolId} className="hover:bg-slate-50 dark:hover:bg-dark-border/20">
              <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky left-0 bg-white dark:bg-dark-surface">{row.school}</td>
              {data.programs.map(p => {
                const status = row[p] ?? 'na';
                return (
                  <td key={p} className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black ${STATUS_COLORS[status]}`}>
                      {STATUS_SYMBOLS[status]}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Quarterly Tab ───────────────────────────────────────────────────────────
function QuarterlyReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/quarterly?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
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

// ─── Budget Tab ──────────────────────────────────────────────────────────────
function BudgetReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/budget?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
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

// ─── Workload Tab ────────────────────────────────────────────────────────────
function WorkloadReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/workload`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
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

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
    </div>
  );
}

export default function AdminReports() {
  const [tab, setTab] = useState('compliance');
  const [year, setYear] = useState(new Date().getFullYear());
  const YEARS = [year - 1, year, year + 1];

  return (
    <AdminLayout title="Reports" breadcrumbs={[{ label: 'Reports' }]}>
      <div className="space-y-4">

        {/* Tab Bar + Year + Export */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-dark-border pb-0">
          <div className="flex items-center gap-0.5">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-bold transition-colors relative ${tab === t.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {t.label}
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 pb-1">
            <div className="flex items-center gap-1">
              {YEARS.map(y => (
                <button key={y} onClick={() => setYear(y)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${y === year ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>
                  {y}
                </button>
              ))}
            </div>
            <ExportButtons type={tab} year={year} />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
          {tab === 'compliance' && <ComplianceReport year={year} />}
          {tab === 'quarterly' && <QuarterlyReport year={year} />}
          {tab === 'budget' && <BudgetReport year={year} />}
          {tab === 'workload' && <WorkloadReport />}
        </div>

        {/* Export Center */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-4">Quick Export</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'AIP Compliance', type: 'compliance', formats: ['csv', 'pdf'] },
              { label: 'PIR Quarterly', type: 'quarterly', formats: ['csv', 'pdf'] },
              { label: 'Budget Summary', type: 'budget', formats: ['csv', 'pdf'] },
              { label: 'Personnel Workload', type: 'workload', formats: ['csv'] },
            ].map(item => (
              <div key={item.type} className="border border-slate-200 dark:border-dark-border rounded-xl p-3 space-y-2">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  {item.formats.map(fmt => (
                    <button key={fmt} onClick={() => downloadReport(item.type, fmt, year)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-border hover:bg-slate-200 dark:hover:bg-dark-border/80 rounded-lg transition-colors uppercase">
                      <DownloadSimple size={11} /> {fmt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
