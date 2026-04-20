import { MagnifyingGlass, FunnelSimple, X } from '@phosphor-icons/react';
import MultiSelect from '../../components/MultiSelect.jsx';

function FilterField({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function LogFilters({
  filters,
  searchDraft,
  onSearchDraftChange,
  onFiltersChange,
  actionOptions,
  entityTypeOptions,
  roleOptions,
  severityOptions,
  activeFilterCount,
  onClear,
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/80">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-dark-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
              <FunnelSimple size={16} className="text-slate-500 dark:text-slate-400" />
              Investigation Filters
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Filter by action, actor, entity, time window, or exact IP match.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-dark-border dark:text-slate-300">
                {activeFilterCount} active
              </span>
            )}
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-border/70"
            >
              <X size={14} />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="relative">
          <MagnifyingGlass size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchDraft}
            onChange={(event) => onSearchDraftChange(event.target.value)}
            placeholder="Search action keys, actor names, emails, or captured details…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Action">
          <MultiSelect
            options={actionOptions}
            selected={filters.action}
            onChange={(value) => onFiltersChange({ action: value })}
            placeholder="Any action"
          />
        </FilterField>

        <FilterField label="Entity Type">
          <MultiSelect
            options={entityTypeOptions}
            selected={filters.entityType}
            onChange={(value) => onFiltersChange({ entityType: value })}
            placeholder="Any entity"
          />
        </FilterField>

        <FilterField label="Actor Role">
          <MultiSelect
            options={roleOptions}
            selected={filters.role}
            onChange={(value) => onFiltersChange({ role: value })}
            placeholder="Any role"
          />
        </FilterField>

        <FilterField label="Severity">
          <MultiSelect
            options={severityOptions}
            selected={filters.severity}
            onChange={(value) => onFiltersChange({ severity: value })}
            placeholder="Any severity"
          />
        </FilterField>

        <FilterField label="From">
          <input
            type="date"
            value={filters.from ? filters.from.slice(0, 10) : ''}
            onChange={(event) => onFiltersChange({ from: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-slate-100"
          />
        </FilterField>

        <FilterField label="To">
          <input
            type="date"
            value={filters.to ? filters.to.slice(0, 10) : ''}
            onChange={(event) => onFiltersChange({ to: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-slate-100"
          />
        </FilterField>

        <FilterField label="IP Address">
          <input
            value={filters.ip}
            onChange={(event) => onFiltersChange({ ip: event.target.value })}
            placeholder="203.177.48.9"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-slate-100 dark:placeholder-slate-500"
          />
        </FilterField>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3 dark:border-dark-border dark:bg-dark-base/70">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Filter Notes
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            `Failed Login` entries can appear without a resolved actor because the email lookup may fail before an account is identified.
          </p>
        </div>
      </div>
    </section>
  );
}

export default LogFilters;
