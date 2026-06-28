import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { parseQuarterLabel } from "../../lib/quarters.ts";
import {
  getDefaultQuarterRange,
  resolveMonthRange,
} from "../../lib/periodRanges.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import type { DataRouteEnv } from "./shared/types.ts";

const reportingPeriodRoutes = new Hono<{ Variables: DataRouteEnv }>();

const ACTIVE_DOCUMENT_WHERE = {
  deleted_at: null,
  status: { not: "Draft" },
};

function calendarPeriod(now: Date) {
  return {
    year: now.getFullYear(),
    quarter: Math.ceil((now.getMonth() + 1) / 3),
  };
}

// The "live" period is the reporting window the division is currently
// collecting — i.e. the most recently *opened* configured deadline. This
// mirrors the deadline-reminder sweep, which gates notifications on the same
// open_date. Naive calendar math (month / 3) is only a fallback for when no
// deadlines have been configured, since it ignores admin-customized period
// coverage and open dates and can land on an empty future quarter.
async function getLivePeriod() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const deadlines = await (prisma.deadline as any).findMany({
    where: { year: { in: [currentYear - 1, currentYear, currentYear + 1] } },
    select: {
      year: true,
      quarter: true,
      open_date: true,
      period_start_month: true,
      period_end_month: true,
    },
  });

  let best: { year: number; quarter: number; openTime: number } | null = null;
  for (const deadline of deadlines as Array<any>) {
    const range = resolveMonthRange(
      deadline.period_start_month,
      deadline.period_end_month,
      getDefaultQuarterRange(deadline.quarter),
    );
    const openDate = deadline.open_date
      ? new Date(deadline.open_date)
      : new Date(deadline.year, range.start - 1, 1);

    if (now < openDate) continue;

    const openTime = openDate.getTime();
    if (!best || openTime > best.openTime) {
      best = { year: deadline.year, quarter: deadline.quarter, openTime };
    }
  }

  if (best) return { year: best.year, quarter: best.quarter };
  return calendarPeriod(now);
}

function pirVisibilityWhereFor(user: DataRouteEnv["user"]) {
  if (user.role === "School" && user.school_id) {
    return { aip: { school_id: user.school_id } };
  }

  if (user.role === "Division Personnel") {
    return {
      OR: [
        { aip: { school_id: null, created_by_user_id: user.id } },
        {
          aip: {
            school_id: { not: null },
            program: { focal_persons: { some: { user_id: user.id } } },
          },
        },
      ],
    };
  }

  return {};
}

reportingPeriodRoutes.get(
  "/reporting-periods",
  requireAuth(),
  asyncHandler(
    "Failed to fetch reporting periods",
    "Failed to fetch reporting periods",
    async (c) => {
      const user = getAuthedUser(c);

      const pirs = await prisma.pIR.findMany({
        where: {
          ...ACTIVE_DOCUMENT_WHERE,
          ...pirVisibilityWhereFor(user),
        },
        select: {
          quarter: true,
          aip: { select: { year: true } },
        },
      });

      const periodMap = new Map<number, Set<number>>();
      for (const pir of pirs) {
        const parsed = parseQuarterLabel(pir.quarter);
        if (!parsed) continue;

        const year = parsed.year || pir.aip?.year;
        const quarter = parsed.quarter;
        if (!year || quarter < 1 || quarter > 4) continue;

        if (!periodMap.has(year)) periodMap.set(year, new Set());
        periodMap.get(year)!.add(quarter);
      }

      const periods = Array.from(periodMap.entries())
        .sort(([leftYear], [rightYear]) => rightYear - leftYear)
        .map(([year, quarters]) => ({
          year,
          quarters: Array.from(quarters).sort((left, right) => left - right),
        }));

      return c.json({
        live: await getLivePeriod(),
        periods,
      });
    },
  ),
);

export default reportingPeriodRoutes;
