import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { parseQuarterLabel } from "../../lib/quarters.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import type { DataRouteEnv } from "./shared/types.ts";

const reportingPeriodRoutes = new Hono<{ Variables: DataRouteEnv }>();

const ACTIVE_DOCUMENT_WHERE = {
  deleted_at: null,
  status: { not: "Draft" },
};

function getLivePeriod() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    quarter: Math.ceil((now.getMonth() + 1) / 3),
  };
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
        live: getLivePeriod(),
        periods,
      });
    },
  ),
);

export default reportingPeriodRoutes;
