import React from 'react';
import { PIR_QUARTERLY_KEYS, BAR_COLORS, DIVISION_KEYS, DIVISION_COLORS } from './chartTheme.js';
import { getQuarterTotal, getQuarterAxisMax } from './overviewHelpers.jsx';

export function QuarterlyStatusChart({ data, viewMode = 'status' }) {
  const axisMax = getQuarterAxisMax(data);
  const ticks = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0];
  const hasData = data.some((q) => getQuarterTotal(q) > 0);

  const keys = viewMode === 'status' ? PIR_QUARTERLY_KEYS : DIVISION_KEYS;
  const colors = viewMode === 'status' ? BAR_COLORS : DIVISION_COLORS;

  return (
    <div className="h-[220px] pt-1">
      <div className="flex h-[184px] gap-2">
        <div className="w-8 flex flex-col justify-between pb-8 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 tabular-nums">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 bottom-8 top-0">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute left-0 right-0 border-t border-slate-200 dark:border-dark-border/70"
                style={{ bottom: `${(tick / axisMax) * 100}%` }}
              />
            ))}
          </div>
          {!hasData && (
            <div className="absolute inset-x-0 bottom-8 top-0 flex items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-500">
              No PIR submissions yet
            </div>
          )}
          <div className="absolute inset-0 z-10 flex items-stretch justify-around gap-2 px-2 sm:px-4">
            {data.map((quarter) => {
              const total = getQuarterTotal(quarter);
              const heightPct = total > 0 ? Math.max((total / axisMax) * 100, 4) : 0;

              return (
                <div key={quarter.name} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="relative flex min-h-0 w-full flex-1 items-end justify-center">
                    <div
                      className="flex w-full max-w-[52px] flex-col-reverse overflow-hidden rounded-md bg-slate-100 dark:bg-dark-border/40 shadow-sm ring-1 ring-slate-200/70 dark:ring-dark-border/70"
                      style={{ height: `${heightPct}%`, opacity: total > 0 ? 1 : 0 }}
                    >
                      {keys.map((key) => {
                        const value = quarter[key] ?? 0;
                        if (value <= 0 || total <= 0) return null;
                        return (
                          <span
                            key={key}
                            title={`${quarter.name} ${key}: ${value}`}
                            style={{ height: `${(value / total) * 100}%`, background: colors[key] }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="h-7 text-center leading-tight">
                    <p className="text-[11px] font-black text-slate-600 dark:text-slate-300">{quarter.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">{total}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
