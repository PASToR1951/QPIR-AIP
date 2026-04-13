import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';

export function ComplianceToolbar({
  search,
  setSearch,
  filter,
  setFilter,
  sort,
  setSort,
  viewMode,
  setViewMode,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search schools…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {[{ key: 'all', label: 'All' }, { key: 'missing', label: 'Non-Compliant' }, { key: 'compliant', label: 'Fully Compliant' }].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${filter === item.key ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-border'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {[{ key: 'name', label: 'Name' }, { key: 'rate-asc', label: 'Worst First' }].map((item) => (
          <button
            key={item.key}
            onClick={() => setSort(item.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${sort === item.key ? 'bg-slate-200 text-slate-700 dark:bg-dark-border dark:text-slate-200' : 'text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-dark-border/50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-0.5 rounded-xl bg-slate-100 p-0.5 dark:bg-dark-border">
        {[{ key: 'summary', label: 'Summary' }, { key: 'matrix', label: 'Matrix' }].map((item) => (
          <button
            key={item.key}
            onClick={() => setViewMode(item.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === item.key ? 'bg-white text-slate-700 shadow-sm dark:bg-dark-surface dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
