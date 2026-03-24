import React, { useEffect, useState } from 'react';
import { useTermConfig } from '../../context/TermConfigContext.jsx';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import { DownloadSimple } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TABS = [
  { key: 'compliance', label: 'AIP Compliance' },
  { key: 'quarterly', label: 'PIR Quarterly' },
  { key: 'budget', label: 'Budget' },
  { key: 'workload', label: 'Personnel Workload' },
  { key: 'accomplishment', label: 'Accomplishment Rates' },
  { key: 'factors', label: 'Factors Analysis' },
  { key: 'sources', label: 'Budget Sources' },
  { key: 'funnel', label: 'AIP Status Funnel' },
  { key: 'cluster-pir', label: 'Cluster Summary' },
];

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

const SOURCE_PALETTE = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#E94560', '#8b5cf6', '#06b6d4'];
const STATUS_COLORS_FUNNEL = { Draft: '#94a3b8', Submitted: '#3b82f6', Pending: '#f59e0b', Verified: '#06b6d4', 'Under Review': '#8b5cf6', Approved: '#10b981', Returned: '#E94560' };

async function downloadReport(type, format, year) {
  if (format === 'pdf') {
    const el = document.getElementById('report-content');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const pageH = 210;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    if (imgH <= pageH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    } else {
      let position = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, -position, imgW, imgH);
        remaining -= pageH;
        position += pageH;
        if (remaining > 0) pdf.addPage();
      }
    }
    pdf.save(`${type}-report-${year}.pdf`);
    return;
  }
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
          <DownloadSimple size={15} /> {fmt}
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
function WorkloadReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/workload?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

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

function CsvButton({ rows, filename }) {
  return (
    <div className="flex justify-end">
      <button onClick={() => downloadCSV(rows, filename)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl hover:bg-slate-50 dark:hover:bg-dark-border transition-colors uppercase">
        <DownloadSimple size={15} /> CSV
      </button>
    </div>
  );
}

// ─── Accomplishment Rates Tab ─────────────────────────────────────────────────
function AccomplishmentReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/accomplishment?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (!data?.data?.length) return <p className="text-center text-slate-400 py-16">No accomplishment data for FY {year}.</p>;

  const sorted = [...data.data].sort((a, b) => b.physicalRate - a.physicalRate).slice(0, 20);
  const rateColor = v => v >= 75 ? 'text-emerald-600 dark:text-emerald-400' : v >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="space-y-6">
      <CsvButton rows={data.data.map(r => ({ School: r.school, Cluster: r.cluster, 'Physical Rate (%)': r.physicalRate, 'Financial Rate (%)': r.financialRate }))} filename={`accomplishment-${year}.csv`} />
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

// ─── Factors Analysis Tab ─────────────────────────────────────────────────────
function FactorsReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/factors?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (!data?.data) return null;
  const hasData = data.data.some(d => d.facilitating + d.hindering > 0);
  if (!hasData) return <p className="text-center text-slate-400 py-16">No factor data for FY {year}.</p>;

  return (
    <div className="space-y-6">
      <CsvButton rows={data.data.map(r => ({ 'Factor Type': r.type, Facilitating: r.facilitating, Hindering: r.hindering }))} filename={`factors-${year}.csv`} />
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

// ─── Budget Sources Tab ───────────────────────────────────────────────────────
function BudgetSourcesReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/budget?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
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
      <CsvButton rows={pieData.map(r => ({ Source: r.name, 'Total Amount': r.value }))} filename={`budget-sources-${year}.csv`} />
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

// ─── AIP Status Funnel Tab ────────────────────────────────────────────────────
function AIPFunnelReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/admin/reports/aip-funnel?year=${year}`, { headers: authHeaders() })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (!data?.data?.length) return <p className="text-center text-slate-400 py-16">No AIP data for FY {year}.</p>;

  const total = data.data.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <CsvButton rows={data.data.map(r => ({ Status: r.status, Count: r.count, '% of Total': ((r.count / total) * 100).toFixed(1) + '%' }))} filename={`aip-funnel-${year}.csv`} />
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

// ─── Cluster PIR Summary Tab ─────────────────────────────────────────────────
const KRA_CATEGORIES = ['ACCESS', 'EQUITY', 'QUALITY', 'WELL-BEING & RESILIENCY', 'GOVERNANCE'];
const KRA_COLORS = {
  'ACCESS': 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
  'EQUITY': 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300',
  'QUALITY': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
  'WELL-BEING & RESILIENCY': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
  'GOVERNANCE': 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
};

function ClusterPIRSummary({ year }) {
  // Bug fix: was hardcoded to [1,2,3,4], which breaks trimester/custom term configs.
  // Now derives period count and labels from termConfig so Q buttons always match
  // the active term system and send the correct period number to the API.
  const termConfig = useTermConfig();
  const [clusters, setClusters] = useState([]);
  const [clusterId, setClusterId] = useState('');
  const [quarter, setQuarter] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/admin/clusters`, { headers: authHeaders() })
      .then(r => setClusters(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!clusterId) { setData(null); return; }
    setLoading(true);
    axios.get(`${API}/api/admin/reports/cluster-pir-summary?year=${year}&quarter=${quarter}&cluster=${clusterId}`, { headers: authHeaders() })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, quarter, clusterId]);

  const togglePresented = async (pirId, schoolId, programId) => {
    if (!pirId) return;
    const key = `${schoolId}_${programId}`;
    // Optimistic update
    setData(prev => {
      const cell = prev.matrix[key];
      const newPresented = !cell.presented;
      const newTotals = { ...prev.totals };
      newTotals[schoolId] = { ...newTotals[schoolId] };
      newTotals[schoolId].presented += newPresented ? 1 : -1;
      return {
        ...prev,
        matrix: { ...prev.matrix, [key]: { ...cell, presented: newPresented } },
        totals: newTotals,
      };
    });
    try {
      await axios.patch(`${API}/api/admin/pirs/${pirId}/presented`, {}, { headers: authHeaders() });
    } catch {
      // Revert on error
      setData(prev => {
        const cell = prev.matrix[key];
        const reverted = !cell.presented;
        const newTotals = { ...prev.totals };
        newTotals[schoolId] = { ...newTotals[schoolId] };
        newTotals[schoolId].presented += reverted ? 1 : -1;
        return {
          ...prev,
          matrix: { ...prev.matrix, [key]: { ...cell, presented: reverted } },
          totals: newTotals,
        };
      });
    }
  };

  // Group programs by category
  const grouped = [];
  if (data) {
    const byCategory = {};
    for (const prog of data.programs) {
      const cat = prog.category || 'UNCATEGORIZED';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(prog);
    }
    // Sort by KRA_CATEGORIES order, then uncategorized at the end
    for (const cat of [...KRA_CATEGORIES, 'UNCATEGORIZED']) {
      if (byCategory[cat]?.length) {
        grouped.push({ category: cat, programs: byCategory[cat] });
      }
    }
  }

  // CONSTRAINT: Clusters have no meaningful name — display by number only. Never append c.name; it mirrors the number and produces "Cluster 1: Cluster 1".
  const clusterOptions = clusters.map(c => ({ value: String(c.id), label: `Cluster ${c.cluster_number}` }));
  const periods = termConfig.periods ?? [];

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchableSelect
            options={clusterOptions}
            value={clusterId ? String(clusterId) : ''}
            onChange={v => setClusterId(v ? parseInt(v) : '')}
            placeholder="Select Cluster…"
          />
        </div>
        <div className="flex items-center gap-1">
          {periods.map((p, i) => (
            <button key={i + 1} onClick={() => setQuarter(i + 1)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${i + 1 === quarter ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>
              {p.ordinal}
            </button>
          ))}
        </div>
      </div>

      {!clusterId && (
        <p className="text-center text-slate-400 dark:text-slate-500 py-16 text-sm">Select a cluster to view the PIR summary matrix.</p>
      )}

      {loading && <Spinner />}

      {data && !loading && (
        <>
          <h2 className="text-center font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Cluster Program Implementation Review (PIR) Summary of Submission
          </h2>

          <div className="overflow-x-auto border border-slate-200 dark:border-dark-border rounded-xl">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                {/* School names row */}
                <tr className="bg-slate-50 dark:bg-dark-surface">
                  <th rowSpan={2} className="px-3 py-2 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap sticky left-0 bg-slate-50 dark:bg-dark-surface z-10 border-r border-slate-200 dark:border-dark-border min-w-[220px]">
                    Program
                  </th>
                  {data.schools.map(s => (
                    <th key={s.id} colSpan={2} className="px-2 py-2 text-center font-black text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-dark-border whitespace-nowrap">
                      {s.abbreviation || s.name}
                    </th>
                  ))}
                </tr>
                {/* Sub-header: Tool / Pres. */}
                <tr className="bg-slate-50 dark:bg-dark-surface">
                  {data.schools.map(s => (
                    <React.Fragment key={s.id}>
                      <th className="px-1.5 py-1 text-center font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase border-l border-slate-200 dark:border-dark-border">Tool</th>
                      <th className="px-1.5 py-1 text-center font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase">Pres.</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped.map(group => (
                  <React.Fragment key={group.category}>
                    {/* Category header row */}
                    <tr>
                      <td colSpan={1 + data.schools.length * 2}
                        className={`px-3 py-1.5 font-black text-[10px] uppercase tracking-widest sticky left-0 z-10 ${KRA_COLORS[group.category] || 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400'}`}>
                        {group.category}
                      </td>
                    </tr>
                    {/* Program rows */}
                    {group.programs.map(prog => (
                      <tr key={prog.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-border/20 border-t border-slate-100 dark:border-dark-border/50">
                        <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap sticky left-0 bg-white dark:bg-dark-surface z-10 border-r border-slate-200 dark:border-dark-border">
                          {prog.title}
                        </td>
                        {data.schools.map(s => {
                          const cell = data.matrix[`${s.id}_${prog.id}`];
                          if (!cell?.eligible) {
                            return (
                              <React.Fragment key={s.id}>
                                <td className="px-1.5 py-1.5 text-center border-l border-slate-100 dark:border-dark-border/50">
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                </td>
                                <td className="px-1.5 py-1.5 text-center">
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                </td>
                              </React.Fragment>
                            );
                          }
                          return (
                            <React.Fragment key={s.id}>
                              {/* PIR Tool — non-interactive */}
                              <td className="px-1.5 py-1.5 text-center border-l border-slate-100 dark:border-dark-border/50">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black ${
                                  cell.pirExists
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                }`}>
                                  {cell.pirExists ? '✓' : '✗'}
                                </span>
                              </td>
                              {/* PIR Presentation — clickable if PIR exists */}
                              <td className="px-1.5 py-1.5 text-center">
                                {cell.pirExists ? (
                                  <button
                                    onClick={() => togglePresented(cell.pirId, s.id, prog.id)}
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black transition-colors cursor-pointer hover:ring-2 hover:ring-offset-1 ${
                                      cell.presented
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:ring-emerald-300'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 hover:ring-rose-300'
                                    }`}
                                    title={cell.presented ? 'Presented — click to unmark' : 'Not presented — click to mark'}
                                  >
                                    {cell.presented ? '✓' : '✗'}
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">✗</span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {/* Totals row */}
                <tr className="bg-slate-50 dark:bg-dark-surface border-t-2 border-slate-300 dark:border-dark-border">
                  <td className="px-3 py-2 font-black text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wide sticky left-0 bg-slate-50 dark:bg-dark-surface z-10 border-r border-slate-200 dark:border-dark-border">
                    Totals
                  </td>
                  {data.schools.map(s => {
                    const t = data.totals[s.id] || { pirTool: 0, presented: 0 };
                    return (
                      <React.Fragment key={s.id}>
                        <td className="px-1.5 py-2 text-center font-black text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-dark-border">
                          {t.pirTool}
                        </td>
                        <td className="px-1.5 py-2 text-center font-black text-slate-700 dark:text-slate-200">
                          {t.presented}
                        </td>
                      </React.Fragment>
                    );
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

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
    </div>
  );
}

export default function AdminReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'compliance';
  const setTab = (key) => setSearchParams(prev => { prev.set('tab', key); return prev; });
  const [year, setYear] = useState(new Date().getFullYear());
  const YEARS = [year - 1, year, year + 1];

  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* Tab Bar + Year + Export */}
        <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-dark-border pb-0">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-bold transition-colors relative ${tab === t.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {t.label}
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-1">
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
        <div id="report-content" className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
          {tab === 'compliance' && <ComplianceReport year={year} />}
          {tab === 'quarterly' && <QuarterlyReport year={year} />}
          {tab === 'budget' && <BudgetReport year={year} />}
          {tab === 'workload' && <WorkloadReport year={year} />}
          {tab === 'accomplishment' && <AccomplishmentReport year={year} />}
          {tab === 'factors' && <FactorsReport year={year} />}
          {tab === 'sources' && <BudgetSourcesReport year={year} />}
          {tab === 'funnel' && <AIPFunnelReport year={year} />}
          {tab === 'cluster-pir' && <ClusterPIRSummary year={year} />}
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
                      <DownloadSimple size={13} /> {fmt}
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
