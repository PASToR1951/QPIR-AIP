import React from 'react';
import { XCircle, DownloadSimple, LockKeyOpen, LockKey, FloppyDisk } from '@phosphor-icons/react';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { getProjectTerminology } from '../../../lib/projectTerminology.js';

export function SubmissionDetailModal({
  viewItem, viewData, viewLoading,
  isObserver, onClose, onExportPDF,
  editActionLoading, onEditAction,
  observerNotes, setObserverNotes,
  observerNotesSaving, observerNotesSaved, observerNotesError,
  onObserverNotesSave,
  canDownloadSubmission,
}) {
  if (!viewItem) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-dark-base">
      <div className="h-[100dvh] w-screen bg-white dark:bg-dark-surface flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 border-b border-slate-200 dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
          <div className="min-w-0 flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="min-w-0 flex-1 font-black text-slate-900 dark:text-slate-100 truncate">{viewItem.school}</h3>
            <StatusBadge status={viewItem.type} />
            <StatusBadge status={viewData?.status ?? viewItem.status} />
          </div>
          <button onClick={onClose} className="self-end sm:self-auto p-2 -m-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {getProjectTerminology(Boolean(viewData.school)).projectTitleShortLabel}
                      </p>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                          {a.phase} · {a.budget_source} · ₱{Number(a.budget_amount).toLocaleString()}
                        </p>
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
                    onChange={e => { setObserverNotes(e.target.value); }}
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
                        onClick={onObserverNotesSave}
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
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-center sm:px-6 lg:px-8 border-t border-slate-200 dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
          <div className="flex w-full items-center justify-center gap-2 flex-wrap">
            {!isObserver && viewData?.edit_requested && viewItem.type === 'AIP' && (
              <>
                <button
                  disabled={!!editActionLoading}
                  onClick={() => onEditAction('approve')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
                >
                  <LockKeyOpen size={14} />
                  {editActionLoading === 'approve' ? 'Approving…' : 'Approve Edit'}
                </button>
                <button
                  disabled={!!editActionLoading}
                  onClick={() => onEditAction('deny')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                >
                  <LockKey size={14} />
                  {editActionLoading === 'deny' ? 'Denying…' : 'Deny Edit'}
                </button>
              </>
            )}
            {canDownloadSubmission({ status: viewData?.status ?? viewItem.status }) && (
              <button
                onClick={() => onExportPDF(viewItem)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors sm:flex-none shadow-sm shadow-indigo-100/50 dark:shadow-none active:scale-95"
              >
                <DownloadSimple size={17} /> PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors sm:flex-none text-center shadow-sm shadow-slate-200/50 dark:shadow-none active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
