import { useCallback, useDeferredValue, useEffect, useMemo, useState, startTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowClockwise, DownloadSimple, FunnelSimple, ShieldWarning, CheckCircle, X } from '@phosphor-icons/react';
import { LogFilters } from './adminLogs/LogFilters.jsx';
import { LogTable } from './adminLogs/LogTable.jsx';
import { LogDetailDrawer } from './adminLogs/LogDetailDrawer.jsx';
import { ExportLogsModal } from './adminLogs/ExportLogsModal.jsx';
import { buildActionOptions, buildSeverityOptions, buildValueOptions, countActiveFilters, formatOpenLogRef, parseOpenLogRef } from './adminLogs/formatters.js';
import { useAdminLogsPage } from './adminLogs/useAdminLogsPage.js';

const LIST_LIMIT = 50;

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admin Actions' },
  { key: 'user', label: 'User Activity' },
  { key: 'critical', label: 'Critical' },
];

function parseListParam(value) {
  if (!value) return [];
  return [...new Set(String(value).split(',').map((item) => item.trim()).filter(Boolean))];
}

function parsePage(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function humanizeValue(value) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim() || 'Unknown';
}

function readFilters(searchParams) {
  const rawSource = searchParams.get('source');
  const source = rawSource === 'admin' || rawSource === 'user' ? rawSource : 'all';

  return {
    source,
    action: parseListParam(searchParams.get('action')),
    entityType: parseListParam(searchParams.get('entityType')),
    role: parseListParam(searchParams.get('role')),
    severity: parseListParam(searchParams.get('severity')),
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    ip: searchParams.get('ip') || '',
    q: searchParams.get('q') || '',
    page: parsePage(searchParams.get('page')),
    open: searchParams.get('open') || '',
  };
}

export default function AdminLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const deferredSearch = useDeferredValue(searchDraft);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  const patchSearchParams = useCallback((patch, { replace = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    const patchKeys = Object.keys(patch);

    if (!patchKeys.includes('open') && patchKeys.length > 0) {
      next.delete('open');
    }

    patchKeys.forEach((key) => {
      const value = patch[key];

      if (Array.isArray(value)) {
        if (value.length) next.set(key, value.join(','));
        else next.delete(key);
        return;
      }

      if (key === 'page') {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 1) next.delete(key);
        else next.set(key, String(numeric));
        return;
      }

      if (key === 'source') {
        if (!value || value === 'all') next.delete(key);
        else next.set(key, value);
        return;
      }

      const normalized = typeof value === 'string' ? value.trim() : value;
      if (!normalized) next.delete(key);
      else next.set(key, String(normalized));
    });

    startTransition(() => {
      setSearchParams(next, { replace });
    });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const normalized = deferredSearch.trim();
    if (normalized === filters.q) return;
    patchSearchParams({ q: normalized, page: 1 });
  }, [deferredSearch, filters.q, patchSearchParams]);

  useEffect(() => {
    if (!filters.open) return;
    if (parseOpenLogRef(filters.open)) return;
    patchSearchParams({ open: null });
  }, [filters.open, patchSearchParams]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const {
    rows,
    total,
    limit,
    loading,
    error,
    facets,
    catalog,
    detail,
    detailLoading,
    detailError,
    refresh,
    exportLogs,
  } = useAdminLogsPage(filters, { limit: LIST_LIMIT });

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const actionOptions = useMemo(
    () => buildActionOptions(facets.actions, catalog.actions),
    [facets.actions, catalog.actions],
  );
  const entityTypeOptions = useMemo(
    () => buildValueOptions(facets.entity_types, humanizeValue),
    [facets.entity_types],
  );
  const roleOptions = useMemo(
    () => buildValueOptions(facets.actor_roles, humanizeValue),
    [facets.actor_roles],
  );
  const severityOptions = useMemo(
    () => buildSeverityOptions(facets.severities),
    [facets.severities],
  );

  const activeTab = useMemo(() => {
    if (filters.source === 'admin') return 'admin';
    if (filters.source === 'user') return 'user';
    if (filters.severity.length === 1 && filters.severity[0] === 'critical') return 'critical';
    return 'all';
  }, [filters.source, filters.severity]);

  const handleFiltersChange = useCallback((patch) => {
    patchSearchParams({ ...patch, page: 1 });
  }, [patchSearchParams]);

  const handleTabChange = useCallback((tab) => {
    if (tab === 'all') {
      patchSearchParams({ source: 'all', severity: [], page: 1 });
      return;
    }
    if (tab === 'admin') {
      patchSearchParams({ source: 'admin', page: 1 });
      return;
    }
    if (tab === 'user') {
      patchSearchParams({ source: 'user', page: 1 });
      return;
    }
    patchSearchParams({ source: 'all', severity: ['critical'], page: 1 });
  }, [patchSearchParams]);

  const handleClear = useCallback(() => {
    setSearchDraft('');
    patchSearchParams({
      source: 'all',
      action: [],
      entityType: [],
      role: [],
      severity: [],
      from: '',
      to: '',
      ip: '',
      q: '',
      page: 1,
      open: null,
    });
  }, [patchSearchParams]);

  const handleOpenRow = useCallback((row) => {
    const nextOpen = formatOpenLogRef(row);
    patchSearchParams(
      { open: filters.open === nextOpen ? null : nextOpen },
      { replace: false },
    );
  }, [filters.open, patchSearchParams]);

  const handlePageChange = useCallback((page) => {
    patchSearchParams({ page }, { replace: false });
  }, [patchSearchParams]);

  const handleExport = useCallback(async (reason) => {
    await exportLogs(reason);
    setToast({ type: 'success', message: 'Admin logs export started.' });
  }, [exportLogs]);

  return (
    <>
      <div className="mx-auto flex max-w-[110rem] flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-[0_24px_80px_-30px_rgba(15,23,42,0.5)] print:hidden">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-100/90">
                <ShieldWarning size={14} />
                Admin Investigation Surface
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
                Admin Logs
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200/80">
                Review audit actions and user activity in one ordered timeline, then inspect each event in the drawer before exporting a redacted CSV snapshot.
              </p>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15 md:hidden"
                >
                  <FunnelSimple size={16} />
                  Filters
                </button>
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15"
                >
                  <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-900 transition-colors hover:bg-slate-100"
                >
                  <DownloadSimple size={16} />
                  Export CSV
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Matching Events</p>
                  <p className="mt-1 text-2xl font-black text-white">{total.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Active Filters</p>
                  <p className="mt-1 text-2xl font-black text-white">{activeFilterCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Page Size</p>
                  <p className="mt-1 text-2xl font-black text-white">{limit}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'border border-white/10 bg-white/10 text-slate-100 hover:bg-white/15'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <div className="hidden md:block print:hidden">
          <LogFilters
            filters={filters}
            searchDraft={searchDraft}
            onSearchDraftChange={setSearchDraft}
            onFiltersChange={handleFiltersChange}
            actionOptions={actionOptions}
            entityTypeOptions={entityTypeOptions}
            roleOptions={roleOptions}
            severityOptions={severityOptions}
            activeFilterCount={activeFilterCount}
            onClear={handleClear}
          />
        </div>

        <LogTable
          rows={rows}
          total={total}
          page={filters.page}
          limit={limit}
          loading={loading}
          error={error}
          openRef={filters.open}
          onOpenRow={handleOpenRow}
          onPageChange={handlePageChange}
          onRetry={refresh}
        />
      </div>

      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-[130] md:hidden print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[2rem] bg-slate-50 px-4 pb-5 pt-4 shadow-2xl dark:bg-dark-base"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Investigation Filters
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                    Refine the timeline on mobile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 dark:border-dark-border dark:bg-dark-surface dark:text-slate-300 dark:hover:bg-dark-border"
                >
                  <X size={18} />
                </button>
              </div>

              <LogFilters
                filters={filters}
                searchDraft={searchDraft}
                onSearchDraftChange={setSearchDraft}
                onFiltersChange={handleFiltersChange}
                actionOptions={actionOptions}
                entityTypeOptions={entityTypeOptions}
                roleOptions={roleOptions}
                severityOptions={severityOptions}
                activeFilterCount={activeFilterCount}
                onClear={handleClear}
              />

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LogDetailDrawer
        open={Boolean(filters.open)}
        row={detail}
        loading={detailLoading}
        error={detailError}
        onClose={() => patchSearchParams({ open: null }, { replace: false })}
      />

      <ExportLogsModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
      />

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg print:hidden ${
          toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300'
        }`}>
          <CheckCircle size={18} weight="fill" />
          {toast.message}
        </div>
      )}
    </>
  );
}
