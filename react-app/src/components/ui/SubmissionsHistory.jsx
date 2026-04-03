import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ClockCounterClockwise, CaretDown, CaretUp, Eye, SpinnerGap, Tray, PencilSimple, CheckCircle } from '@phosphor-icons/react';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { AIPDocument } from '../docs/AIPDocument';
import { PIRDocument } from '../docs/PIRDocument';
import { StatusBadge } from '../../admin/components/StatusBadge';

const API = import.meta.env.VITE_API_URL;

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

  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorTitle, setSupervisorTitle] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/config`)
      .then(r => {
        setSupervisorName(r.data.supervisor_name ?? '');
        setSupervisorTitle(r.data.supervisor_title ?? '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/history`, { credentials: 'include' })
      .then(r => {
        setHistory(r.data);
        const init = {};
        for (const entry of r.data) init[entry.year] = entry.year === currentYear;
        setExpanded(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleYear = (year) => setExpanded(prev => ({ ...prev, [year]: !prev[year] }));

  const handlePreviewAIP = useCallback(async (programTitle, year) => {
    setPreviewLoading(true);
    try {
      const { data: d } = await axios.get(`${API}/api/aips`, {
        params: { program_title: programTitle, year },
        credentials: 'include',
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
      const { data: d } = await axios.get(`${API}/api/pirs`, {
        params: { program_title: programTitle, quarter },
        credentials: 'include',
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
      await axios.post(`${API}/api/aips/${aipId}/request-edit`, {}, { credentials: 'include' });
      setRequestedEditIds(prev => new Set(prev).add(aipId));
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
      <div className="flex items-center justify-between mb-8 px-2 mt-4">
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

      {history.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] p-10 flex flex-col items-center text-center mb-12">
          <div className="w-14 h-14 bg-slate-100 dark:bg-dark-border rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-dark-border">
            <ClockCounterClockwise size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-black text-slate-700 dark:text-slate-300 mb-1">No submissions yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-xs">
            Your submitted AIPs and PIRs will appear here, grouped by fiscal year.
          </p>
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
                      <div key={aip.id} className="px-8 py-5">
                        <div className="flex items-center justify-between gap-4">
                          <button
                            onClick={() => handlePreviewAIP(aip.program, year)}
                            disabled={previewLoading}
                            className="flex items-center gap-2 group min-w-0"
                          >
                            <Eye size={15} className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
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
