import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Buildings, ChartBar, ChartDonut } from '@phosphor-icons/react';
import { ResponsivePie } from '@nivo/pie';
import { BAR_COLORS, DIVISION_COLORS, fadeUp } from './chartTheme.js';
import { QuarterlyStatusChart } from './QuarterlyStatusChart.jsx';
import { InfoTip } from './overviewHelpers.jsx';

const SECTION_ACCENTS = {
  SGOD: {
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-500/20',
    thisQ: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-400',
    count: 'text-indigo-700 dark:text-indigo-400',
  },
  CID: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20',
    thisQ: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-400',
    count: 'text-emerald-700 dark:text-emerald-400',
  },
  OSDS: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/20',
    thisQ: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-400',
    count: 'text-amber-700 dark:text-amber-400',
  },
};

function DivisionAipRow({ data }) {
  if (!data?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3 dark:border-dark-border/60">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Division</span>
      {data.map((s) => {
        const accent = SECTION_ACCENTS[s.key] ?? SECTION_ACCENTS.OSDS;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{s.label}</span>
            <span className={`text-[11px] font-black ${accent.count}`}>{s.withAip}/{s.totalPrograms}</span>
          </div>
        );
      })}
    </div>
  );
}

function DivisionRow({ sectionData }) {
  if (!sectionData?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3 dark:border-dark-border/60">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Division</span>
      {sectionData.map((s) => {
        const accent = SECTION_ACCENTS[s.key] ?? SECTION_ACCENTS.OSDS;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{s.label}</span>
            <span className={`text-[11px] font-black ${accent.count}`}>{s.total}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminOverviewCharts({ isDark, nivoTheme, pieData, quarterData, sectionData = [], divisionAipCompliance = [] }) {
  return (
    <>
      <Motion.div variants={fadeUp} className="flex items-center gap-4 px-1">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">Analytics</h2>
        <span className="h-px flex-1 bg-slate-200 dark:bg-dark-border/60" />
      </Motion.div>

      <Motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <ChartBar size={17} weight="bold" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">PIR Quarterly Progress</h3>
          </div>
          <QuarterlyStatusChart data={quarterData} />
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {Object.entries(BAR_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{key}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {Object.entries(DIVISION_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{key}</span>
              </div>
            ))}
          </div>
          <DivisionRow sectionData={sectionData} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ChartDonut size={17} weight="bold" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">AIP Compliance by Cluster</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <div style={{ height: 200, position: 'relative' }}>
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  innerRadius={0.62}
                  padAngle={2}
                  cornerRadius={4}
                  colors={{ datum: 'data.color' }}
                  theme={nivoTheme}
                  enableArcLinkLabels={false}
                  arcLabelsSkipAngle={20}
                  arcLabelsTextColor="#ffffff"
                  tooltip={({ datum }) => (
                    <div style={{
                      background: isDark ? '#262421' : '#ffffff',
                      border: `1px solid ${isDark ? '#413D37' : '#e2e8f0'}`,
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}>
                      <strong style={{ color: datum.color }}>{datum.label}</strong>
                      <div style={{ marginTop: 2, color: isDark ? '#94a3b8' : '#64748b' }}>
                        {datum.data.value}/{datum.data.total} schools ({datum.data.pct}%)
                      </div>
                    </div>
                  )}
                  animate
                  motionConfig="gentle"
                />
                {sectionData.length > 0 && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <ResponsivePie
                      data={sectionData.filter((s) => s.total > 0).map((s) => ({
                        id: s.key,
                        label: s.label,
                        value: s.total,
                        color: DIVISION_COLORS[s.key],
                      }))}
                      margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                      innerRadius={0.3}
                      outerRadius={0.55}
                      padAngle={3}
                      cornerRadius={3}
                      colors={{ datum: 'data.color' }}
                      theme={nivoTheme}
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={30}
                      arcLabelsTextColor="#ffffff"
                      tooltip={({ datum }) => (
                        <div style={{
                          background: isDark ? '#262421' : '#ffffff',
                          border: `1px solid ${isDark ? '#413D37' : '#e2e8f0'}`,
                          borderRadius: 10,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDark ? '#e2e8f0' : '#1e293b',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        }}>
                          <strong style={{ color: datum.color }}>{datum.label}</strong>
                          <div style={{ marginTop: 2, color: isDark ? '#94a3b8' : '#64748b' }}>
                            {datum.value} PIR{datum.value !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                      animate
                      motionConfig="gentle"
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                {pieData.map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">({item.value}/{item.total})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-52 items-center justify-center text-sm text-slate-400 dark:text-slate-600">No data</div>
          )}
          <DivisionAipRow data={divisionAipCompliance} />
        </div>
      </Motion.div>

      <Motion.div variants={fadeUp} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-surface sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Buildings size={17} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="text-sm font-black leading-tight text-slate-900 dark:text-slate-100">Division Sections</h3>
              <InfoTip text="PIR workload routed through each CES section this year. Pending = awaiting CES review. In Review = with Cluster Head or Admin. Based on assigned reviewer, falling back to program division." />
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
                >
                  <div className="flex items-start justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-black leading-tight text-slate-900 dark:text-slate-100">{section.label}</p>
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
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{section.pending}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-b border-slate-100 px-5 py-3 dark:border-dark-border/60">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">In Review</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{section.inReview}</span>
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
