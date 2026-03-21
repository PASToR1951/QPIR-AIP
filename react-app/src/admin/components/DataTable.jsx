import React, { useState } from 'react';
import { ArrowUp, ArrowDown, CaretLeft, CaretRight } from '@phosphor-icons/react';

export const DataTable = ({
  columns,
  data,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  pageSize = 25,
  emptyMessage = 'No data found.',
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

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
        <table className="w-full text-sm">
          <thead>
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
                      sortDir === 'asc' ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />
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
                <tr key={row.id ?? i} className="bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-dark-border/30 transition-colors">
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

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border disabled:opacity-30 transition-colors">
              <CaretLeft size={16} />
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
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
