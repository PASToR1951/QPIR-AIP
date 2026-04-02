import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Eye, Check, ArrowBendUpLeft, DownloadSimple, XCircle, Funnel, CalendarDots, Warning, CheckCircle, FloppyDisk } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { PIRReviewDrawer } from '../components/PIRReviewDrawer.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TERM_OPTIONS = [
  { type: 'Trimester', label: 'Trimester', periodCount: 3 },
  { type: 'Quarterly', label: 'Quarterly', periodCount: 4 },
  { type: 'Bimester',  label: 'Bimester',  periodCount: 2 },
];

const MONTHS = [
  { value: 1,  label: 'January' },  { value: 2,  label: 'February' },
  { value: 3,  label: 'March' },    { value: 4,  label: 'April' },
  { value: 5,  label: 'May' },      { value: 6,  label: 'June' },
  { value: 7,  label: 'July' },     { value: 8,  label: 'August' },
  { value: 9,  label: 'September' },{ value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

// Bug fix: guard against null/undefined — new Date(null) returns epoch (Jan 1 1970),
// new Date(undefined) returns Invalid Date. Show a dash for missing dates instead.
function relativeDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminSubmissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('type') || 'all'; // 'all' | 'aip' | 'pir'
  const setTab = (key) => { setSearchParams(prev => { prev.set('type', key); return prev; }); setPage(1); };
  const group = searchParams.get('group') || 'flat';
  const setGroup = (key) => { setSearchParams(prev => { prev.set('group', key); return prev; }); };
  const [submissions, setSubmissions] = useState([]);
  const [totals, setTotals] = useState({ aipTotal: 0, pirTotal: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [clusters, setClusters] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [filters, setFilters] = useState({ cluster: null, school: null, program: null, quarter: null, year: new Date().getFullYear(), status: null });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [viewItem, setViewItem] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [approveItem, setApproveItem] = useState(null);
  const [returnItem, setReturnItem] = useState(null);
  const [returnFeedback, setReturnFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  // Tracks which row's PDF is currently being generated to prevent double-clicks
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  // Term structure switcher
  const [termConfig, setTermConfig] = useState({ termType: null, periods: [] });
  const [pendingTermType, setPendingTermType] = useState(null);
  const [periodMonths, setPeriodMonths] = useState([]); // [{start: number, end: number}]
  const [termSaving, setTermSaving] = useState(false);
  const [termSaved, setTermSaved] = useState(false);
  const [termError, setTermError] = useState('');

  // Seed period months from the live term config once it loads
  useEffect(() => {
    if (termConfig.periods?.length) {
      setPeriodMonths(termConfig.periods.map(p => ({ start: p.startMonth, end: p.endMonth })));
    }
  }, [termConfig.periods]);

  // Selecting a term type pre-fills months from current config (if same type) or clears them (new type)
  const handleTermTypeSelect = (type) => {
    setPendingTermType(type);
    if (type === termConfig.termType) {
      setPeriodMonths(termConfig.periods.map(p => ({ start: p.startMonth, end: p.endMonth })));
    } else {
      const count = TERM_OPTIONS.find(o => o.type === type)?.periodCount ?? 0;
      setPeriodMonths(Array.from({ length: count }, () => ({ start: '', end: '' })));
    }
  };

  const handleTermSave = async () => {
    if (!pendingTermType || pendingTermType === termConfig.termType) return;
    if (periodMonths.some(m => !m.start || !m.end)) {
      setTermError('Assign start and end months for every period.');
      return;
    }
    setTermSaving(true);
    setTermError('');
    try {
      await axios.patch(
        `${API}/api/admin/term-config`,
        { termType: pendingTermType, periods: periodMonths.map((m, i) => ({ period: i + 1, startMonth: m.start, endMonth: m.end })) },
        { headers: authHeaders() }
      );
      setTermSaved(true);
      setPendingTermType(null);
      setTimeout(() => { setTermSaved(false); window.location.reload(); }, 1200);
    } catch (e) {
      setTermError(e.response?.data?.error || 'Failed to update term structure');
    } finally {
      setTermSaving(false);
    }
  };

  const underReviewTimerRef = useRef(null);

  // Selected rows for bulk
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/admin/clusters`, { headers: authHeaders() }).then(r => setClusters(r.data)).catch(() => {});
    axios.get(`${API}/api/admin/programs`, { headers: authHeaders() }).then(r => setPrograms(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.cluster) {
      axios.get(`${API}/api/admin/schools?cluster=${filters.cluster}`, { headers: authHeaders() })
        .then(r => setSchools(r.data)).catch(() => {});
    } else {
      setSchools([]);
      setFilters(f => ({ ...f, school: null }));
    }
  }, [filters.cluster]);

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('type', tab);
    if (filters.cluster) params.set('cluster', filters.cluster);
    if (filters.school) params.set('school', filters.school);
    if (filters.program) params.set('program', filters.program);
    if (filters.quarter) params.set('quarter', filters.quarter);
    if (filters.year) params.set('year', filters.year);
    if (filters.status) params.set('status', filters.status);
    params.set('page', page);
    axios.get(`${API}/api/admin/submissions?${params}`, { headers: authHeaders() })
      .then(r => {
        setSubmissions(r.data.data);
        setTotals({ aipTotal: r.data.aipTotal, pirTotal: r.data.pirTotal, total: r.data.total });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, filters, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const closeView = () => {
    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;
    setViewItem(null);
    setViewData(null);
  };

  const openView = async (item) => {
    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;

    setViewItem(item);
    setViewLoading(true);
    try {
      const r = await axios.get(`${API}/api/admin/submissions/${item.id}?type=${item.type.toLowerCase()}`, { headers: authHeaders() });
      setViewData(r.data);

      if (item.type === 'PIR' && item.status === 'Submitted') {
        underReviewTimerRef.current = setTimeout(() => {
          handleStatusUpdate(item.id, item.type, 'Under Review');
        }, 2 * 60 * 1000);
      }
    } catch { setViewData(null); }
    finally { setViewLoading(false); }
  };

  const handleStatusUpdate = async (id, type, status, feedback = '') => {
    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/admin/submissions/${id}/status`, { type: type.toLowerCase(), status, feedback }, { headers: authHeaders() });
      fetchSubmissions();
      setApproveItem(null);
      setReturnItem(null);
      setReturnFeedback('');
      if (viewData) {
        setViewData(prev => prev ? { ...prev, status } : prev);
      }
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.length) return;
    setActionLoading(true);
    try {
      const toApprove = submissions.filter(s => selectedIds.includes(s.id) && s.status !== 'Approved');
      for (const item of toApprove) {
        await axios.patch(`${API}/api/admin/submissions/${item.id}/status`, { type: item.type.toLowerCase(), status: 'Approved', feedback: '' }, { headers: authHeaders() });
      }
      setSelectedIds([]);
      fetchSubmissions();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleExportCSV = async () => {
    const params = new URLSearchParams({ format: 'csv', ...(tab !== 'all' ? { type: tab } : {}) });
    if (filters.year) params.set('year', filters.year);
    if (filters.status) params.set('status', filters.status);
    const url = `${API}/api/admin/submissions/export?${params}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'submissions.csv';
    // Need to fetch with auth header
    const blob = await fetch(url, { headers: authHeaders() }).then(r => r.blob());
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  // Bug fix: accepts `item` directly instead of reading `viewItem` from state.
  // Previously, calling this via a .then() chain captured a stale viewItem=null
  // from the render at click time, causing the export to always bail out early.
  const handleExportPDF = async (item) => {
    const el = document.getElementById('submission-detail-body');
    if (!el || !item) return;
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
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
    pdf.save(`${item.type}-${item.id}.pdf`);
  };

  const clearFilters = () => setFilters({ cluster: null, school: null, program: null, quarter: null, year: null, status: null });

  const TABS = [
    { key: 'all', label: 'All', count: totals.aipTotal + totals.pirTotal },
    { key: 'aip', label: 'AIPs', count: totals.aipTotal },
    { key: 'pir', label: 'PIRs', count: totals.pirTotal },
  ];

  const GROUP_OPTIONS = [
    { key: 'flat',    label: 'Default' },
    { key: 'cluster', label: 'By Cluster' },
    { key: 'school',  label: 'By School' },
    { key: 'user',    label: 'By Submitter' },
    { key: 'quarter', label: 'By Quarter' },
    { key: 'status',  label: 'By Status' },
  ];

  function groupSubmissions(data, groupKey) {
    if (groupKey === 'flat') return null;
    const keyFn = {
      cluster: r => r.cluster || '—',
      school:  r => r.school  || '—',
      user:    r => r.submittedBy || '—',
      quarter: r => r.quarter || '— (AIP)',
      status:  r => r.status,
    }[groupKey];
    if (!keyFn) return null;
    const map = new Map();
    for (const row of data) {
      const k = keyFn(row);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(row);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rows]) => ({ groupKey: key, rows }));
  }

  const STATUS_OPTIONS = ['Submitted', 'Under Review', 'For CES Review', 'For Cluster Head Review', 'Approved', 'Returned'];
  const QUARTER_OPTIONS = [
    { label: '1st Quarter', value: '1st' },
    { label: '2nd Quarter', value: '2nd' },
    { label: '3rd Quarter', value: '3rd' },
    { label: '4th Quarter', value: '4th' },
  ];
  const currentYear = new Date().getFullYear();
  const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: y, label: String(y) }));

  const columns = [
    { key: 'school', label: 'School', sortable: true, render: v => <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] block">{v}</span> },
    { key: 'cluster', label: 'Cluster', sortable: true, render: v => <span className="text-xs font-bold bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">{v}</span> },
    { key: 'program', label: 'Program', sortable: true, cardFullWidth: true, render: v => <span className="truncate max-w-[180px] block text-slate-600 dark:text-slate-400">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <StatusBadge status={v} size="xs" /> },
    { key: 'quarter', label: 'Quarter', render: v => <span className="text-xs text-slate-500 dark:text-slate-400">{v ?? '—'}</span> },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'dateSubmitted', label: 'Date Submitted', sortable: true, render: v => <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{relativeDate(v)}</span> },
    { key: 'submittedBy', label: 'Submitted By', render: v => <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px] block">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} size="xs" /> },
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => row.type === 'PIR' ? setReviewItem(row) : openView(row)}
            title={row.type === 'PIR' ? 'Review PIR' : 'View'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <Eye size={17} />
          </button>
          {row.status !== 'Approved' && (
            <button onClick={() => setApproveItem(row)} title="Approve" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"><Check size={17} /></button>
          )}
          <button onClick={() => { setReturnItem(row); setReturnFeedback(''); }} title="Return" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"><ArrowBendUpLeft size={17} /></button>
          {/* Bug fix: pass row directly so handleExportPDF isn't affected by stale viewItem state.
              pdfLoadingId guards against multiple simultaneous export clicks. */}
          <button
            disabled={pdfLoadingId === row.id}
            onClick={async () => {
              setPdfLoadingId(row.id);
              try {
                await openView(row);
                await new Promise(r => setTimeout(r, 500));
                await handleExportPDF(row);
              } finally {
                setPdfLoadingId(null);
              }
            }}
            title="Download PDF"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          ><DownloadSimple size={17} /></button>
        </div>
      )
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-bold transition-colors relative flex items-center gap-2 ${tab === t.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.key ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>{t.count}</span>
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-1 shrink-0">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${showFilters ? 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}>
              <Funnel size={16} /> Filters
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
              <DownloadSimple size={16} /> CSV
            </button>
          </div>
        </div>

        {/* Group-by selector */}
        <div className="flex items-center gap-1 flex-wrap pt-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Group:</span>
          {GROUP_OPTIONS.map(g => (
            <button key={g.key} onClick={() => setGroup(g.key)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                group === g.key
                  ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* CONSTRAINT: Clusters have no meaningful name — display by number only. Never use c.name here; it mirrors the number and produces "Cluster 1: Cluster 1". */}
              <SearchableSelect
                options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}` }))}
                value={filters.cluster}
                onChange={v => setFilters(f => ({ ...f, cluster: v, school: null }))}
                placeholder="Cluster"
                clearable
              />
              <SearchableSelect
                options={schools.map(s => ({ value: s.id, label: s.name }))}
                value={filters.school}
                onChange={v => setFilters(f => ({ ...f, school: v }))}
                placeholder="School"
                clearable
              />
              <SearchableSelect
                options={programs.map(p => ({ value: p.id, label: p.title }))}
                value={filters.program}
                onChange={v => setFilters(f => ({ ...f, program: v }))}
                placeholder="Program"
                clearable
              />
              <SearchableSelect
                options={QUARTER_OPTIONS}
                value={filters.quarter}
                onChange={v => setFilters(f => ({ ...f, quarter: v }))}
                placeholder="Quarter"
                clearable
              />
              <SearchableSelect
                options={YEAR_OPTIONS}
                value={filters.year}
                onChange={v => setFilters(f => ({ ...f, year: v }))}
                placeholder="Year"
                clearable
              />
              <SearchableSelect
                options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                value={filters.status}
                onChange={v => setFilters(f => ({ ...f, status: v }))}
                placeholder="Status"
                clearable
              />
            </div>
            <button onClick={clearFilters} className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Clear filters</button>

            {/* Term Structure */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-border space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDots size={14} className="text-violet-500 dark:text-violet-400" />
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Term Structure</span>
              </div>

              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                <Warning size={13} weight="fill" className="shrink-0 mt-px" />
                <span>Existing PIR records keep their original period labels. Only new submissions are affected.</span>
              </div>

              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {TERM_OPTIONS.map(opt => {
                  const activeType = pendingTermType ?? termConfig.termType;
                  const isActive = activeType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => handleTermTypeSelect(opt.type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        isActive
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20'
                          : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {isActive && <CheckCircle size={12} weight="fill" className="text-violet-500 dark:text-violet-400" />}
                      {opt.label}
                      <span className="text-[10px] font-bold opacity-60">{opt.periodCount} periods</span>
                    </button>
                  );
                })}
              </div>

              {/* Month assignment — appears when a type is selected */}
              {pendingTermType && periodMonths.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Which months does each period cover?
                  </p>
                  {periodMonths.map((pm, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-16 shrink-0">Period {i + 1}</span>
                      <select
                        value={pm.start}
                        onChange={e => setPeriodMonths(prev => prev.map((m, j) => j === i ? { ...m, start: Number(e.target.value) } : m))}
                        className="flex-1 text-xs bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500"
                      >
                        <option value="">Start month…</option>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">to</span>
                      <select
                        value={pm.end}
                        onChange={e => setPeriodMonths(prev => prev.map((m, j) => j === i ? { ...m, end: Number(e.target.value) } : m))}
                        className="flex-1 text-xs bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500"
                      >
                        <option value="">End month…</option>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Apply row */}
              <div className="flex items-center justify-between pt-1">
                <div>{termError && <span className="text-[11px] text-rose-500 font-bold">{termError}</span>}</div>
                <button
                  onClick={handleTermSave}
                  disabled={termSaving || !pendingTermType || pendingTermType === termConfig.termType}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    termSaved ? 'bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  {termSaved
                    ? <><CheckCircle size={12} weight="fill" /> Applied</>
                    : <><FloppyDisk size={12} weight="bold" /> {termSaving ? 'Saving…' : 'Apply'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl px-4 py-3">
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{selectedIds.length} selected</span>
            <button onClick={handleBulkApprove} disabled={actionLoading} className="text-xs font-bold text-emerald-600 hover:underline disabled:opacity-50">{actionLoading ? 'Approving...' : 'Approve Selected'}</button>
            <button onClick={handleExportCSV} className="text-xs font-bold text-indigo-600 hover:underline">Export CSV</button>
            <button onClick={() => setSelectedIds([])} className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">Clear</button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (() => {
          const groups = groupSubmissions(submissions, group);
          if (!groups) {
            return (
              <DataTable
                columns={columns}
                data={submissions}
                selectable
                selectedIds={selectedIds}
                onSelectChange={setSelectedIds}
                onRowClick={(row) => { if (row.type === 'PIR') setReviewItem(row); else openView(row); }}
                getRowClassName={(row) => row.type === 'PIR' ? 'cursor-pointer' : ''}
                emptyMessage="No submissions match the current filters."
              />
            );
          }
          return (
            <div className="space-y-6">
              {groups.map(({ groupKey, rows }) => (
                <div key={groupKey}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{groupKey}</span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">{rows.length}</span>
                  </div>
                  <DataTable
                    columns={columns}
                    data={rows}
                    selectable
                    selectedIds={selectedIds}
                    onSelectChange={setSelectedIds}
                    onRowClick={(row) => { if (row.type === 'PIR') setReviewItem(row); else openView(row); }}
                    getRowClassName={(row) => row.type === 'PIR' ? 'cursor-pointer' : ''}
                    emptyMessage="No submissions in this group."
                  />
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Approve Confirm */}
      <ConfirmModal
        open={!!approveItem}
        title="Approve Submission"
        message={`Approve ${approveItem?.type} for ${approveItem?.school} – ${approveItem?.program}?`}
        variant="info"
        confirmLabel="Approve"
        onConfirm={() => handleStatusUpdate(approveItem.id, approveItem.type, 'Approved')}
        onCancel={() => setApproveItem(null)}
        loading={actionLoading}
      />

      {/* Return Modal */}
      <FormModal
        open={!!returnItem}
        title="Return for Revision"
        onSave={() => handleStatusUpdate(returnItem.id, returnItem.type, 'Returned', returnFeedback)}
        onCancel={() => setReturnItem(null)}
        loading={actionLoading}
        saveLabel="Return"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Returning <strong>{returnItem?.type}</strong> from <strong>{returnItem?.school}</strong> for <strong>{returnItem?.program}</strong>.
        </p>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Feedback / Reason</label>
        <textarea
          value={returnFeedback}
          onChange={e => setReturnFeedback(e.target.value)}
          rows={4}
          placeholder="Explain what needs to be revised…"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl resize-none text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
        />
      </FormModal>

      {/* View Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeView} />
          <div className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-border shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-slate-900 dark:text-slate-100">{viewItem.school}</h3>
                <StatusBadge status={viewItem.type} />
                <StatusBadge status={viewItem.status} />
              </div>
              <button onClick={closeView} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle size={22} weight="fill" />
              </button>
            </div>

            {/* Body */}
            <div id="submission-detail-body" className="flex-1 overflow-y-auto px-6 py-4">
              {viewLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
                </div>
              ) : viewData ? (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Program</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{viewData.program?.title ?? viewData.aip?.program?.title ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{viewData.year ?? viewData.aip?.year ?? '—'}</p>
                    </div>
                    {viewItem.type === 'PIR' && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quarter</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{viewData.quarter}</p>
                      </div>
                    )}
                    {viewItem.type === 'AIP' && (
                      <>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SIP Title</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{viewData.sip_title}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coordinator</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{viewData.project_coordinator}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {viewData.activities?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Activities ({viewData.activities.length})</p>
                      <div className="space-y-2">
                        {viewData.activities.map((a, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-dark-base rounded-xl px-4 py-3">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{a.activity_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.phase} · {a.budget_source} · ₱{Number(a.budget_amount).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-12">Could not load submission details.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-dark-border shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={viewData?.status ?? viewItem.status}
                  onChange={e => handleStatusUpdate(viewItem.id, viewItem.type, e.target.value)}
                  className="text-sm font-bold bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300"
                >
                  {(viewItem.type === 'AIP'
                    ? ['Approved', 'Returned']
                    : ['Submitted', 'Under Review', 'For CES Review', 'For Cluster Head Review', 'Approved', 'Returned']
                  ).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                  <DownloadSimple size={17} /> PDF
                </button>
                <button onClick={closeView} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <PIRReviewDrawer
        open={!!reviewItem}
        pir={reviewItem}
        onClose={() => setReviewItem(null)}
        onStatusChange={fetchSubmissions}
      />
    </AdminLayout>
  );
}
