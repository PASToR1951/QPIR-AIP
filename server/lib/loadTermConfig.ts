// server/lib/loadTermConfig.ts
// Loads the active term config from the database.
// Applies custom startMonth/endMonth overrides stored in system_config "custom_periods".
// Called once per request — no caching needed (primary-key lookup is sub-ms).

import { prisma } from "../db/client.ts";
import { getTermConfig, type TermConfig, type TermType } from "./termConfig.ts";

interface CustomPeriodEntry {
  number: number;
  startMonth: number;
  endMonth: number;
}

type CustomPeriodsMap = Record<TermType, CustomPeriodEntry[] | null>;

export async function loadTermConfig(): Promise<TermConfig> {
  const [termRow, customRow] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: "term_type" } }),
    prisma.systemConfig.findUnique({ where: { key: "custom_periods" } }),
  ]);

  const type = (termRow?.value ?? "Trimester") as TermType;
  const base = getTermConfig(type);

  if (!customRow?.value) return base;

  let customMap: CustomPeriodsMap;
  try {
    customMap = JSON.parse(customRow.value);
  } catch {
    return base;
  }

  const overrides = customMap[type];
  if (!overrides || !Array.isArray(overrides)) return base;

  // Overlay only startMonth/endMonth; keep all other PeriodDef fields from the static config.
  const overlaidPeriods = base.periods.map(p => {
    const ov = overrides.find(o => o.number === p.number);
    if (!ov) return p;
    return { ...p, startMonth: ov.startMonth, endMonth: ov.endMonth };
  });

  return { ...base, periods: overlaidPeriods };
}
