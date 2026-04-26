import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  ArrowRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  ClockCounterClockwise,
  Notification,
} from '@phosphor-icons/react';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { fadeUp } from './chartTheme.js';
import { relativeTime, InfoTip } from './overviewHelpers.jsx';
import { PirClusterPanel } from './PirClusterPanel.jsx';

const RECENT_SUBMISSIONS_PAGE_SIZE = 10;

function TruncatedCellText({ value, className = '' }) {
  const text = value || '—';

  return (
    <span className={`block truncate ${className}`} title={text}>
      {text}
    </span>
  );
}

function formatQuarterLabel(quarter) {
  if (!quarter) return 'Annual';

  const text = String(quarter);
  const existingShortLabel = text.match(/\bQ([1-4])\b/i);
  if (existingShortLabel) return `Q${existingShortLabel[1]}`;

  const ordinalQuarter = text.match(/\b([1-4])(?:st|nd|rd|th)\s+Quarter\b/i);
  if (ordinalQuarter) return `Q${ordinalQuarter[1]}`;

  const numericQuarter = text.match(/\bQuarter\s*([1-4])\b/i);
  if (numericQuarter) return `Q${numericQuarter[1]}`;

  return text;
}

function getSubmissionOwner(submission) {
  const schoolOwner = submission.school && submission.school !== 'Division'
    ? submission.school
    : null;
  return submission.owner || schoolOwner || submission.submittedBy || submission.school || '—';
}

function getDocumentTypeTextClass(type) {
  if (type === 'PIR') return 'text-blue-700 dark:text-blue-300';
  if (type === 'AIP') return 'text-pink-700 dark:text-pink-300';
  return 'text-slate-700 dark:text-slate-100';
}

export function AdminOverviewPanels({
  clusterSort,
  currentQuarter,
  data,
  navigate,
  setClusterSort,
  sortedClusters,
}) {
  const [recentSubmissionPage, setRecentSubmissionPage] = useState(1);
  const recentSubmissions = data?.recentSubmissions ?? [];
  const recentSubmissionTotalPages = Math.max(
    1,
    Math.ceil(recentSubmissions.length / RECENT_SUBMISSIONS_PAGE_SIZE),
  );
  const recentSubmissionCurrentPage = Math.min(recentSubmissionPage, recentSubmissionTotalPages);
  const recentSubmissionStart = (recentSubmissionCurrentPage - 1) * RECENT_SUBMISSIONS_PAGE_SIZE;
  const paginatedRecentSubmissions = recentSubmissions.slice(
    recentSubmissionStart,
    recentSubmissionStart + RECENT_SUBMISSIONS_PAGE_SIZE,
  );
  const openSubmission = (submission) => {
    const submissionType = submission.type?.toLowerCase();
    const documentRef = submission.ref ?? submission.id;
    if (submissionType === 'pir') {
      navigate(`/admin/pirs/${documentRef}`);
      return;
    }

    const params = new URLSearchParams({
      type: submissionType || 'aip',
      review: String(documentRef),
    });
    navigate(`/admin/submissions?${params}`, {
      state: submission.year ? { filters: { year: submission.year } } : undefined,
    });
  };
  const handleSubmissionRowKeyDown = (event, submission) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openSubmission(submission);
  };

  return (
    <Motion.div variants={fadeUp} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      {data?.pirClusterStatus?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <Notification size={17} weight="bold" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Q{currentQuarter} PIR Status by Cluster</h3>
              <InfoTip text="Shows how many PIRs each school has submitted this quarter vs the total number of programs they are required to implement." />
            </div>
            <button
              onClick={() => setClusterSort((previous) => (previous === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {clusterSort === 'desc' ? 'Highest' : 'Lowest'} first
              <span className="flex flex-col -space-y-1">
                <CaretUp size={10} weight="bold" className={clusterSort === 'asc' ? 'text-indigo-500' : 'opacity-30'} />
                <CaretDown size={10} weight="bold" className={clusterSort === 'desc' ? 'text-indigo-500' : 'opacity-30'} />
              </span>
            </button>
          </div>
          <div className="space-y-3">
            {sortedClusters.map((cluster) => (
              <PirClusterPanel key={cluster.id} cluster={cluster} navigate={navigate} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ClockCounterClockwise size={17} weight="bold" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Recent Submissions</h3>
          </div>
          <button
            onClick={() => navigate('/admin/submissions')}
            className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View All
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
        {recentSubmissions.length > 0 ? (
          <div>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-dark-border">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[34%]" />
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 dark:border-dark-border dark:bg-dark-base">
                    <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Owner</th>
                    <th className="hidden px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-200 sm:table-cell">Program</th>
                    <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Details</th>
                    <th className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {paginatedRecentSubmissions.map((submission) => {
                    const owner = getSubmissionOwner(submission);
                    const ownerType = submission.ownerType && submission.ownerType !== 'School'
                      ? submission.ownerType
                      : null;

                    return (
                      <tr
                        key={`${submission.type}-${submission.ref ?? submission.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => openSubmission(submission)}
                        onKeyDown={(event) => handleSubmissionRowKeyDown(event, submission)}
                        className="cursor-pointer bg-white transition-colors hover:bg-indigo-50/50 focus:bg-indigo-50/50 focus:outline-none dark:bg-dark-surface dark:hover:bg-dark-base dark:focus:bg-dark-base"
                        aria-label={`Review ${submission.type} submission for ${owner}`}
                      >
                        <td className="min-w-0 px-3 py-3 font-black text-slate-900 dark:text-slate-100">
                          <TruncatedCellText value={owner} />
                          {ownerType && (
                            <TruncatedCellText
                              value={ownerType}
                              className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300"
                            />
                          )}
                          <TruncatedCellText
                            value={submission.program}
                            className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300 sm:hidden"
                          />
                        </td>
                        <td className="hidden min-w-0 px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 sm:table-cell">
                          <TruncatedCellText value={submission.program} />
                        </td>
                      <td className="px-3 py-3">
                          <div className="flex min-w-0 flex-col items-start gap-1.5">
                            <span className="inline-flex max-w-full items-center overflow-hidden rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-black dark:bg-dark-border">
                              <span className={`truncate ${getDocumentTypeTextClass(submission.type)}`}>
                                {submission.type}
                              </span>
                              <span className="px-1 text-slate-400 dark:text-slate-500">•</span>
                              <span
                                className="truncate text-slate-700 dark:text-slate-100"
                                title={submission.quarter ?? 'Annual'}
                              >
                                {formatQuarterLabel(submission.quarter)}
                              </span>
                            </span>
                            <span
                              className="block max-w-full truncate rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300"
                              title={new Date(submission.submitted).toLocaleString('en-PH', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            >
                              {relativeTime(submission.submitted)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span title={submission.status}>
                            <StatusBadge status={submission.status} size="xs" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {recentSubmissions.length > RECENT_SUBMISSIONS_PAGE_SIZE && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Showing {recentSubmissionStart + 1}–{Math.min(recentSubmissionStart + RECENT_SUBMISSIONS_PAGE_SIZE, recentSubmissions.length)} of {recentSubmissions.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRecentSubmissionPage((page) => Math.max(1, page - 1))}
                    disabled={recentSubmissionCurrentPage === 1}
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-dark-border"
                    aria-label="Previous recent submissions page"
                  >
                    <CaretLeft size={18} />
                  </button>
                  {Array.from({ length: recentSubmissionTotalPages }, (_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setRecentSubmissionPage(page)}
                        className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${page === recentSubmissionCurrentPage ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-border'}`}
                        aria-current={page === recentSubmissionCurrentPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setRecentSubmissionPage((page) => Math.min(recentSubmissionTotalPages, page + 1))}
                    disabled={recentSubmissionCurrentPage === recentSubmissionTotalPages}
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-dark-border"
                    aria-label="Next recent submissions page"
                  >
                    <CaretRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-600">No submissions yet.</p>
        )}
      </div>
    </Motion.div>
  );
}
