import React from 'react';
import { motion as Motion } from 'framer-motion';
import { ChartBar, ChartDonut } from '@phosphor-icons/react';
import { ResponsivePie } from '@nivo/pie';
import { BAR_COLORS, fadeUp } from './chartTheme.js';
import { QuarterlyStatusChart } from './QuarterlyStatusChart.jsx';

export function AdminOverviewCharts({ isDark, nivoTheme, pieData, quarterData }) {
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
              <div style={{ height: 200 }}>
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
        </div>
      </Motion.div>
    </>
  );
}
