import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClockCounterClockwise, CaretDown, CaretUp, Eye, SpinnerGap, Tray, PencilSimple, CheckCircle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { AIPDocument } from '../docs/AIPDocument';
import { PIRDocument } from '../docs/PIRDocument';
import { StatusBadge } from '../../admin/components/StatusBadge';
import { useTextMeasure } from '../../lib/useTextMeasure';
import { EndOfListCue } from './EndOfListCue';
import api from '../../lib/api.js';

const ROW_PADDING_Y = 40;
const PIR_BUTTON_HEIGHT = 32;

export default function SubmissionsHistory() {
  
  
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
  const [requestingEditId, setRequestingEditId] = useState(null);
  const [editRequestToast, setEditRequestToast] = useState(null);

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
        for (const entry of r.data) {
          init[entry.year] = entry.year === currentYear;
          for (const aip of entry.aips) {
            if (aip.editRequested) editedIds.add(aip.id);
          }
        }
        setExpanded(init);
        setRequestedEditIds(editedIds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentYear]);

  const toggleYear = (year) => setExpanded(prev => ({ ...prev, [year]: !prev[year] }));

  const handlePreviewAIP = useCallback(async (programTitle, year) => {
    setPreviewLoading(true);
    try {
      const { data: d } = await api.get('/api/aips', {
        params: { program_title: programTitle, year },
      });
      setPreviewTitle('Annual Implementation Plan');
      setPreviewSubtitle(`${programTitle} — FY ${year}`);
      setPreviewLandscape(false);
      setPreviewContent(
        <AIPDocument
          year={String(d.year)}
          outcome={d.outcome}
          depedProgram={d.depedProgram}
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
  }, [supervisorName, supervisorTitle]);

  const handleRequestEdit = useCallback(async (aipId) => {
    setRequestingEditId(aipId);
    try {
      await api.post(`/api/aips/${aipId}/request-edit`);
      setRequestedEditIds(prev => new Set(prev).add(aipId));
      setEditRequestToast('Edit request sent — an admin will be notified.');
      setTimeout(() => setEditRequestToast(null), 3500);
    } catch { /* silently fail — button stays active so user can retry */ } finally {
      setRequestingEditId(null);
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
                            onClick={() => handlePreviewAIP(aip.program, year)}
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
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle size={11} weight="fill" />
                                  Request Sent
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRequestEdit(aip.id)}
                                  disabled={requestingEditId === aip.id}
                                  title="Request edit from admin"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <PencilSimple size={11} />
                                  {requestingEditId === aip.id ? 'Sending…' : 'Request Edit'}
                                </button>
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
    </>
  );
}
