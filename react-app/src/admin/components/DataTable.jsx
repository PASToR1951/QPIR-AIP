import React, { useState } from 'react';
import { ArrowUp, ArrowDown, CaretLeft, CaretRight } from '@phosphor-icons/react';

export const DataTable = ({
  columns,
  data,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  getRowClassName,
  pageSize = 25,
  emptyMessage = 'No data found.',
  fillHeight = false,
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const allSelected = pageData.length > 0 && pageData.every(r => selectedIds.includes(r.id));
  const toggleAll = () => {
    if (allSelected) onSelectChange?.(selectedIds.filter(id => !pageData.find(r => r.id === id)));
    else onSelectChange?.([...new Set([...selectedIds, ...pageData.map(r => r.id)])]);
  };
  const toggleRow = (id) => {
    onSelectChange?.(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };

  // Detect primary column (first) and actions column (last with label "Actions")
  const primaryCol = columns[0];
  const actionsCol = columns.find(c => c.label === 'Actions');
  const bodyColumns = columns.filter(c => c !== primaryCol && c !== actionsCol);

  const Pagination = () => sorted.length > pageSize ? (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 text-sm">
      <span className="text-slate-500 dark:text-slate-400">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border disabled:opacity-30 transition-colors">
          <CaretLeft size={18} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pg = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
          if (pg < 1 || pg > totalPages) return null;
          return (
            <button key={pg} onClick={() => setPage(pg)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${pg === page ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}>
              {pg}
            </button>
          );
        })}
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border disabled:opacity-30 transition-colors">
          <CaretRight size={18} />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* ── Card view (mobile, < md) ─────────────────────────────── */}
      <div className={`md:hidden ${fillHeight ? 'flex flex-col h-full' : ''}`}>
        <div className={fillHeight ? 'flex-1 min-h-0 overflow-y-auto' : ''}>
          {pageData.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-600 font-bold">{emptyMessage}</div>
          ) : (
            <div className="space-y-2">
              {pageData.map((row, i) => (
                <div
                  key={row.id ?? i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-3 transition-colors ${onRowClick ? 'cursor-pointer active:bg-slate-50 dark:active:bg-dark-border/30' : ''} ${getRowClassName ? getRowClassName(row) : ''}`}
                >
                  {/* Header: checkbox + primary value + actions */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {selectable && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                        />
                      )}
                      <div className="min-w-0 truncate">
                        {primaryCol.render
                          ? primaryCol.render(row[primaryCol.key], row)
                          : <span className="font-bold text-slate-900 dark:text-slate-100">{row[primaryCol.key]}</span>
                        }
                      </div>
                    </div>
                    {actionsCol && (
                      <div onClick={e => e.stopPropagation()} className="shrink-0">
                        {actionsCol.render(row[actionsCol.key], row)}
                      </div>
                    )}
                  </div>

                  {/* Body fields in a 2-col grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {bodyColumns.map(col => (
                      <div key={col.key} className={col.cardFullWidth ? 'col-span-2' : ''}>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                          {col.label}
                        </div>
                        <div>
                          {col.render
                            ? col.render(row[col.key], row)
                            : <span className="text-sm text-slate-600 dark:text-slate-400">{row[col.key] ?? '—'}</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Pagination />
      </div>

      {/* ── Table view (desktop, md+) ────────────────────────────── */}
      <div className={`hidden md:flex flex-col ${fillHeight ? 'h-full' : ''}`}>
        <div className={`overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border ${fillHeight ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border">
                {selectable && (
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    className={`px-4 py-3 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[11px] whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''} ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ArrowUp size={14} weight="bold" /> : <ArrowDown size={14} weight="bold" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border tabular-nums">
              {pageData.length === 0 ? (
                <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-10 text-center text-slate-400 dark:text-slate-600 font-bold">{emptyMessage}</td></tr>
              ) : (
                pageData.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onMouseEnter={onRowMouseEnter ? (e) => onRowMouseEnter(row, e) : undefined}
                    onMouseLeave={onRowMouseLeave ?? undefined}
                    className={`bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-dark-border/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${getRowClassName ? getRowClassName(row) : ''}`}
                  >
                    {selectable && (
                      <td className="px-4 py-3 w-10">
                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleRow(row.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} className={`px-4 py-3 text-slate-600 dark:text-slate-400 ${col.cellClassName || ''}`}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </>
  );
};

export default DataTable;
