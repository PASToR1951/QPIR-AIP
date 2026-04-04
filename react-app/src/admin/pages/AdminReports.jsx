import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  DownloadSimple, MagnifyingGlass, X, CaretDown, CaretUp,
  CheckCircle, Warning, Buildings, ChartBar,
} from '@phosphor-icons/react';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API = import.meta.env.VITE_API_URL;


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
  const ext = format === 'xlsx' ? 'xlsx' : format;
  const url = `${API}/api/admin/reports/${type}/export?format=${format}&year=${year}`;
  const blob = await fetch(url, { credentials: 'include' }).then(r => r.blob());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${type}-report-${year}.${ext}`;
  a.click();
}


const EXPORT_STYLES = {
  csv: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400',
  xlsx: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400',
  pdf: 'hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 dark:hover:text-rose-400',
};

function ExportButtons({ type, year }) {
  return (
    <div className="flex items-center gap-2">
      {['csv', 'xlsx', 'pdf'].map(fmt => (
        <button key={fmt} onClick={() => downloadReport(type, fmt, year)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors uppercase ${EXPORT_STYLES[fmt]}`}>
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
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('summary');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/compliance?year=${year}`, { withCredentials: true })
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load compliance report.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data) return null;

  function rateBarColor(rate) {
    if (rate >= 80) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  }
  function rateBarTrack(rate) {
    if (rate >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (rate >= 50) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-rose-100 dark:bg-rose-900/30';
  }
  function rateTextColor(rate) {
    if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  }
  function rowBorderColor(rate) {
    if (rate === null) return 'border-l-slate-300 dark:border-l-slate-600';
    if (rate >= 80) return 'border-l-emerald-400 dark:border-l-emerald-600';
    if (rate >= 50) return 'border-l-amber-400 dark:border-l-amber-600';
    return 'border-l-rose-400 dark:border-l-rose-600';
  }

  const enrichedRows = data.matrix.map(row => {
    const eligible = data.programs.filter(p => row[p] !== 'na').length;
    const submitted = data.programs.filter(p => row[p] === 'submitted').length;
    const missing = data.programs.filter(p => row[p] === 'missing').length;
    const rate = eligible === 0 ? null : Math.round((submitted / eligible) * 100);
    const missingPrograms = data.programs.filter(p => row[p] === 'missing');
    return { ...row, eligible, submitted, missing, rate, missingPrograms };
  });

  const totalSubmitted = enrichedRows.reduce((s, r) => s + r.submitted, 0);
  const totalEligible = enrichedRows.reduce((s, r) => s + r.eligible, 0);
  const kpi = {
    total: enrichedRows.length,
    compliant: enrichedRows.filter(r => r.missing === 0 && r.eligible > 0).length,
    withMissing: enrichedRows.filter(r => r.missing > 0).length,
    overallRate: totalEligible === 0 ? 0 : Math.round((totalSubmitted / totalEligible) * 100),
  };

  let filteredRows = enrichedRows;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filteredRows = filteredRows.filter(r => r.school.toLowerCase().includes(q));
  }
  if (filter === 'missing') filteredRows = filteredRows.filter(r => r.missing > 0);
  if (filter === 'compliant') filteredRows = filteredRows.filter(r => r.missing === 0 && r.eligible > 0);
  if (sort === 'name') filteredRows = [...filteredRows].sort((a, b) => a.school.localeCompare(b.school));
  if (sort === 'rate-asc') filteredRows = [...filteredRows].sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));

  const STATUS_PILL = {
    submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    missing: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    na: 'bg-slate-100 text-slate-400 dark:bg-dark-border dark:text-slate-600',
  };
  const STATUS_SYM = { submitted: '✓', missing: '✗', na: '—' };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: <Buildings size={18} className="text-indigo-600 dark:text-indigo-400" />,
            iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
            value: kpi.total,
            label: 'Total Schools',
            valueClass: 'text-slate-800 dark:text-slate-100',
          },
          {
            icon: <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />,
            iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
            value: kpi.compliant,
            label: 'Fully Compliant',
            valueClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            icon: <Warning size={18} weight="fill" className="text-rose-600 dark:text-rose-400" />,
            iconBg: 'bg-rose-100 dark:bg-rose-950/40',
            value: kpi.withMissing,
            label: 'With Missing AIPs',
            valueClass: 'text-rose-600 dark:text-rose-400',
          },
          {
            icon: <ChartBar size={18} className={rateTextColor(kpi.overallRate)} />,
            iconBg: kpi.overallRate >= 80 ? 'bg-emerald-100 dark:bg-emerald-950/40' : kpi.overallRate >= 50 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-rose-100 dark:bg-rose-950/40',
            value: `${kpi.overallRate}%`,
            label: 'Overall Rate',
            valueClass: rateTextColor(kpi.overallRate),
          },
        ].map((card, i) => (
          <div key={i} className="bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${card.iconBg}`}>{card.icon}</div>
            <p className={`text-2xl font-black ${card.valueClass}`}>{card.value}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schools…"
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[{ key: 'all', label: 'All' }, { key: 'missing', label: 'Non-Compliant' }, { key: 'compliant', label: 'Fully Compliant' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${filter === f.key ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {[{ key: 'name', label: 'Name' }, { key: 'rate-asc', label: 'Worst First' }].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${sort === s.key ? 'bg-slate-200 dark:bg-dark-border text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border/50'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-dark-border rounded-xl">
          {[{ key: 'summary', label: 'Summary' }, { key: 'matrix', label: 'Matrix' }].map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === v.key ? 'bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border">
                <th className="px-4 py-3 text-left font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide sticky left-0 bg-slate-50 dark:bg-dark-surface z-10 min-w-[180px]">School</th>
                <th className="px-4 py-3 text-left font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">Level</th>
                <th className="px-4 py-3 text-center font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">Submitted</th>
                <th className="px-4 py-3 text-left font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide min-w-[140px]">Rate</th>
                <th className="px-4 py-3 text-left font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide min-w-[220px]">Missing Programs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filteredRows.map(row => {
                const isExpanded = expandedRows.has(row.schoolId);
                return (
                  <React.Fragment key={row.schoolId}>
                    <tr
                      onClick={() => setExpandedRows(prev => { const n = new Set(prev); n.has(row.schoolId) ? n.delete(row.schoolId) : n.add(row.schoolId); return n; })}
                      className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-border/20 border-l-4 transition-colors ${rowBorderColor(row.rate)}`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky left-0 bg-white dark:bg-dark-surface z-10">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <CaretUp size={13} className="text-slate-400 shrink-0" /> : <CaretDown size={13} className="text-slate-400 shrink-0" />}
                          {row.school}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center font-bold rounded-lg text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 dark:bg-dark-border dark:text-slate-400">{row.level}</span>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{row.submitted}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs"> / {row.eligible}</span>
                      </td>
                      <td className="px-4 py-3">
                        {row.rate === null ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 h-2 rounded-full ${rateBarTrack(row.rate)}`}>
                              <div className={`h-full rounded-full ${rateBarColor(row.rate)}`} style={{ width: `${Math.max(row.rate, 3)}%` }} />
                            </div>
                            <span className={`text-xs font-black tabular-nums w-9 text-right ${rateTextColor(row.rate)}`}>{row.rate}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.missingPrograms.length === 0
                          ? <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">All submitted</span>
                          : (
                            <div className="flex flex-wrap gap-1">
                              {row.missingPrograms.slice(0, 3).map(p => (
                                <span key={p} title={p} className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 max-w-[100px] truncate">{p}</span>
                              ))}
                              {row.missingPrograms.length > 3 && (
                                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-dark-border dark:text-slate-400">+{row.missingPrograms.length - 3} more</span>
                              )}
                            </div>
                          )
                        }
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={`border-l-4 ${rowBorderColor(row.rate)}`}>
                        <td colSpan={5} className="px-6 py-4 bg-slate-50 dark:bg-dark-surface/60">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Full Program Breakdown — {row.school}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.programs.map(p => {
                              const status = row[p] ?? 'na';
                              return (
                                <div key={p} title={p} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_PILL[status]}`}>
                                  <span>{STATUS_SYM[status]}</span>
                                  <span className="max-w-[130px] truncate">{p}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-bold text-sm">No schools match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto border border-slate-200 dark:border-dark-border rounded-2xl">
          <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-surface">
                <th className="px-3 py-2 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap sticky left-0 bg-slate-50 dark:bg-dark-surface z-20 border-r border-slate-200 dark:border-dark-border">School</th>
                {data.programs.map(p => (
                  <th key={p} title={p} className="px-1 w-7 h-20 align-bottom relative">
                    <div className="relative h-full flex items-end justify-center pb-2">
                      <span className="absolute origin-bottom-left -rotate-45 whitespace-nowrap text-[9px] font-black text-slate-500 dark:text-slate-400 bottom-2 left-3" style={{ width: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filteredRows.map(row => (
                <tr key={row.schoolId} className={`hover:bg-slate-50 dark:hover:bg-dark-border/20 border-l-4 ${rowBorderColor(row.rate)}`}>
                  <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky left-0 bg-white dark:bg-dark-surface z-10 border-r border-slate-200 dark:border-dark-border">{row.school}</td>
                  {data.programs.map(p => {
                    const status = row[p] ?? 'na';
                    return (
                      <td key={p} className="px-1 py-1.5 text-center">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black ${STATUS_PILL[status]}`}>{STATUS_SYM[status]}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={data.programs.length + 1} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-bold text-sm">No schools match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Quarterly Tab ───────────────────────────────────────────────────────────
function QuarterlyReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/quarterly?year=${year}`, { withCredentials: true })
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

// ─── Budget Tab ──────────────────────────────────────────────────────────────
function BudgetReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/budget?year=${year}`, { withCredentials: true })
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

// ─── Workload Tab ────────────────────────────────────────────────────────────
function WorkloadReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/workload?year=${year}`, { withCredentials: true })
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

function CsvButton({ rows, filename }) {
  return (
    <div className="flex justify-end">
      <button onClick={() => downloadCSV(rows, filename)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl transition-colors uppercase hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400">
        <DownloadSimple size={15} /> CSV
      </button>
    </div>
  );
}

// ─── Accomplishment Rates Tab ─────────────────────────────────────────────────
function AccomplishmentReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/accomplishment?year=${year}`, { withCredentials: true })
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

// ─── Factors Analysis Tab ─────────────────────────────────────────────────────
function FactorsReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/factors?year=${year}`, { withCredentials: true })
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

// ─── Budget Sources Tab ───────────────────────────────────────────────────────
function BudgetSourcesReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/budget?year=${year}`, { withCredentials: true })
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

// ─── AIP Status Funnel Tab ────────────────────────────────────────────────────
function AIPFunnelReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${API}/api/admin/reports/aip-funnel?year=${year}`, { withCredentials: true })
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

// ─── Cluster PIR Summary Tab ─────────────────────────────────────────────────
function ClusterPIRSummary({ year }) {
  const [clusters, setClusters] = useState([]);
  const [clusterId, setClusterId] = useState('');
  const [quarter, setQuarter] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/admin/clusters`, { withCredentials: true })
      .then(r => setClusters(r.data))
      .catch(e => { console.error(e); /* non-critical — cluster list won't populate */ });
  }, []);

  useEffect(() => {
    if (!clusterId) { setData(null); return; }
    setLoading(true);
    axios.get(`${API}/api/admin/reports/cluster-pir-summary?year=${year}&quarter=${quarter}&cluster=${clusterId}`, { withCredentials: true })
      .then(r => setData(r.data))
      .catch(e => { console.error(e); setData(null); })
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
      await axios.patch(`${API}/api/admin/pirs/${pirId}/presented`, {}, { withCredentials: true });
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

  // CONSTRAINT: Clusters have no meaningful name — display by number only. Never append c.name; it mirrors the number and produces "Cluster 1: Cluster 1".
  const clusterOptions = clusters.map(c => ({ value: String(c.id), label: `Cluster ${c.cluster_number}` }));
  const CY_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

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
          {CY_QUARTERS.map((label, i) => (
            <button key={i + 1} onClick={() => setQuarter(i + 1)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${i + 1 === quarter ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>
              {label}
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
                {data.programs.map(prog => (
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
    <>
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
              { label: 'AIP Compliance', type: 'compliance' },
              { label: 'PIR Quarterly', type: 'quarterly' },
              { label: 'Budget Summary', type: 'budget' },
              { label: 'Personnel Workload', type: 'workload' },
              { label: 'Accomplishment Rates', type: 'accomplishment' },
              { label: 'Factors Analysis', type: 'factors' },
              { label: 'Budget Sources', type: 'sources' },
              { label: 'AIP Status Funnel', type: 'funnel' },
            ].map(item => (
              <div key={item.type} className="border border-slate-200 dark:border-dark-border rounded-xl p-3 space-y-2">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  {['csv', 'xlsx', 'pdf'].map(fmt => (
                    <button key={fmt} onClick={() => downloadReport(item.type, fmt, year)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-border rounded-lg transition-colors uppercase ${EXPORT_STYLES[fmt]}`}>
                      <DownloadSimple size={13} /> {fmt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
