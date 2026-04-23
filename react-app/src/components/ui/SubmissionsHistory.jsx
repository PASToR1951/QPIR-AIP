import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClockCounterClockwise, CaretDown, CaretUp, Eye, SpinnerGap, Tray, PencilSimple, CheckCircle, Warning, X } from '@phosphor-icons/react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { AIPDocument } from '../docs/AIPDocument';
import { PIRDocument } from '../docs/PIRDocument';
import { StatusBadge } from '../../admin/components/StatusBadge';
import { useTextMeasure } from '../../lib/useTextMeasure';
import { EndOfListCue } from './EndOfListCue.jsx';
import api from '../../lib/api.js';

const ROW_PADDING_Y = 40;
const PIR_BUTTON_HEIGHT = 32;

export default function SubmissionsHistory() {
  const userStr = sessionStorage.getItem('user');
  let user = null;

  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    sessionStorage.removeItem('user');
  }

  const usesSchoolTerminology = user?.role === 'School';
  const currentYear = new Date().getFullYear();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewSubtitle, setPreviewSubtitle] = useState('');
  const [previewLandscape, setPreviewLandscape] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [requestedEditIds, setRequestedEditIds] = useState(new Set());
  const [editRequestCounts, setEditRequestCounts] = useState({});
  const [requestingEditId, setRequestingEditId] = useState(null);
  const [editRequestToast, setEditRequestToast] = useState(null);
  const [confirmEditId, setConfirmEditId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [cancelingEditId, setCancelingEditId] = useState(null);

  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorTitle, setSupervisorTitle] = useState('');

  const { measureText } = useTextMeasure({
    font: '14px Inter',
    lineHeight: 20,
  });
  const submissionHistoryCount = history.reduce((sum, entry) => sum + entry.aips.length, 0);

  const rowHeights = useMemo(() => {
    if (!history.length) return {};
    const heights = {};
    for (const yearEntry of history) {
      for (const aip of yearEntry.aips) {
        const titleWidth = measureText(aip.abbreviation ?? aip.program).lineCount * 20;
        const pirCount = aip.pirs.length;
        const pirHeight = pirCount > 0
          ? Math.ceil(pirCount / Math.floor(600 / 120)) * (PIR_BUTTON_HEIGHT + 8) + 8
          : 24;
        heights[aip.id] = titleWidth + pirHeight + ROW_PADDING_Y;
      }
    }
    return heights;
  }, [history, measureText]);

  useEffect(() => {
    api.get('/api/config')
      .then(r => {
        setSupervisorName(r.data.supervisor_name ?? '');
        setSupervisorTitle(r.data.supervisor_title ?? '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/api/history')
      .then(r => {
        setHistory(r.data);
        const init = {};
        const editedIds = new Set();
        const counts = {};
        for (const entry of r.data) {
          init[entry.year] = entry.year === currentYear;
          for (const aip of entry.aips) {
            if (aip.editRequested) editedIds.add(aip.id);
            counts[aip.id] = aip.editRequestCount ?? 0;
          }
        }
        setExpanded(init);
        setRequestedEditIds(editedIds);
        setEditRequestCounts(counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentYear]);

  const toggleYear = (year) => setExpanded(prev => ({ ...prev, [year]: !prev[year] }));

  const handlePreviewAIP = useCallback(async (programTitle, year, programId = null) => {
    setPreviewLoading(true);
    try {
      const { data: d } = await api.get('/api/aips', {
        params: {
          program_title: programTitle,
          year,
          ...(programId ? { program_id: programId } : {}),
        },
      });
      setPreviewTitle('Annual Implementation Plan');
      setPreviewSubtitle(`${programTitle} — FY ${year}`);
      setPreviewLandscape(true);
        setPreviewContent(
        <AIPDocument
          year={String(d.year)}
          outcome={d.outcome}
          targetDescription={d.targetDescription}
          depedProgram={d.depedProgram}
          usesSchoolTerminology={d.isSchoolOwned ?? true}
          sipTitle={d.sipTitle}
          projectCoord={d.projectCoord}
          objectives={d.objectives}
          indicators={d.indicators}
          activities={d.activities}
          preparedByName={d.preparedByName}
          preparedByTitle={d.preparedByTitle}
          approvedByName={d.approvedByName}
          approvedByTitle={d.approvedByTitle}
        />
      );
      setPreviewOpen(true);
    } catch { /* silently fail */ } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handlePreviewPIR = useCallback(async (programTitle, quarter) => {
    setPreviewLoading(true);
    try {
      const { data: d } = await api.get('/api/pirs', {
        params: { program_title: programTitle, quarter },
      });
      setPreviewTitle('Program Implementation Review');
      setPreviewSubtitle(`${programTitle} — ${quarter}`);
      setPreviewLandscape(true);
      setPreviewContent(
        <PIRDocument
          quarter={d.quarter}
          supervisorName={supervisorName}
          supervisorTitle={supervisorTitle}
          program={d.program}
          school={d.school}
          owner={d.owner}
          budgetFromDivision={d.budgetFromDivision}
          budgetFromCoPSF={d.budgetFromCoPSF}
          functionalDivision={d.functionalDivision}
          usesSchoolTerminology={usesSchoolTerminology}
          indicatorTargets={d.indicatorQuarterlyTargets}
          activities={d.activities}
          factors={d.factors}
          actionItems={d.actionItems}
        />
      );
      setPreviewOpen(true);
    } catch { /* silently fail */ } finally {
      setPreviewLoading(false);
    }
  }, [supervisorName, supervisorTitle, usesSchoolTerminology]);

  const handleRequestEdit = useCallback(async (aipId) => {
    setConfirmEditId(null);
    setRequestingEditId(aipId);
    try {
      await api.post(`/api/aips/${aipId}/request-edit`);
      setRequestedEditIds(prev => new Set(prev).add(aipId));
      setEditRequestCounts(prev => ({ ...prev, [aipId]: (prev[aipId] ?? 0) + 1 }));
      setEditRequestToast('Edit request sent — an admin will be notified.');
      setTimeout(() => setEditRequestToast(null), 3500);
    } catch { /* silently fail — button stays active so user can retry */ } finally {
      setRequestingEditId(null);
    }
  }, []);

  const handleCancelEditRequest = useCallback(async (aipId) => {
    setCancelConfirmId(null);
    setCancelingEditId(aipId);
    try {
      await api.post(`/api/aips/${aipId}/cancel-edit-request`);
      setRequestedEditIds(prev => { const s = new Set(prev); s.delete(aipId); return s; });
      setEditRequestToast('Edit request cancelled.');
      setTimeout(() => setEditRequestToast(null), 3500);
    } catch { /* silently fail */ } finally {
      setCancelingEditId(null);
    }
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
    </div>
  );

  return (
    <>
      <div data-tour="dashboard-submission-history" className="flex items-center justify-between mb-8 px-2 mt-4">
        <h2 className="text-sm font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-4">
          <ClockCounterClockwise size={16} />
          Submission History
          <span className="flex-1 h-px bg-slate-200 dark:bg-dark-border/60" />
        </h2>
      </div>

      {previewLoading && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <SpinnerGap size={36} className="text-indigo-500 animate-spin" />
            <span className="text-sm font-bold text-white">Loading document…</span>
          </div>
        </div>
      )}

      {editRequestToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl text-sm font-semibold">
            <CheckCircle size={18} weight="fill" className="text-emerald-400 dark:text-emerald-600 shrink-0" />
            {editRequestToast}
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-10 flex flex-col items-center text-center mb-12">
          <div className="w-14 h-14 bg-slate-100 dark:bg-dark-border rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-dark-border">
            <ClockCounterClockwise size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-700 dark:text-slate-300 mb-1">No submissions yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-xs">
            Your submitted AIPs and PIRs will appear here, grouped by fiscal year.
          </p>
          <Link
            to="/aip"
            className="mt-4 inline-flex items-center rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-indigo-700"
          >
            Create your first AIP
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mb-12">
          {history.map(({ year, aips }) => {
            const isOpen = !!expanded[year];
            return (
              <div key={year} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50 dark:hover:bg-dark-border/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-slate-800 dark:text-slate-200">FY {year}</span>
                    {year === currentYear && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        Current
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      {aips.length} program{aips.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isOpen
                    ? <CaretUp size={18} className="text-slate-400 dark:text-slate-500" />
                    : <CaretDown size={18} className="text-slate-400 dark:text-slate-500" />
                  }
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-dark-border divide-y divide-slate-100 dark:divide-dark-border">
                    {aips.map((aip) => (
                      <div key={aip.id} className="px-8 py-5" style={{ minHeight: `${rowHeights[aip.id] ?? 0}px` }}>
                        <div className="flex items-center justify-between gap-4">
                          <button
                            onClick={() => handlePreviewAIP(aip.program, year, aip.programId)}
                            disabled={previewLoading}
                            className="flex items-center gap-2 group min-w-0"
                          >
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {aip.abbreviation ?? aip.program}
                            </span>
                            {aip.abbreviation && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden sm:block">
                                {aip.program}
                              </span>
                            )}
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            {aip.archived && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-border">
                                <Tray size={11} />
                                Archived
                              </span>
                            )}
                            <StatusBadge status={aip.status} size="xs" />
                            {aip.status === 'Approved' && !aip.archived && (
                              requestedEditIds.has(aip.id) ? (
                                <button
                                  onClick={() => setCancelConfirmId(aip.id)}
                                  disabled={cancelingEditId === aip.id}
                                  title="Cancel edit request"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <CheckCircle size={11} weight="fill" className="group-hover:hidden" />
                                  <X size={11} weight="bold" className="hidden group-hover:block" />
                                  <span className="group-hover:hidden">{cancelingEditId === aip.id ? 'Cancelling…' : 'Request Sent'}</span>
                                  <span className="hidden group-hover:inline">Cancel Request</span>
                                </button>
                              ) : (editRequestCounts[aip.id] ?? 0) < 3 ? (
                                <button
                                  onClick={() => setConfirmEditId(aip.id)}
                                  disabled={requestingEditId === aip.id}
                                  title="Request edit from admin"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <PencilSimple size={11} />
                                  {requestingEditId === aip.id ? 'Sending…' : 'Request Edit'}
                                </button>
                              ) : (
                                <span
                                  title="Edit request limit reached"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-border text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-dark-border"
                                >
                                  <PencilSimple size={11} />
                                  No Requests Left
                                </span>
                              )
                            )}
                          </div>
                        </div>

                        {aip.pirs.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2 pl-5">
                            {aip.pirs.map((pir) => (
                              <button
                                key={pir.id}
                                onClick={() => handlePreviewPIR(aip.program, pir.quarter)}
                                disabled={previewLoading}
                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-dark-border/50 border border-slate-200 dark:border-dark-border hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-xs font-bold text-slate-600 dark:text-slate-400"
                              >
                                <Eye size={12} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                                {pir.quarter.replace(` CY ${year}`, '')}
                                <StatusBadge status={pir.status} size="xs" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 pl-5 text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">
                            No PIRs filed yet
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <EndOfListCue
            count={submissionHistoryCount}
            message="End of submissions history"
            countLabel="program"
            showCount
            className="pt-2"
          />
        </div>
      )}

      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewContent(null); }}
        title={previewTitle}
        subtitle={previewSubtitle}
        landscape={previewLandscape}
      >
        {previewContent}
      </DocumentPreviewModal>

      {/* Cancel Edit Request Confirmation Modal */}
      <AnimatePresence>
        {cancelConfirmId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setCancelConfirmId(null)}
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-dark-surface shadow-2xl ring-1 ring-slate-900/10 dark:ring-dark-border p-6"
            >
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
              >
                <X size={16} weight="bold" />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center justify-center">
                  <Warning size={20} weight="duotone" className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">Cancel Edit Request?</h3>
                  <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    This will withdraw your edit request. The administrator will no longer be notified. You can send a new request anytime.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelConfirmId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-border hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-colors"
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelEditRequest(cancelConfirmId)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                >
                  Yes, Cancel Request
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Edit Confirmation Modal */}
      <AnimatePresence>
        {confirmEditId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setConfirmEditId(null)}
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-dark-surface shadow-2xl ring-1 ring-slate-900/10 dark:ring-dark-border p-6"
            >
              <button
                type="button"
                onClick={() => setConfirmEditId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
              >
                <X size={16} weight="bold" />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                  <Warning size={20} weight="duotone" className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">Request Edit Access?</h3>
                  <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    This will notify the administrator that you need to make changes to your approved AIP. You can only send one request at a time.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmEditId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-border hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestEdit(confirmEditId)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Yes, Send Request
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
