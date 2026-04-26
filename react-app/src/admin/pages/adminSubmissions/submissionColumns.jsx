import React from 'react';
import { Eye, Check, ArrowBendUpLeft, DownloadSimple } from '@phosphor-icons/react';
import { withResponsiveHide } from '../../components/dataTableColumns.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';
import { relativeDate } from '../../../lib/dateUtils.js';

export function buildSubmissionColumns({
  navigate,
  onView, onApprove, onReturn, onExportPDF,
  pdfLoadingId, setPdfLoadingId,
  canChangeSubmissionStatus, canDownloadSubmission,
}) {
  function renderOwnerCell(value, row) {
    if (!row.schoolId) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <img src="/Division_Logo.webp" alt="Division Logo" style={{ width: 28, height: 28 }}
            className="object-contain shrink-0 rounded-full border border-slate-200 dark:border-dark-border bg-transparent" />
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-slate-100">{row.submittedBy}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.program}</div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 min-w-0">
        <SchoolAvatar
          clusterNumber={row.clusterNumber}
          schoolLogo={row.schoolLogo ?? null}
          clusterLogo={row.clusterLogo ?? null}
          name={value}
          size={28}
          className="shrink-0"
        />
        <div className="min-w-0">
          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{value}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.program}</div>
        </div>
      </div>
    );
  }

  return withResponsiveHide([
    { key: 'school',        label: 'Owner',         sortable: true, render: renderOwnerCell },
    { key: 'cluster',       label: 'Cluster',       sortable: true, render: v => <span className="text-xs font-bold bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">{v}</span> },
    { key: 'program',       label: 'Program',       sortable: true, cardFullWidth: true, render: v => <span className="truncate max-w-[180px] block text-slate-600 dark:text-slate-400">{v}</span> },
    { key: 'type',          label: 'Type',          render: v => <StatusBadge status={v} size="xs" /> },
    { key: 'quarter',       label: 'Quarter',       render: v => <span className="text-xs text-slate-500 dark:text-slate-400">{v ?? '—'}</span> },
    { key: 'year',          label: 'Year',          sortable: true },
    { key: 'dateSubmitted', label: 'Date Submitted', sortable: true, render: v => <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{relativeDate(v)}</span> },
    { key: 'submittedBy',   label: 'Submitted By',  render: v => <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px] block">{v}</span> },
    { key: 'status',        label: 'Status',        render: v => <StatusBadge status={v} size="xs" /> },
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => row.type === 'PIR' ? navigate(`/admin/pirs/${row.id}`) : onView(row)}
            title={row.type === 'PIR' ? 'Review PIR' : 'View'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <Eye size={17} />
            <span className="hidden sm:inline text-xs font-medium">View</span>
          </button>
          {canChangeSubmissionStatus(row) && (
            <button onClick={() => onApprove(row)} title="Approve"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
              <Check size={17} />
              <span className="hidden sm:inline text-xs font-medium">Approve</span>
            </button>
          )}
          {canChangeSubmissionStatus(row) && (
            <button onClick={() => onReturn(row)} title="Return"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
              <ArrowBendUpLeft size={17} />
              <span className="hidden sm:inline text-xs font-medium">Return</span>
            </button>
          )}
          {/* Bug fix: pass row directly so handleExportPDF isn't affected by stale viewItem state.
              pdfLoadingId guards against multiple simultaneous export clicks. */}
          {canDownloadSubmission(row) && (
            <button
              disabled={pdfLoadingId === row.id}
              onClick={async () => {
                setPdfLoadingId(row.id);
                try {
                  await onView(row);
                  await new Promise(r => setTimeout(r, 500));
                  await onExportPDF(row);
                } finally {
                  setPdfLoadingId(null);
                }
              }}
              title="Download PDF"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <DownloadSimple size={17} />
              <span className="hidden sm:inline text-xs font-medium">Export</span>
            </button>
          )}
        </div>
      ),
    },
  ], {
    lg: ['cluster', 'quarter', 'year', 'dateSubmitted'],
    xl: ['program', 'submittedBy'],
  });
}
