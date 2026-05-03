import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Buildings, ChartBar, ChartDonut, ArrowRight } from '@phosphor-icons/react';
import { BAR_COLORS, DIVISION_COLORS, PIR_QUARTERLY_KEYS, DIVISION_KEYS, fadeUp } from './chartTheme.js';
import { QuarterlyStatusChart } from './QuarterlyStatusChart.jsx';
import { InfoTip } from './overviewHelpers.jsx';

const SECTION_ACCENTS = {
  SGOD: {
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-500/20',
    thisQ: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-400',
    count: 'text-indigo-700 dark:text-indigo-400',
    bar: '#6366f1',
    headerBg: 'bg-indigo-50/60 dark:bg-indigo-950/20',
    label: 'text-indigo-700 dark:text-indigo-300',
  },
  CID: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20',
    thisQ: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-400',
    count: 'text-emerald-700 dark:text-emerald-400',
    bar: '#10b981',
    headerBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
  OSDS: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/20',
    thisQ: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-400',
    count: 'text-amber-700 dark:text-amber-400',
    bar: '#f59e0b',
    headerBg: 'bg-amber-50/60 dark:bg-amber-950/20',
    label: 'text-amber-700 dark:text-amber-300',
  },
};

function statusBadge(pct) {
  if (pct >= 100) return { label: 'All Filed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20' };
  if (pct > 0)    return { label: 'Partial',   cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/20' };
  return            { label: 'None',      cls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-500/20' };
}

function pctColor(pct) {
  if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function TabToggle({ value, onChange, options }) {
  return (
    <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-dark-border/40">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
            value === opt.value
              ? 'bg-white text-indigo-700 shadow-sm dark:bg-dark-surface dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ClusterRow({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full min-h-0 w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/30"
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
      <span className="w-[4.25rem] shrink-0 truncate text-[11px] font-bold leading-none text-slate-600 dark:text-slate-300">{item.label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <div className="relative flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-dark-border/50 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${item.pct ?? 0}%`, background: item.color }}
          />
        </div>
        <span className="w-8 shrink-0 text-right text-[10px] font-bold leading-none text-slate-400 dark:text-slate-500 tabular-nums">
          {item.value}/{item.total}
        </span>
      </div>
      <ArrowRight
        size={11}
        weight="bold"
        className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
      />
    </button>
  );
}

function DivisionRow({ item, onClick }) {
  const accent = SECTION_ACCENTS[item.key] ?? SECTION_ACCENTS.OSDS;
  const badge = statusBadge(item.pct ?? 0);
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/30"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accent.dot}`} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{item.label}</span>
        <span className="truncate text-[9px] text-slate-400 dark:text-slate-500">{item.full}</span>
      </div>
      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${badge.cls}`}>
        {badge.label}
      </span>
      <span className={`shrink-0 text-[11px] font-black tabular-nums ${pctColor(item.pct ?? 0)}`}>
        {item.withAip}/{item.totalPrograms}
      </span>
      <ArrowRight
        size={13}
        weight="bold"
        className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
      />
    </button>
  );
}

export function AdminOverviewCharts({ pieData, quarterData, trimesterData = [], sectionData = [], divisionAipCompliance = [], navigate }) {
  const [viewMode, setViewMode] = useState('status');
  const [periodView, setPeriodView] = useState('quarters');
  const [aipView, setAipView] = useState('cluster');

  const legendKeys = viewMode === 'status' ? PIR_QUARTERLY_KEYS : DIVISION_KEYS;
  const legendColors = viewMode === 'status' ? BAR_COLORS : DIVISION_COLORS;
  const periodData = periodView === 'trimesters' ? trimesterData : quarterData;

  const handleClusterClick = (item) => {
    const params = new URLSearchParams({
      type: 'aip',
      cluster: String(item.clusterId),
    });
    navigate(`/admin/submissions?${params}`);
  };

  const handleDivisionClick = () => {
    navigate('/admin/submissions?type=aip');
  };

  return (
    <>
      <Motion.div variants={fadeUp} className="flex items-center gap-4 px-1">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">Analytics</h2>
        <span className="h-px flex-1 bg-slate-200 dark:bg-dark-border/60" />
      </Motion.div>

      <Motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* PIR Quarterly Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <ChartBar size={17} weight="bold" />
            </div>
            <h3 className="flex-1 text-sm font-black text-slate-900 dark:text-slate-100">
              PIR {periodView === 'trimesters' ? 'Trimester' : 'Quarterly'} Progress
            </h3>
            <TabToggle
              value={periodView}
              onChange={setPeriodView}
              options={[{ value: 'quarters', label: 'Quarters' }, { value: 'trimesters', label: 'Trimesters' }]}
            />
            <TabToggle
              value={viewMode}
              onChange={setViewMode}
              options={[{ value: 'status', label: 'By Status' }, { value: 'division', label: 'By Division' }]}
            />
          </div>
          <div>
            <QuarterlyStatusChart data={periodData} viewMode={viewMode} />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {legendKeys.map((key) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: legendColors[key] }} />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AIP Compliance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ChartDonut size={17} weight="bold" />
            </div>
            <h3 className="flex-1 text-sm font-black text-slate-900 dark:text-slate-100">AIP Filed</h3>
            <TabToggle
              value={aipView}
              onChange={setAipView}
              options={[{ value: 'cluster', label: 'Cluster' }, { value: 'division', label: 'Division' }]}
            />
          </div>

          {aipView === 'cluster' ? (
            pieData.length > 0 ? (
              <div className="h-[220px] overflow-hidden -mx-1 px-1">
                <div
                  className="grid h-full gap-0.5"
                  style={{ gridTemplateRows: `repeat(${pieData.length}, minmax(0, 1fr))` }}
                >
                  {pieData.map((item) => (
                    <ClusterRow key={item.id} item={item} onClick={() => handleClusterClick(item)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400 dark:text-slate-600">No data</div>
            )
          ) : (
            divisionAipCompliance.length > 0 ? (
              <div className="h-[220px] overflow-y-auto -mx-1 px-1">
                <div className="flex flex-col gap-0.5">
                  {divisionAipCompliance.map((item) => (
                    <DivisionRow key={item.key} item={item} onClick={handleDivisionClick} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400 dark:text-slate-600">No data</div>
            )
          )}

          <p className="mt-3 border-t border-slate-100 pt-3 text-[9px] text-slate-400 dark:border-dark-border/60 dark:text-slate-500">
            Click a row to view its AIP submissions
          </p>
        </div>
      </Motion.div>

      {/* Division Sections */}
      <Motion.div variants={fadeUp} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-surface sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Buildings size={17} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="text-sm font-black leading-tight text-slate-900 dark:text-slate-100">Division Sections</h3>
              <InfoTip text="PIR workload routed through each CES section this year. Pending = awaiting CES review. In Review = currently opened by a reviewer. Based on assigned reviewer, falling back to program division." />
            </div>
          </div>
        </div>
        {sectionData.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sectionData.map((section) => {
              const accent = SECTION_ACCENTS[section.key] ?? SECTION_ACCENTS.OSDS;
              return (
                <div
                  key={section.key}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-dark-border dark:bg-dark-surface"
                  style={{ borderTopWidth: '3px', borderTopColor: accent.bar }}
                >
                  <div className={`flex items-start justify-between px-5 py-4 ${accent.headerBg}`}>
                    <div>
                      <p className={`text-sm font-black leading-tight ${accent.label}`}>{section.label}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{section.full}</p>
                      <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {section.programCount} program{section.programCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${accent.badge}`}>
                      {section.total} PIR{section.total === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 border-t border-slate-100 dark:border-dark-border/60">
                    <div className="flex flex-col gap-0.5 border-r border-b border-slate-100 px-5 py-3 dark:border-dark-border/60">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pending</span>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 normal-case tracking-normal">awaiting CES review</span>
                      <span className="mt-0.5 text-xl font-black text-slate-800 dark:text-slate-100">{section.pending}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-b border-slate-100 px-5 py-3 dark:border-dark-border/60">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">In Review</span>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 normal-case tracking-normal">with reviewer</span>
                      <span className="mt-0.5 text-xl font-black text-slate-800 dark:text-slate-100">{section.inReview}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-r border-slate-100 px-5 py-3 dark:border-dark-border/60">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Approved</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{section.approved}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 px-5 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Returned</span>
                      <span className="text-xl font-black text-rose-600 dark:text-rose-400">{section.returned}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-dark-border/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Activity this quarter</span>
                    <span className={`text-xs font-black ${accent.thisQ}`}>+{section.thisQuarter}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center text-sm text-slate-400 dark:text-slate-600">No PIR routing data yet</div>
        )}
      </Motion.div>
    </>
  );
}
