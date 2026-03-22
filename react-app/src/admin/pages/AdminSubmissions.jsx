import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Eye, Check, ArrowBendUpLeft, DownloadSimple, X, Funnel, NotePencil } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { PIRRemarksModal } from '../components/PIRRemarksModal.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

function relativeDate(d) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminSubmissions() {
  const [tab, setTab] = useState('all'); // 'all' | 'aip' | 'pir'
  const [submissions, setSubmissions] = useState([]);
  const [totals, setTotals] = useState({ aipTotal: 0, pirTotal: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [clusters, setClusters] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [filters, setFilters] = useState({ cluster: null, school: null, program: null, quarter: null, year: null, status: null });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [viewItem, setViewItem] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [approveItem, setApproveItem] = useState(null);
  const [returnItem, setReturnItem] = useState(null);
  const [returnFeedback, setReturnFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [remarksItem, setRemarksItem] = useState(null);
  // Track which PIR ids have remarks (for indicator badge)
  const [remarkedIds, setRemarkedIds] = useState(new Set());

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
        // Track PIR rows that already have remarks (server includes has_remarks flag or we derive from local state)
        setRemarkedIds(prev => {
          const next = new Set(prev);
          r.data.data.forEach(row => { if (row.type === 'PIR' && row.has_remarks) next.add(row.id); });
          return next;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, filters, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const openView = async (item) => {
    setViewItem(item);
    setViewLoading(true);
    try {
      const r = await axios.get(`${API}/api/admin/submissions/${item.id}?type=${item.type.toLowerCase()}`, { headers: authHeaders() });
      setViewData(r.data);
    } catch { setViewData(null); }
    finally { setViewLoading(false); }
  };

  const handleStatusUpdate = async (id, type, status, feedback = '') => {
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

  const handleExportPDF = async () => {
    const el = document.getElementById('submission-detail-body');
    if (!el || !viewItem) return;
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
    pdf.save(`${viewItem.type}-${viewItem.id}.pdf`);
  };

  const clearFilters = () => setFilters({ cluster: null, school: null, program: null, quarter: null, year: null, status: null });

  const TABS = [
    { key: 'all', label: 'All', count: totals.total },
    { key: 'aip', label: 'AIPs', count: totals.aipTotal },
    { key: 'pir', label: 'PIRs', count: totals.pirTotal },
  ];

  const STATUS_OPTIONS = ['Submitted', 'Under Review', 'Approved', 'Returned'];
  const QUARTER_OPTIONS = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
  const YEAR_OPTIONS = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: String(y) }));

  const columns = [
    { key: 'school', label: 'School', sortable: true, render: v => <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] block">{v}</span> },
    { key: 'cluster', label: 'Cluster', sortable: true, render: v => <span className="text-xs font-bold bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">{v}</span> },
    { key: 'program', label: 'Program', sortable: true, render: v => <span className="truncate max-w-[180px] block text-slate-600 dark:text-slate-400">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <StatusBadge status={v} size="xs" /> },
    { key: 'quarter', label: 'Quarter', render: v => <span className="text-xs text-slate-500 dark:text-slate-400">{v ?? '—'}</span> },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'dateSubmitted', label: 'Date Submitted', sortable: true, render: v => <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{relativeDate(v)}</span> },
    { key: 'submittedBy', label: 'Submitted By', render: v => <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px] block">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} size="xs" /> },
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(row)} title="View" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><Eye size={17} /></button>
          <button onClick={() => setApproveItem(row)} title="Approve" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"><Check size={17} /></button>
          <button onClick={() => { setReturnItem(row); setReturnFeedback(''); }} title="Return" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"><ArrowBendUpLeft size={17} /></button>
          {row.type === 'PIR' && (
            <button
              onClick={() => setRemarksItem(row)}
              title="Add Remarks"
              className={`relative p-1.5 rounded-lg transition-colors ${remarkedIds.has(row.id) ? 'text-accent hover:bg-rose-950/20' : 'text-slate-400 hover:text-accent hover:bg-rose-950/20'}`}
            >
              <NotePencil size={17} />
              {remarkedIds.has(row.id) && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          )}
          <button onClick={() => { openView(row).then(() => new Promise(r => setTimeout(r, 500))).then(() => handleExportPDF()); }} title="Download PDF" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><DownloadSimple size={17} /></button>
        </div>
      )
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-dark-border">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-bold transition-colors relative flex items-center gap-2 ${tab === t.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.key ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>{t.count}</span>
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pb-1">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${showFilters ? 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}>
              <Funnel size={16} /> Filters
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
              <DownloadSimple size={16} /> CSV
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <SearchableSelect
                options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}: ${c.name}` }))}
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
                options={QUARTER_OPTIONS.map((q, i) => ({ value: String(i + 1), label: q }))}
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
        ) : (
          <DataTable
            columns={columns}
            data={submissions}
            selectable
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            emptyMessage="No submissions match the current filters."
          />
        )}
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setViewItem(null); setViewData(null); }} />
          <div className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-border shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-slate-900 dark:text-slate-100">{viewItem.school}</h3>
                <StatusBadge status={viewItem.type} />
                <StatusBadge status={viewItem.status} />
              </div>
              <button onClick={() => { setViewItem(null); setViewData(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
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
                  <div className="grid grid-cols-2 gap-4">
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
                  {['Submitted', 'Under Review', 'Approved', 'Returned'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                  <DownloadSimple size={17} /> PDF
                </button>
                <button onClick={() => { setViewItem(null); setViewData(null); }} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PIR Remarks Modal */}
      <PIRRemarksModal
        open={!!remarksItem}
        pir={remarksItem}
        onClose={() => setRemarksItem(null)}
        onSaved={(text) => {
          setRemarkedIds(prev => {
            const next = new Set(prev);
            if (text.trim()) next.add(remarksItem.id);
            else next.delete(remarksItem.id);
            return next;
          });
        }}
      />
    </AdminLayout>
  );
}
