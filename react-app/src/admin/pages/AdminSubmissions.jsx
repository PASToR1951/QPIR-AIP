import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, Check, ArrowBendUpLeft, DownloadSimple, XCircle, Funnel, CalendarDots, Warning, CheckCircle, FloppyDisk, LockKeyOpen, LockKey } from '@phosphor-icons/react';
import api, { API } from '../../lib/api.js';
import { DataTable } from '../components/DataTable.jsx';
import { withResponsiveHide } from '../components/dataTableColumns.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { SchoolAvatar } from '../../components/ui/SchoolAvatar.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { relativeDate } from '../../lib/dateUtils.js';
import { HIGHLIGHT_DURATION_MS, REVIEW_TIMER_MS, TOAST_DURATION_MS } from '../../constants.js';
import { auth } from '../../lib/auth.js';


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

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('type') || 'all'; // 'all' | 'aip' | 'pir'
  const setTab = (key) => { setSearchParams(prev => { prev.set('type', key); return prev; }); setPage(1); setHighlightRowId(null); };
  const group = searchParams.get('group') || 'flat';
  const setGroup = (key) => { setSearchParams(prev => { prev.set('group', key); return prev; }); };
  const reviewId = searchParams.get('review');
  const isObserver = auth.isObserver();
  const [submissions, setSubmissions] = useState([]);
  const [totals, setTotals] = useState({ aipTotal: 0, pirTotal: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
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
  const [returnFeedbackError, setReturnFeedbackError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);
  const [editActionLoading, setEditActionLoading] = useState(null); // null | 'approve' | 'deny'
  const [observerNotes, setObserverNotes] = useState('');
  const [observerNotesSaving, setObserverNotesSaving] = useState(false);
  const [observerNotesSaved, setObserverNotesSaved] = useState(false);
  const [observerNotesError, setObserverNotesError] = useState('');
  // Tracks which row's PDF is currently being generated to prevent double-clicks
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  // Deep-link highlight: set when navigating from ?review=<id>
  const [highlightRowId, setHighlightRowId] = useState(null);
  const [targetPage, setTargetPage] = useState(1);

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
    if (isObserver) return;
    if (!pendingTermType || pendingTermType === termConfig.termType) return;
    if (periodMonths.some(m => !m.start || !m.end)) {
      setTermError('Assign start and end months for every period.');
      return;
    }
    setTermSaving(true);
    setTermError('');
    try {
      const nextTermType = pendingTermType;
      const nextPeriods = periodMonths.map((m, i) => ({ period: i + 1, startMonth: m.start, endMonth: m.end }));
      await api.patch('/api/admin/term-config', { termType: nextTermType, periods: nextPeriods });
      setTermConfig({ termType: nextTermType, periods: nextPeriods });
      setTermSaved(true);
      setPendingTermType(null);
      const currentSearch = searchParams.toString();
      setTimeout(() => {
        setTermSaved(false);
        navigate({ pathname: '/admin/submissions', search: currentSearch ? `?${currentSearch}` : '' }, { replace: true });
      }, 1200);
    } catch (e) {
      setTermError(e.friendlyMessage ?? 'Failed to update term structure');
    } finally {
      setTermSaving(false);
    }
  };

  const underReviewTimerRef = useRef(null);
  const downloadRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Selected rows for bulk
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg, type = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  useEffect(() => {
    api.get('/api/admin/clusters')
      .then(r => setClusters(r.data))
      .catch(err => console.warn('[clusters filter]', err?.response?.status));
    api.get('/api/admin/programs')
      .then(r => setPrograms(r.data))
      .catch(err => console.warn('[programs filter]', err?.response?.status));
  }, []);

  useEffect(() => {
    if (filters.cluster) {
      api.get(`/api/admin/schools?cluster=${filters.cluster}`)
        .then(r => setSchools(r.data))
        .catch(err => console.warn('[schools filter]', err?.response?.status));
    } else {
      setSchools([]);
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
    api.get(`/api/admin/submissions?${params}`)
      .then(r => {
        setFetchError(null);
        setSubmissions(r.data.data);
        setTotals({ aipTotal: r.data.aipTotal, pirTotal: r.data.pirTotal, total: r.data.total });
      })
      .catch(e => { console.error(e); setFetchError(e.friendlyMessage ?? 'Failed to load submissions. Please refresh and try again.'); })
      .finally(() => setLoading(false));
  }, [tab, filters, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // Auto-open entity when navigating from a notification or deep-link (?review=<id>)
  useEffect(() => {
    if (!reviewId || submissions.length === 0) return;
    const idx = submissions.findIndex(s => s.id === Number(reviewId));
    if (idx === -1) return;
    const row = submissions[idx];
    setSearchParams(prev => { prev.delete('review'); return prev; }, { replace: true });
    if (row.type === 'PIR') {
      navigate(`/admin/pirs/${row.id}`);
    } else {
      setTargetPage(Math.ceil((idx + 1) / 25));
      setHighlightRowId(row.id);
      openView(row);
    }
  // openView is stable (defined once, no deps) — intentionally excluded to avoid re-runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, reviewId]);

  // Scroll to and clear the highlighted row after animation completes
  useEffect(() => {
    if (!highlightRowId) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(`row-${highlightRowId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const timer = setTimeout(() => setHighlightRowId(null), HIGHLIGHT_DURATION_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [highlightRowId]);

  const closeView = () => {
    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;
    setViewItem(null);
    setViewData(null);
    setObserverNotes('');
    setObserverNotesSaving(false);
    setObserverNotesSaved(false);
    setObserverNotesError('');
  };

  const handleEditAction = async (action) => {
    if (!viewItem || isObserver) return;
    setEditActionLoading(action);
    try {
      await api.patch(`/api/admin/aips/${viewItem.id}/${action}-edit`);
      closeView();
      fetchSubmissions();
    } catch (e) {
      setActionError(e.friendlyMessage ?? `Failed to ${action} edit request. Please try again.`);
    }
    finally { setEditActionLoading(null); }
  };

  const openView = async (item) => {
    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;

    setViewItem(item);
    setViewLoading(true);
    setObserverNotes('');
    setObserverNotesSaved(false);
    setObserverNotesError('');
    try {
      const r = await api.get(`/api/admin/submissions/${item.id}?type=${item.type.toLowerCase()}`);
      setViewData(r.data);
      setObserverNotes(r.data.observer_notes ?? r.data.observerNotes ?? '');

      if (!isObserver && item.type === 'PIR' && item.status === 'Submitted') {
        underReviewTimerRef.current = setTimeout(() => {
          handleStatusUpdate(item.id, item.type, 'Under Review');
        }, REVIEW_TIMER_MS);
      }
    } catch (err) {
      setViewData(null);
      showToast('Could not load submission details. Please try again.', 'error');
      console.warn('[submission detail]', err?.response?.status);
    }
    finally { setViewLoading(false); }
  };

  const canChangeSubmissionStatus = (item) => !isObserver && item?.status !== 'Approved' && item?.status !== 'Returned';
  const canDownloadSubmission = (item) => item?.status !== 'Returned';

  const handleStatusUpdate = async (id, type, status, feedback = '') => {
    if (isObserver) return;
    if (status === 'Returned' && !feedback.trim()) {
      setReturnFeedbackError('A reason is required before returning a submission.');
      showToast('Please enter a reason before returning the submission.', 'error');
      return;
    }

    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/submissions/${id}/status`, { type: type.toLowerCase(), status, feedback: feedback.trim() });
      fetchSubmissions();
      setApproveItem(null);
      setReturnItem(null);
      setReturnFeedback('');
      setReturnFeedbackError('');
      if (viewData) {
        setViewData(prev => prev ? { ...prev, status } : prev);
      }
    } catch (e) { console.error(e); setActionError(e.friendlyMessage ?? 'Failed to update status. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleViewStatusChange = (status) => {
    if (isObserver) return;
    if (status === 'Returned') {
      const currentStatus = viewData?.status ?? viewItem.status;

      if (!canChangeSubmissionStatus({ status: currentStatus })) {
        showToast(`${currentStatus} submissions cannot be returned.`, 'error');
        return;
      }

      setReturnItem({ ...viewItem, status: currentStatus });
      setReturnFeedback('');
      setReturnFeedbackError('');
      closeView();
      return;
    }

    handleStatusUpdate(viewItem.id, viewItem.type, status);
  };

  const handleBulkApprove = async () => {
    if (isObserver) return;
    if (!selectedIds.length) return;
    setActionLoading(true);
    try {
      const toApprove = submissions.filter(s => selectedIds.includes(s.id) && canChangeSubmissionStatus(s));
      for (const item of toApprove) {
        await api.patch(`/api/admin/submissions/${item.id}/status`, { type: item.type.toLowerCase(), status: 'Approved', feedback: '' });
      }
      setSelectedIds([]);
      fetchSubmissions();
    } catch (e) { console.error(e); setActionError(e.friendlyMessage ?? 'Failed to approve selected submissions. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleExportCSV = async () => {
    const params = new URLSearchParams({ format: 'csv', ...(tab !== 'all' ? { type: tab } : {}) });
    if (filters.year) params.set('year', filters.year);
    if (filters.status) params.set('status', filters.status);
    const url = `${API}/api/admin/submissions/export?${params}`;
    const blob = await fetch(url, { credentials: 'include' }).then(r => r.blob());
    const blobUrl = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = blobUrl;
      downloadRef.current.download = 'submissions.csv';
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  };

  const handleExportXLSX = async () => {
    const params = new URLSearchParams({ format: 'xlsx', ...(tab !== 'all' ? { type: tab } : {}) });
    if (filters.year) params.set('year', filters.year);
    if (filters.status) params.set('status', filters.status);
    const url = `${API}/api/admin/submissions/export?${params}`;
    const blob = await fetch(url, { credentials: 'include' }).then(r => r.blob());
    const blobUrl = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = blobUrl;
      downloadRef.current.download = 'submissions.xlsx';
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
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

  const handleObserverNotesSave = async () => {
    if (!isObserver || !viewItem) return;
    setObserverNotesSaving(true);
    setObserverNotesSaved(false);
    setObserverNotesError('');
    try {
      const r = await api.patch(`/api/admin/submissions/${viewItem.id}/observer-notes`, {
        type: viewItem.type.toLowerCase(),
        notes: observerNotes,
      });
      const savedNotes = r.data.observer_notes ?? observerNotes;
      setObserverNotes(savedNotes);
      setViewData(prev => prev ? { ...prev, observer_notes: savedNotes } : prev);
      setObserverNotesSaved(true);
      setTimeout(() => setObserverNotesSaved(false), 2500);
    } catch (e) {
      setObserverNotesError(e.friendlyMessage ?? 'Failed to save observer notes.');
    } finally {
      setObserverNotesSaving(false);
    }
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

  const renderSchoolCell = (value, row) => {
    if (!row.schoolId) {
      return <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] block">{value}</span>;
    }

    return (
      <div className="flex items-center gap-2 min-w-0 max-w-[180px]">
        <SchoolAvatar
          clusterNumber={row.clusterNumber}
          schoolLogo={row.schoolLogo ?? null}
          clusterLogo={row.clusterLogo ?? null}
          name={value}
          size={28}
          className="shrink-0"
        />
        <span className="font-bold text-slate-900 dark:text-slate-100 truncate min-w-0">{value}</span>
      </div>
    );
  };

  const columns = withResponsiveHide([
    { key: 'school', label: 'School', sortable: true, render: renderSchoolCell },
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
            onClick={() => row.type === 'PIR' ? navigate(`/admin/pirs/${row.id}`) : openView(row)}
            title={row.type === 'PIR' ? 'Review PIR' : 'View'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <Eye size={17} />
          </button>
          {canChangeSubmissionStatus(row) && (
            <button onClick={() => setApproveItem(row)} title="Approve" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"><Check size={17} /></button>
          )}
          {canChangeSubmissionStatus(row) && (
            <button onClick={() => { setReturnItem(row); setReturnFeedback(''); setReturnFeedbackError(''); }} title="Return" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"><ArrowBendUpLeft size={17} /></button>
          )}
          {/* Bug fix: pass row directly so handleExportPDF isn't affected by stale viewItem state.
              pdfLoadingId guards against multiple simultaneous export clicks. */}
          {canDownloadSubmission(row) && (
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
          )}
        </div>
      )
    },
  ], {
    lg: ['cluster', 'quarter', 'year', 'dateSubmitted'],
    xl: ['program', 'submittedBy'],
  });

  return (
    <>
      {/* Hidden download anchor for CSV export */}
      <a ref={downloadRef} className="hidden" />
      <div className="space-y-4">

        {fetchError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium">
            {fetchError}
          </div>
        )}

        {actionError && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 text-sm font-medium flex items-center justify-between">
            {actionError}
            <button onClick={() => setActionError(null)} className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 font-black text-xs ml-3">Dismiss</button>
          </div>
        )}

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
            <button onClick={handleExportXLSX} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
              <DownloadSimple size={16} /> XLSX
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
                options={schools.map(s => ({ value: s.id, label: s.abbreviation ? `${s.name} (${s.abbreviation})` : s.name }))}
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

            {!isObserver && (
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
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {!isObserver && selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl px-4 py-3">
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{selectedIds.length} selected</span>
            {submissions.some(s => selectedIds.includes(s.id) && canChangeSubmissionStatus(s)) && (
              <button onClick={handleBulkApprove} disabled={actionLoading} className="text-xs font-bold text-emerald-600 hover:underline disabled:opacity-50">{actionLoading ? 'Approving...' : 'Approve Selected'}</button>
            )}
            <button onClick={handleExportCSV} className="text-xs font-bold text-indigo-600 hover:underline">Export CSV</button>
            <button onClick={handleExportXLSX} className="text-xs font-bold text-indigo-600 hover:underline">Export XLSX</button>
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
                selectable={!isObserver}
                selectedIds={selectedIds}
                onSelectChange={setSelectedIds}
                onRowClick={(row) => { if (row.type === 'PIR') navigate(`/admin/pirs/${row.id}`); else openView(row); }}
                getRowClassName={(row) => [row.type === 'PIR' ? 'cursor-pointer' : '', row.id === highlightRowId ? 'row-highlight' : ''].filter(Boolean).join(' ')}
                emptyMessage="No submissions match the current filters."
                initialPage={targetPage}
                highlightRowId={highlightRowId}
                endMessage="All matching submissions shown"
                endCountLabel="submission"
                showEndCount
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
                    selectable={!isObserver}
                    selectedIds={selectedIds}
                    onSelectChange={setSelectedIds}
                    onRowClick={(row) => { if (row.type === 'PIR') navigate(`/admin/pirs/${row.id}`); else openView(row); }}
                    getRowClassName={(row) => [row.type === 'PIR' ? 'cursor-pointer' : '', row.id === highlightRowId ? 'row-highlight' : ''].filter(Boolean).join(' ')}
                    emptyMessage="No submissions in this group."
                    highlightRowId={highlightRowId}
                    endMessage={`End of ${groupKey} submissions`}
                    endCountLabel="submission"
                    showEndCount
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
        open={!!returnItem && canChangeSubmissionStatus(returnItem)}
        title="Return for Revision"
        onSave={() => handleStatusUpdate(returnItem.id, returnItem.type, 'Returned', returnFeedback)}
        onCancel={() => { setReturnItem(null); setReturnFeedback(''); setReturnFeedbackError(''); }}
        loading={actionLoading}
        saveLabel="Return"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Returning <strong>{returnItem?.type}</strong> from <strong>{returnItem?.school}</strong> for <strong>{returnItem?.program}</strong>.
        </p>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Feedback / Reason <span className="text-rose-500">(required)</span></label>
        <textarea
          value={returnFeedback}
          onChange={e => { setReturnFeedback(e.target.value); if (returnFeedbackError) setReturnFeedbackError(''); }}
          rows={4}
          placeholder="Explain what needs to be revised…"
          aria-invalid={!!returnFeedbackError}
          aria-describedby="return-feedback-help"
          className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border rounded-xl resize-none text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none ${
            returnFeedbackError
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-400'
              : 'border-slate-200 dark:border-dark-border focus:border-indigo-400'
          }`}
        />
        <p id="return-feedback-help" className={`mt-1.5 text-xs font-medium ${returnFeedbackError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
          {returnFeedbackError || 'A short reason is required so the submitter knows what to revise.'}
        </p>
      </FormModal>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle size={18} weight="fill" className="text-emerald-500" />
            : <Warning size={18} weight="fill" className="text-rose-500" />
          }
          {toast.msg}
        </div>
      )}

      {/* View Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-dark-base">
          <div className="h-[100dvh] w-screen bg-white dark:bg-dark-surface flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 border-b border-slate-200 dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
              <div className="min-w-0 flex flex-wrap items-center gap-2 sm:gap-3">
                <h3 className="min-w-0 flex-1 font-black text-slate-900 dark:text-slate-100 truncate">{viewItem.school}</h3>
                <StatusBadge status={viewItem.type} />
                <StatusBadge status={viewData?.status ?? viewItem.status} />
              </div>
              <button onClick={closeView} className="self-end sm:self-auto p-2 -m-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle size={22} weight="fill" />
              </button>
            </div>

            {/* Body */}
            <div id="submission-detail-body" className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
              {viewLoading ? (
                <div className="flex min-h-[60vh] items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
                </div>
              ) : viewData ? (
                <div className="mx-auto max-w-7xl space-y-5 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {viewData.activities.map((a, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-dark-base rounded-xl px-4 py-3 border border-slate-100 dark:border-dark-border">
                            <p className="font-bold text-slate-800 dark:text-slate-200 break-words">{a.activity_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">{a.phase} · {a.budget_source} · ₱{Number(a.budget_amount).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(isObserver || observerNotes) && (
                    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                        Observer Notes
                      </label>
                      <textarea
                        value={observerNotes}
                        onChange={e => { setObserverNotes(e.target.value); setObserverNotesSaved(false); setObserverNotesError(''); }}
                        rows={4}
                        readOnly={!isObserver}
                        placeholder={isObserver ? 'Add observer-only notes for monitoring…' : 'No observer notes yet.'}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors read-only:cursor-default"
                      />
                      {observerNotesError && <p className="mt-1.5 text-xs text-red-500">{observerNotesError}</p>}
                      {observerNotesSaved && <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">Observer notes saved.</p>}
                      {isObserver && (
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={handleObserverNotesSave}
                            disabled={observerNotesSaving}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            <FloppyDisk size={16} />
                            {observerNotesSaving ? 'Saving…' : 'Save Notes'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-12">Could not load submission details.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 border-t border-slate-200 dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {!isObserver && (
                  <>
                    <select
                      value={viewData?.status ?? viewItem.status}
                      onChange={e => handleViewStatusChange(e.target.value)}
                      className="w-full sm:w-auto text-sm font-bold bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
                    >
                      {(viewItem.type === 'AIP'
                        ? ['Approved', 'Returned']
                        : ['Submitted', 'Under Review', 'For CES Review', 'For Cluster Head Review', 'Approved', 'Returned']
                      ).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {viewData?.edit_requested && viewItem.type === 'AIP' && (
                      <>
                        <button
                          disabled={!!editActionLoading}
                          onClick={() => handleEditAction('approve')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
                        >
                          <LockKeyOpen size={14} />
                          {editActionLoading === 'approve' ? 'Approving…' : 'Approve Edit'}
                        </button>
                        <button
                          disabled={!!editActionLoading}
                          onClick={() => handleEditAction('deny')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                        >
                          <LockKey size={14} />
                          {editActionLoading === 'deny' ? 'Denying…' : 'Deny Edit'}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                {canDownloadSubmission({ status: viewData?.status ?? viewItem.status }) && (
                  <button onClick={() => handleExportPDF(viewItem)} className="flex flex-1 items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors sm:flex-none">
                    <DownloadSimple size={17} /> PDF
                  </button>
                )}
                <button onClick={closeView} className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors sm:flex-none">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
