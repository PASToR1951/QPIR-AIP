// server/lib/termConfig.ts
// Pure utility module — no I/O, no DB access.
// Defines all three term structures and exports helper functions used by
// both admin.ts and data.ts.

export type TermType = "Trimester" | "Quarterly" | "Bimester";

export interface PeriodDef {
  number: number;               // 1-based
  prefix: string;               // "T", "Q", or "B"
  ordinal: string;              // "1st", "2nd", etc.
  startMonth: number;           // 1=Jan … 12=Dec (inclusive)
  endMonth: number;             // 1=Jan … 12=Dec (inclusive, may wrap past Dec)
  defaultDeadlineMonth: number; // 0-indexed (JS Date convention)
  defaultDeadlineDay: number;
  defaultDeadlineYearRef: "start" | "end"; // which SY year the deadline falls in
}

export interface TermConfig {
  type: TermType;
  termNoun: string;      // "Trimester" | "Quarter" | "Bimester"
  periodPrefix: string;  // "T" | "Q" | "B"
  yearFormat: "SY" | "CY";
  periods: PeriodDef[];
}

// ─── Static configs ───────────────────────────────────────────────────────────

const TRIMESTER_CONFIG: TermConfig = {
  type: "Trimester",
  termNoun: "Trimester",
  periodPrefix: "T",
  yearFormat: "SY",
  periods: [
    { number: 1, prefix: "T", ordinal: "1st", startMonth: 6,  endMonth: 9,  defaultDeadlineMonth: 8,  defaultDeadlineDay: 15, defaultDeadlineYearRef: "start" },
    { number: 2, prefix: "T", ordinal: "2nd", startMonth: 10, endMonth: 12, defaultDeadlineMonth: 11, defaultDeadlineDay: 31, defaultDeadlineYearRef: "start" },
    { number: 3, prefix: "T", ordinal: "3rd", startMonth: 1,  endMonth: 3,  defaultDeadlineMonth: 2,  defaultDeadlineDay: 31, defaultDeadlineYearRef: "end"   },
  ],
};

const QUARTERLY_CONFIG: TermConfig = {
  type: "Quarterly",
  termNoun: "Quarter",
  periodPrefix: "Q",
  yearFormat: "SY",
  periods: [
    { number: 1, prefix: "Q", ordinal: "1st", startMonth: 1,  endMonth: 3,  defaultDeadlineMonth: 2,  defaultDeadlineDay: 31, defaultDeadlineYearRef: "end"   },
    { number: 2, prefix: "Q", ordinal: "2nd", startMonth: 4,  endMonth: 6,  defaultDeadlineMonth: 5,  defaultDeadlineDay: 30, defaultDeadlineYearRef: "start" },
    { number: 3, prefix: "Q", ordinal: "3rd", startMonth: 7,  endMonth: 9,  defaultDeadlineMonth: 8,  defaultDeadlineDay: 30, defaultDeadlineYearRef: "start" },
    { number: 4, prefix: "Q", ordinal: "4th", startMonth: 10, endMonth: 12, defaultDeadlineMonth: 11, defaultDeadlineDay: 31, defaultDeadlineYearRef: "start" },
  ],
};

const BIMESTER_CONFIG: TermConfig = {
  type: "Bimester",
  termNoun: "Bimester",
  periodPrefix: "B",
  yearFormat: "SY",
  periods: [
    { number: 1, prefix: "B", ordinal: "1st", startMonth: 6,  endMonth: 10, defaultDeadlineMonth: 9,  defaultDeadlineDay: 31, defaultDeadlineYearRef: "start" },
    { number: 2, prefix: "B", ordinal: "2nd", startMonth: 11, endMonth: 3,  defaultDeadlineMonth: 2,  defaultDeadlineDay: 31, defaultDeadlineYearRef: "end"   },
  ],
};

const CONFIGS: Record<TermType, TermConfig> = {
  Trimester: TRIMESTER_CONFIG,
  Quarterly: QUARTERLY_CONFIG,
  Bimester:  BIMESTER_CONFIG,
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getTermConfig(type: TermType): TermConfig {
  return CONFIGS[type] ?? TRIMESTER_CONFIG;
}

/** Returns SY start/end years for a given date. SY starts in June. */
export function getSYBounds(date: Date): { start: number; end: number } {
  const month = date.getMonth() + 1;
  const year  = date.getFullYear();
  return month >= 6 ? { start: year, end: year + 1 } : { start: year - 1, end: year };
}

/** Returns true if the given calendar month falls within a period definition.
 *  Handles wrap-around periods (e.g. B2: Nov–Mar crosses the year boundary). */
function periodContainsMonth(p: PeriodDef, month: number): boolean {
  if (p.startMonth <= p.endMonth) {
    return month >= p.startMonth && month <= p.endMonth;
  }
  // Wrap-around: e.g. startMonth=11, endMonth=3
  return month >= p.startMonth || month <= p.endMonth;
}

/** Returns the current period number (1-based) for the given config and date.
 *  Falls back to the last period for off-cycle months (e.g. April/May in Trimester). */
export function getCurrentPeriod(config: TermConfig, date: Date): number {
  const month = date.getMonth() + 1;
  for (const p of config.periods) {
    if (periodContainsMonth(p, month)) return p.number;
  }
  return config.periods[config.periods.length - 1].number;
}

/** Builds the full label stored in PIR.quarter.
 *  e.g. "1st Trimester SY 2025-2026", "3rd Quarter SY 2025-2026", "1st Bimester SY 2025-2026" */
export function getPeriodLabel(config: TermConfig, period: number, syStart: number): string {
  const p = config.periods.find(pd => pd.number === period);
  if (!p) throw new Error(`Period ${period} not found in ${config.type} config`);
  const syEnd = syStart + 1;
  if (config.yearFormat === "SY") {
    return `${p.ordinal} ${config.termNoun} SY ${syStart}-${syEnd}`;
  }
  return `${p.ordinal} ${config.termNoun} CY ${syStart}`;
}

/** Returns true if an activity's month range overlaps with the given period.
 *  Handles wrap-around periods correctly. */
export function activityOverlapsPeriod(
  config: TermConfig,
  startMonth: number,
  endMonth: number,
  period: number,
): boolean {
  const p = config.periods.find(pd => pd.number === period);
  if (!p) return false;

  if (p.startMonth <= p.endMonth) {
    return startMonth <= p.endMonth && endMonth >= p.startMonth;
  }
  // Wrap-around period (e.g. B2: Nov–Mar):
  const touchesLater   = endMonth >= p.startMonth;
  const touchesEarlier = startMonth <= p.endMonth;
  return touchesLater || touchesEarlier;
}

/** Returns the deadline Date for a period, using a custom override if provided,
 *  otherwise the config default for that period. */
export function buildPeriodDeadline(
  config: TermConfig,
  syStart: number,
  period: number,
  customDate?: Date,
): Date {
  if (customDate) {
    const d = new Date(customDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  const p = config.periods.find(pd => pd.number === period);
  if (!p) throw new Error(`Period ${period} not found in ${config.type} config`);
  const refYear = p.defaultDeadlineYearRef === "end" ? syStart + 1 : syStart;
  return new Date(refYear, p.defaultDeadlineMonth, p.defaultDeadlineDay, 23, 59, 59, 999);
}

/** Serialised shape sent to the frontend via GET /api/term-config */
export interface TermConfigResponse {
  termType: TermType;
  termNoun: string;
  periodPrefix: string;
  yearFormat: "SY" | "CY";
  periods: Array<{
    number: number;
    label: string;       // e.g. "T1", "Q3", "B2"
    ordinal: string;
    termNoun: string;
    startMonth: number;
    endMonth: number;
  }>;
}

export function toTermConfigResponse(config: TermConfig): TermConfigResponse {
  return {
    termType:     config.type,
    termNoun:     config.termNoun,
    periodPrefix: config.periodPrefix,
    yearFormat:   config.yearFormat,
    periods: config.periods.map(p => ({
      number:     p.number,
      label:      `${p.prefix}${p.number}`,
      ordinal:    p.ordinal,
      termNoun:   config.termNoun,
      startMonth: p.startMonth,
      endMonth:   p.endMonth,
    })),
  };
}
