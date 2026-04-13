import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DownloadSimple, Funnel } from '@phosphor-icons/react';
import { DataTable } from '../components/DataTable.jsx';
import { HIGHLIGHT_DURATION_MS, TOAST_DURATION_MS } from '../../constants.js';
import { auth } from '../../lib/auth.js';
import { GROUP_OPTIONS, groupSubmissions } from './adminSubmissions/submissionsConstants.js';
import { useSubmissionsData } from './adminSubmissions/useSubmissionsData.js';
import { useTermConfig } from './adminSubmissions/useTermConfig.js';
import { useSubmissionActions } from './adminSubmissions/useSubmissionActions.js';
import { useSubmissionModal } from './adminSubmissions/useSubmissionModal.js';
import { useSubmissionExport } from './adminSubmissions/useSubmissionExport.js';
import { SubmissionsFilterBar } from './adminSubmissions/SubmissionsFilterBar.jsx';
import { SubmissionDetailModal } from './adminSubmissions/SubmissionDetailModal.jsx';
import { SubmissionModals } from './adminSubmissions/SubmissionModals.jsx';
import { buildSubmissionColumns } from './adminSubmissions/submissionColumns.jsx';

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab      = searchParams.get('type')  || 'all';
  const group    = searchParams.get('group') || 'flat';
  const reviewId = searchParams.get('review');
  const isObserver = auth.isObserver();

  const setTab   = (key) => { setSearchParams(prev => { prev.set('type',  key); return prev; }); setPage(1); setHighlightRowId(null); };
  const setGroup = (key) => { setSearchParams(prev => { prev.set('group', key); return prev; }); };

  const [page, setPage]                     = useState(1);
  const [filters, setFilters]               = useState({ cluster: null, school: null, program: null, quarter: null, year: new Date().getFullYear(), status: null });
  const [showFilters, setShowFilters]       = useState(false);
  const [selectedIds, setSelectedIds]       = useState([]);
  const [highlightRowId, setHighlightRowId] = useState(null);
  const [targetPage, setTargetPage]         = useState(1);
  const [toast, setToast]                   = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg, type = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const { submissions, totals, loading, fetchError, fetchSubmissions, clusters, schools, programs } =
    useSubmissionsData({ tab, filters, page });

  const termConfig = useTermConfig({ isObserver, navigate, searchParams });
  const actions    = useSubmissionActions({ fetchSubmissions, showToast });
  const modal      = useSubmissionModal({
    isObserver,
    handleStatusUpdate: actions.handleStatusUpdate,
    fetchSubmissions,
    setActionError: actions.setActionError,
    showToast,
  });
  const { downloadRef, handleExportCSV, handleExportXLSX } = useSubmissionExport({ tab, filters });

  // Wrap handleStatusUpdate to sync viewData when called (e.g. auto-Under-Review)
  const handleStatusUpdate = async (id, type, status, feedback = '') => {
    await actions.handleStatusUpdate(id, type, status, feedback);
    if (modal.viewData) modal.syncViewDataStatus(status);
  };

  const handleViewStatusChange = (status) => {
    if (isObserver) return;
    if (status === 'Returned') {
      const currentStatus = modal.viewData?.status ?? modal.viewItem?.status;
      if (!actions.canChangeSubmissionStatus({ status: currentStatus })) { showToast(`${currentStatus} submissions cannot be returned.`, 'error'); return; }
      actions.setReturnItem({ ...modal.viewItem, status: currentStatus });
      actions.setReturnFeedback(''); actions.setReturnFeedbackError('');
      modal.closeView(); return;
    }
    handleStatusUpdate(modal.viewItem.id, modal.viewItem.type, status);
  };

  const handleBulkApprove = () =>
    actions.handleBulkApprove(submissions, selectedIds, setSelectedIds, isObserver);

  // Auto-open entity when navigating from a notification or deep-link (?review=<id>)
  useEffect(() => {
    if (!reviewId || submissions.length === 0) return;
    const idx = submissions.findIndex(s => s.id === Number(reviewId));
    if (idx === -1) return;
    const row = submissions[idx];
    setSearchParams(prev => { prev.delete('review'); return prev; }, { replace: true });
    if (row.type === 'PIR') { navigate(`/admin/pirs/${row.id}`); }
    else { setTargetPage(Math.ceil((idx + 1) / 25)); setHighlightRowId(row.id); modal.openView(row); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, reviewId]);

  // Scroll to and clear the highlighted row after animation completes
  useEffect(() => {
    if (!highlightRowId) return;
    const raf   = requestAnimationFrame(() => document.getElementById(`row-${highlightRowId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    const timer = setTimeout(() => setHighlightRowId(null), HIGHLIGHT_DURATION_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [highlightRowId]);

  const TABS = [
    { key: 'all', label: 'All',  count: totals.aipTotal + totals.pirTotal },
    { key: 'aip', label: 'AIPs', count: totals.aipTotal },
    { key: 'pir', label: 'PIRs', count: totals.pirTotal },
  ];

  const columns = buildSubmissionColumns({
    isObserver, navigate,
    onView: modal.openView, onApprove: actions.setApproveItem,
    onReturn: (row) => { actions.setReturnItem(row); actions.setReturnFeedback(''); actions.setReturnFeedbackError(''); },
    onExportPDF: modal.handleExportPDF,
    pdfLoadingId: modal.pdfLoadingId, setPdfLoadingId: modal.setPdfLoadingId,
    canChangeSubmissionStatus: actions.canChangeSubmissionStatus,
    canDownloadSubmission: actions.canDownloadSubmission,
  });

  const renderTable = (data, extraProps = {}) => (
    <DataTable columns={columns} data={data}
      selectable={!isObserver} selectedIds={selectedIds} onSelectChange={setSelectedIds}
      onRowClick={(row) => { if (row.type === 'PIR') navigate(`/admin/pirs/${row.id}`); else modal.openView(row); }}
      getRowClassName={(row) => [row.type === 'PIR' ? 'cursor-pointer' : '', row.id === highlightRowId ? 'row-highlight' : ''].filter(Boolean).join(' ')}
      highlightRowId={highlightRowId} endCountLabel="submission" showEndCount {...extraProps}
    />
  );

  return (
    <>
      <a ref={downloadRef} className="hidden" />
      <div className="space-y-4">
        {fetchError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium">{fetchError}</div>
        )}
        {actions.actionError && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 text-sm font-medium flex items-center justify-between">
            {actions.actionError}
            <button onClick={() => actions.setActionError(null)} className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 font-black text-xs ml-3">Dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-bold transition-colors relative flex items-center gap-2 ${tab === t.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
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
            <button onClick={handleExportCSV}  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"><DownloadSimple size={16} /> CSV</button>
            <button onClick={handleExportXLSX} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"><DownloadSimple size={16} /> XLSX</button>
          </div>
        </div>

        {/* Group-by selector */}
        <div className="flex items-center gap-1 flex-wrap pt-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Group:</span>
          {GROUP_OPTIONS.map(g => (
            <button key={g.key} onClick={() => setGroup(g.key)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${group === g.key ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}>
              {g.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <SubmissionsFilterBar
            clusters={clusters} schools={schools} programs={programs}
            filters={filters} setFilters={setFilters}
            isObserver={isObserver} termConfig={termConfig}
          />
        )}

        {/* Bulk Actions */}
        {!isObserver && selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl px-4 py-3">
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{selectedIds.length} selected</span>
            {submissions.some(s => selectedIds.includes(s.id) && actions.canChangeSubmissionStatus(s)) && (
              <button onClick={handleBulkApprove} disabled={actions.actionLoading} className="text-xs font-bold text-emerald-600 hover:underline disabled:opacity-50">{actions.actionLoading ? 'Approving...' : 'Approve Selected'}</button>
            )}
            <button onClick={handleExportCSV}  className="text-xs font-bold text-indigo-600 hover:underline">Export CSV</button>
            <button onClick={handleExportXLSX} className="text-xs font-bold text-indigo-600 hover:underline">Export XLSX</button>
            <button onClick={() => setSelectedIds([])} className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">Clear</button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" /></div>
        ) : (() => {
          const groups = groupSubmissions(submissions, group);
          if (!groups) return renderTable(submissions, { emptyMessage: 'No submissions match the current filters.', initialPage: targetPage, endMessage: 'All matching submissions shown' });
          return (
            <div className="space-y-6">
              {groups.map(({ groupKey, rows }) => (
                <div key={groupKey}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{groupKey}</span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">{rows.length}</span>
                  </div>
                  {renderTable(rows, { emptyMessage: 'No submissions in this group.', endMessage: `End of ${groupKey} submissions` })}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      <SubmissionModals actions={actions} onStatusUpdate={handleStatusUpdate} toast={toast} />

      <SubmissionDetailModal
        viewItem={modal.viewItem} viewData={modal.viewData} viewLoading={modal.viewLoading}
        isObserver={isObserver} onClose={modal.closeView} onExportPDF={modal.handleExportPDF}
        editActionLoading={modal.editActionLoading} onEditAction={modal.handleEditAction}
        observerNotes={modal.observerNotes} setObserverNotes={modal.setObserverNotes}
        observerNotesSaving={modal.observerNotesSaving} observerNotesSaved={modal.observerNotesSaved}
        observerNotesError={modal.observerNotesError} onObserverNotesSave={modal.handleObserverNotesSave}
        canDownloadSubmission={actions.canDownloadSubmission}
      />
    </>
  );
}
