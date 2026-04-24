import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import { writeUserLog } from "../../lib/userActivityLog.ts";
import { getClientIp } from "../../lib/clientIp.ts";
import type { DataRouteEnv } from "./shared/types.ts";

const dashboardRoutes = new Hono<{ Variables: DataRouteEnv }>();

function activityOverlapsQuarter(
  startMonth: number,
  endMonth: number,
  quarter: number,
): boolean {
  const quarterStart = (quarter - 1) * 3 + 1;
  const quarterEnd = quarter * 3;
  return startMonth <= quarterEnd && endMonth >= quarterStart;
}

function getQuarterLabel(quarter: number, year: number): string {
  const ordinals: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
    4: "4th",
  };
  return `${ordinals[quarter]} Quarter CY ${year}`;
}

function buildDeadline(
  year: number,
  quarter: number,
  customDate?: Date,
): Date {
  if (customDate) {
    const date = new Date(customDate);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  const defaults: Record<number, Date> = {
    1: new Date(year, 2, 31, 23, 59, 59, 999),
    2: new Date(year, 5, 30, 23, 59, 59, 999),
    3: new Date(year, 8, 30, 23, 59, 59, 999),
    4: new Date(year, 11, 31, 23, 59, 59, 999),
  };

  return defaults[quarter];
}

dashboardRoutes.get(
  "/history",
  requireAuth(),
  asyncHandler(
    "Failed to fetch history",
    "Failed to fetch history",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const aipWhere = tokenUser.role === "School" && tokenUser.school_id
        ? { school_id: tokenUser.school_id, status: { not: "Draft" } }
        : {
          created_by_user_id: tokenUser.id,
          school_id: null,
          status: { not: "Draft" },
        };

      const aips = await (prisma.aIP as any).findMany({
        where: aipWhere,
        include: {
          program: { select: { title: true, abbreviation: true } },
          pirs: {
            where: { status: { not: "Draft" } },
            select: { id: true, quarter: true, status: true, created_at: true },
            orderBy: { created_at: "asc" },
          },
        },
        orderBy: [{ year: "desc" }, { created_at: "asc" }],
      });

      const yearMap = new Map<number, any[]>();
      for (const aip of aips) {
        if (!yearMap.has(aip.year)) yearMap.set(aip.year, []);
        yearMap.get(aip.year)!.push({
          id: aip.id,
          programId: aip.program_id,
          program: aip.program.title,
          abbreviation: aip.program.abbreviation ?? null,
          status: aip.status,
          editRequested: aip.edit_requested ?? false,
          editRequestCount: (aip as any).edit_request_count ?? 0,
          archived: aip.archived ?? false,
          created_at: aip.created_at,
          pirs: aip.pirs.map((pir: any) => ({
            id: pir.id,
            quarter: pir.quarter,
            status: pir.status,
          })),
        });
      }

      for (const list of yearMap.values()) {
        list.sort((a: any, b: any) => a.program.localeCompare(b.program));
      }

      const result = Array.from(yearMap.entries())
        .sort(([left], [right]) => right - left)
        .map(([year, yearAips]) => ({ year, aips: yearAips }));

      return c.json(result);
    },
  ),
);

dashboardRoutes.get(
  "/dashboard",
  requireAuth(),
  asyncHandler(
    "Dashboard error",
    "Failed to fetch dashboard data",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );
      const today = new Date();
      const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);

      const customDeadlines = await prisma.deadline.findMany({ where: { year } });
      const getDeadline = (quarter: number) =>
        buildDeadline(
          year,
          quarter,
          customDeadlines.find((deadline) => deadline.quarter === quarter)?.date,
        );

      let activePrograms = 0;
      if (tokenUser.role === "Division Personnel") {
        const user = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          include: { programs: true },
        });
        activePrograms = user?.programs.length ?? 0;
      } else if (tokenUser.school_id) {
        const school = await prisma.school.findUnique({
          where: { id: tokenUser.school_id },
          select: { level: true },
        });
        const schoolLevel = school?.level ?? "Both";
        const levelFilter = schoolLevel === "Both"
          ? ["Elementary", "Secondary", "Both", "Select Schools"]
          : [schoolLevel, "Both", "Select Schools"];
        const restricted = await prisma.program.findMany({
          where: { restricted_schools: { some: { id: tokenUser.school_id } } },
          select: { id: true },
        });
        const restrictedIds = restricted.map((program) => program.id);
        activePrograms = await prisma.program.count({
          where: {
            id: { notIn: restrictedIds },
            school_level_requirement: { in: levelFilter },
          },
        });
      }

      const submittedAipStatuses = [
        "Submitted",
        "Verified",
        "Under Review",
        "Approved",
        "Returned",
      ];

      let aipCompleted = 0;
      if (tokenUser.role === "Division Personnel") {
        aipCompleted = await prisma.aIP.count({
          where: {
            created_by_user_id: tokenUser.id,
            school_id: null,
            year,
            status: { in: submittedAipStatuses },
          },
        });
      } else if (tokenUser.school_id) {
        aipCompleted = await prisma.aIP.count({
          where: {
            school_id: tokenUser.school_id,
            year,
            status: { in: submittedAipStatuses },
          },
        });
      }

      const aipTotal = activePrograms;
      const aipPercentage = aipTotal > 0
        ? Math.round((aipCompleted / aipTotal) * 100)
        : 0;

      const userAIPsWithActivities = await (prisma.aIP as any).findMany({
        where: tokenUser.role === "Division Personnel"
          ? {
            created_by_user_id: tokenUser.id,
            school_id: null,
            year,
            status: { in: submittedAipStatuses },
          }
          : {
            school_id: tokenUser.school_id,
            year,
            status: { in: submittedAipStatuses },
          },
        select: {
          id: true,
          activities: {
            select: {
              period_start_month: true,
              period_end_month: true,
              budget_amount: true,
            },
          },
        },
      });

      const allAipIds: number[] = userAIPsWithActivities.map((aip: any) => aip.id);
      const aipHasActivitiesInQuarter = (aip: any, quarter: number) =>
        aip.activities.some((activity: any) =>
          activity.period_start_month && activity.period_end_month
            ? activityOverlapsQuarter(
              activity.period_start_month,
              activity.period_end_month,
              quarter,
            )
            : true
        );

      const aipsRelevantThisQuarter = userAIPsWithActivities.filter((aip: any) =>
        aipHasActivitiesInQuarter(aip, currentQuarter)
      );
      const pirTotal = aipsRelevantThisQuarter.length;
      const relevantAipIds: number[] = aipsRelevantThisQuarter.map((aip: any) => aip.id);

      const currentQuarterLabel = getQuarterLabel(currentQuarter, year);
      const pirSubmittedCount = relevantAipIds.length > 0
        ? await prisma.pIR.count({
          where: { aip_id: { in: relevantAipIds }, quarter: currentQuarterLabel },
        })
        : 0;

      const totalPlannedBudget = userAIPsWithActivities.reduce(
        (sum: number, aip: any) =>
          sum +
            aip.activities.reduce(
              (activitySum: number, activity: any) =>
                activitySum + (parseFloat(activity.budget_amount) || 0),
              0,
            ),
        0,
      );

      const quarterStarts: Record<number, Date> = {
        1: new Date(year, 0, 1),
        2: new Date(year, 3, 1),
        3: new Date(year, 6, 1),
        4: new Date(year, 9, 1),
      };

      const quarters = await Promise.all([1, 2, 3, 4].map(async (quarter) => {
        const customRecord = customDeadlines.find((deadline) =>
          deadline.quarter === quarter
        );
        const deadline = getDeadline(quarter);
        const label = getQuarterLabel(quarter, year);

        const openDate = customRecord?.open_date
          ? new Date(customRecord.open_date)
          : quarterStarts[quarter];
        const graceDays = customRecord?.grace_period_days ?? 0;
        const graceEnd = new Date(deadline.getTime() + graceDays * 86400000);
        graceEnd.setHours(23, 59, 59, 999);

        const hasActivities = userAIPsWithActivities.some((aip: any) =>
          aipHasActivitiesInQuarter(aip, quarter)
        );

        const relevantIds = userAIPsWithActivities
          .filter((aip: any) => aipHasActivitiesInQuarter(aip, quarter))
          .map((aip: any) => aip.id);
        const quarterTotal = relevantIds.length;
        const quarterSubmitted = quarterTotal > 0
          ? await prisma.pIR.count({
            where: { aip_id: { in: relevantIds }, quarter: label },
          })
          : 0;

        let status: string;
        if (!hasActivities && allAipIds.length > 0) {
          status = "No Activities";
        } else if (today < openDate) {
          status = "Locked";
        } else if (today <= deadline) {
          status = "In Progress";
        } else if (graceDays > 0 && today <= graceEnd) {
          status = "In Grace";
        } else {
          status = quarterSubmitted >= quarterTotal && quarterTotal > 0
            ? "Submitted"
            : (quarterTotal > 0 ? "Missed" : "No Activities");
        }

        return {
          name: `Q${quarter}`,
          status,
          deadline: deadline.toISOString(),
          open_date: openDate.toISOString(),
          grace_end: graceEnd.toISOString(),
          submitted: quarterSubmitted,
          total: quarterTotal,
        };
      }));

      const currentDeadline = getDeadline(currentQuarter);

      return c.json({
        activePrograms,
        aipCompletion: {
          completed: aipCompleted,
          total: aipTotal,
          percentage: aipPercentage,
        },
        pirSubmitted: { submitted: pirSubmittedCount, total: pirTotal },
        totalPlannedBudget,
        currentQuarter,
        deadline: currentDeadline.toISOString(),
        quarters,
      });
    },
  ),
);

dashboardRoutes.get("/me/export", requireAuth("Unauthorized"), async (c) => {
  const tokenUser = getAuthedUser(c);

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      first_name: true,
      middle_initial: true,
      last_name: true,
      is_active: true,
      created_at: true,
      deleted_at: true,
      school: { select: { id: true, name: true } },
      cluster: { select: { id: true, name: true } },
      aips: {
        select: {
          id: true,
          year: true,
          status: true,
          created_at: true,
          program: { select: { title: true } },
        },
      },
      pirs: {
        select: { id: true, quarter: true, status: true, created_at: true },
      },
    },
  });

  if (!user) return c.json({ error: "User not found" }, 404);

  writeUserLog({ userId: tokenUser.id, action: "data_export", ipAddress: getClientIp(c) });
  return c.json({
    exported_at: new Date().toISOString(),
    notice:
      "This export contains all personal data held about you under RA 10173 (Data Privacy Act of 2012).",
    data: user,
  });
});

export default dashboardRoutes;
