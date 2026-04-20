import {
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  ArrowClockwise,
  WarningCircle,
} from '@phosphor-icons/react';
import { formatActorPrimary, formatActorSecondary, formatEntityPrimary, formatEntitySecondary, formatManilaTimestamp, formatOpenLogRef, getSeverityBadgeClass, getSourceBadgeClass } from './formatters.js';

function buildPageNumbers(page, totalPages) {
  if (totalPages <= 1) return [1];
  const numbers = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) {
    numbers.add(2);
    numbers.add(3);
  }
  if (page >= totalPages - 2) {
    numbers.add(totalPages - 1);
    numbers.add(totalPages - 2);
  }
  return [...numbers].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
}

function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const numbers = buildPageNumbers(page, totalPages);
  const start = total === 0 ? 0 : ((page - 1) * limit) + 1;
  const end = Math.min(total, page * limit);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-dark-border md:flex-row md:items-center md:justify-between print:hidden">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {start}-{end} of {total.toLocaleString()} event{total === 1 ? '' : 's'}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-dark-border"
        >
          <CaretLeft size={16} />
        </button>

        {numbers.map((value, index) => {
          const previous = numbers[index - 1];
          const showGap = previous && value - previous > 1;

          return (
            <div key={value} className="flex items-center gap-1">
              {showGap && <span className="px-1 text-sm text-slate-400">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(value)}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors ${
                  value === page
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-dark-border'
                }`}
              >
                {value}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-dark-border"
        >
          <CaretRight size={16} />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-dark-border dark:text-slate-300">
        <ClockCounterClockwise size={24} />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">No log entries matched</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Try widening the date range or clearing one of the active filters.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
        <WarningCircle size={24} weight="fill" />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Logs could not be loaded</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
      >
        <ArrowClockwise size={16} />
        Retry
      </button>
    </div>
  );
}

export function LogTable({
  rows,
  total,
  page,
  limit,
  loading,
  error,
  openRef,
  onOpenRow,
  onPageChange,
  onRetry,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasRows = rows.length > 0;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/80 print:rounded-none print:border-0 print:bg-white print:shadow-none">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-dark-border print:hidden">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Chronological Timeline</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ordered by newest first across audit and user activity sources.
          </p>
        </div>
        {loading && hasRows && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-dark-border dark:text-slate-300">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-600" />
            Refreshing
          </div>
        )}
      </div>

      {loading && !hasRows ? (
        <div className="flex items-center justify-center px-6 py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-600" />
        </div>
      ) : error && !hasRows ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : !hasRows ? (
        <EmptyState />
      ) : (
        <>
          {error && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
              {error}
            </div>
          )}

          <div className="md:hidden print:hidden">
            <div className="space-y-3 p-4">
              {rows.map((row) => {
                const isOpen = openRef === formatOpenLogRef(row);
                return (
                  <button
                    key={`${row.source}-${row.id}`}
                    type="button"
                    onClick={() => onOpenRow(row)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isOpen
                        ? 'border-indigo-300 bg-indigo-50/70 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/20'
                        : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:hover:bg-dark-border/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getSourceBadgeClass(row.source)}`}>
                        {row.source === 'admin' ? 'Admin Action' : 'User Activity'}
                      </span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getSeverityBadgeClass(row.severity)}`}>
                        {row.severity}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{row.action_label}</p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{row.action}</p>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Actor</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatActorPrimary(row.actor)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatActorSecondary(row.actor)}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Entity</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatEntityPrimary(row)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatEntitySecondary(row)}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Details</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.details_preview || 'No summary preview captured.'}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-dark-border dark:text-slate-400">
                      <span>{formatManilaTimestamp(row.created_at)}</span>
                      <span>{row.ip_address || 'No IP captured'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden overflow-x-auto print:block md:block">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-dark-base">
                <tr className="border-b border-slate-200 dark:border-dark-border">
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">When</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Action</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Actor</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Entity</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Summary</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {rows.map((row) => {
                  const isOpen = openRef === formatOpenLogRef(row);
                  return (
                    <tr
                      key={`${row.source}-${row.id}`}
                      onClick={() => onOpenRow(row)}
                      className={`cursor-pointer transition-colors ${
                        isOpen
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/20'
                          : 'bg-white/80 hover:bg-slate-50 dark:bg-dark-surface dark:hover:bg-dark-border/40'
                      }`}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {formatManilaTimestamp(row.created_at)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getSourceBadgeClass(row.source)}`}>
                              {row.source === 'admin' ? 'Admin' : 'User'}
                            </span>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getSeverityBadgeClass(row.severity)}`}>
                              {row.severity}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[16rem]">
                          <div className="font-black text-slate-900 dark:text-slate-100">{row.action_label}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.action}</div>
                          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{row.category}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[15rem]">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{formatActorPrimary(row.actor)}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatActorSecondary(row.actor)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[15rem]">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{formatEntityPrimary(row)}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatEntitySecondary(row)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[18rem] text-sm text-slate-600 dark:text-slate-300">
                          {row.details_preview || 'No summary preview captured.'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-slate-500 dark:text-slate-400">
                        {row.ip_address || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={onPageChange}
          />
        </>
      )}
    </section>
  );
}

export default LogTable;
