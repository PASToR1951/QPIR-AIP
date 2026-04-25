import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { normalizeQuarterLabel } from "../../lib/quarters.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { sanitizeString } from "../../lib/sanitize.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import {
  fetchAIPForUser,
  fetchProgramByReference,
  fetchProgramByTitle,
} from "./shared/lookups.ts";
import { serializeIndicators } from "./shared/normalize.ts";
import type { AIPWithActivities, DataRouteEnv } from "./shared/types.ts";

const lookupsRoutes = new Hono<{ Variables: DataRouteEnv }>();

function serializeTemplateIndicators(
  indicators: Array<{ description?: unknown }> | null | undefined,
) {
  const source = Array.isArray(indicators) ? indicators : [];
  return source
    .map((indicator) => ({
      description: typeof indicator?.description === "string"
        ? indicator.description.trim()
        : "",
    }))
    .filter((indicator) => indicator.description.length > 0);
}

lookupsRoutes.use("/schools", requireAuth());
lookupsRoutes.use("/schools/*", requireAuth());
lookupsRoutes.use("/programs", requireAuth());
lookupsRoutes.use("/programs/*", requireAuth());
lookupsRoutes.use("/users/*", requireAuth());
lookupsRoutes.use("/aips/activities", requireAuth());

lookupsRoutes.get(
  "/schools",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch schools",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      if (tokenUser.role === "School" && tokenUser.school_id) {
        const school = await prisma.school.findUnique({
          where: { id: tokenUser.school_id },
          include: { cluster: true },
        });
        return c.json(school ? [school] : []);
      }

      const schools = await prisma.school.findMany({
        include: { cluster: true },
      });
      return c.json(schools);
    },
  ),
);

lookupsRoutes.get(
  "/programs",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch programs",
    async (c) => {
      const tokenUser = getAuthedUser(c);

      const CES_ROLES = ["CES-SGOD", "CES-ASDS", "CES-CID"];
      if (
        tokenUser.role === "Division Personnel" ||
        CES_ROLES.includes(tokenUser.role)
      ) {
        const user = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          include: {
            programs: {
              where: { school_level_requirement: "Division" },
              orderBy: { title: "asc" },
            },
          },
        });
        return c.json(user?.programs ?? []);
      }

      if (tokenUser.school_id) {
        const school = await prisma.school.findUnique({
          where: { id: tokenUser.school_id },
          select: { level: true },
        });

        const schoolLevel = school?.level ?? "Both";
        const levelFilter = schoolLevel === "Both"
          ? ["Elementary", "Secondary", "Both", "Select Schools"]
          : [schoolLevel, "Both", "Select Schools"];

        const restricted = await prisma.program.findMany({
          where: {
            restricted_schools: {
              some: { id: tokenUser.school_id },
            },
          },
          select: { id: true },
        });
        const restrictedIds = restricted.map((program) => program.id);

        const programs = await prisma.program.findMany({
          where: {
            id: { notIn: restrictedIds },
            school_level_requirement: { in: levelFilter },
          },
          orderBy: { title: "asc" },
        });
        return c.json(programs);
      }

      const programs = await prisma.program.findMany({
        orderBy: { title: "asc" },
      });
      return c.json(programs);
    },
  ),
);

lookupsRoutes.get(
  "/programs/:id/template",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch program template",
    async (c) => {
      const programId = safeParseInt(c.req.param("id"), 0);
      if (programId === 0) {
        return c.json({ error: "Invalid program id" }, 400);
      }

      const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { id: true },
      });
      if (!program) {
        return c.json({ error: "Program not found" }, 404);
      }

      const template = await prisma.programTemplate.findUnique({
        where: { program_id: programId },
      });
      if (!template) {
        return c.json(null);
      }

      return c.json({
        program_id: template.program_id,
        outcome: template.outcome,
        target_code: template.target_code,
        target_description: template.target_description,
        indicators: serializeTemplateIndicators(
          template.indicators as any[] ?? [],
        ),
      });
    },
  ),
);

lookupsRoutes.get(
  "/programs/with-aips",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch programs with AIPs",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      const db = prisma.aIP as any;
      const submittedStatuses = [
        "Submitted",
        "Verified",
        "Under Review",
        "Approved",
        "Returned",
      ];

      const aips = tokenUser.role === "School" && tokenUser.school_id
        ? await db.findMany({
          where: {
            school_id: tokenUser.school_id,
            year,
            status: { in: submittedStatuses },
          },
          include: { program: true },
        })
        : await db.findMany({
          where: {
            created_by_user_id: tokenUser.id,
            school_id: null,
            year,
            status: { in: submittedStatuses },
          },
          include: { program: true },
        });

      const programs = aips
        .map((aip: any) => ({ ...aip.program, aip_status: aip.status }))
        .sort((a: any, b: any) => a.title.localeCompare(b.title));

      return c.json(programs);
    },
  ),
);

lookupsRoutes.get(
  "/programs/with-pirs",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch programs with PIRs",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );
      const quarter = c.req.query("quarter")
        ? normalizeQuarterLabel(sanitizeString(c.req.query("quarter")))
        : null;
      const filedStatuses = [
        "Submitted",
        "Under Review",
        "Approved",
        "Returned",
      ];

      const pirs = tokenUser.role === "School" && tokenUser.school_id
        ? await prisma.pIR.findMany({
          where: {
            status: { in: filedStatuses },
            ...(quarter ? { quarter } : {}),
            aip: { school_id: tokenUser.school_id, year },
          },
          include: { aip: { include: { program: true } } },
        })
        : await prisma.pIR.findMany({
          where: {
            status: { in: filedStatuses },
            ...(quarter ? { quarter } : {}),
            aip: {
              created_by_user_id: tokenUser.id,
              school_id: null,
              year,
            },
          },
          include: { aip: { include: { program: true } } },
        });

      const seen = new Set<string>();
      const programs = pirs
        .map((pir: any) => pir.aip.program)
        .filter((program: any) => {
          if (seen.has(program.title)) return false;
          seen.add(program.title);
          return true;
        })
        .sort((a: any, b: any) => a.title.localeCompare(b.title));

      return c.json(programs);
    },
  ),
);

lookupsRoutes.get(
  "/schools/:id/aip-status",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch AIP status",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const schoolId = safeParseInt(c.req.param("id"), 0);
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      if (tokenUser.role === "School" && tokenUser.school_id !== schoolId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const aipCount = await prisma.aIP.count({
        where: { school_id: schoolId, year },
      });
      return c.json({ hasAIP: aipCount > 0, count: aipCount });
    },
  ),
);

lookupsRoutes.get(
  "/schools/:id/coordinators",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch coordinators",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const schoolId = safeParseInt(c.req.param("id"), 0);

      if (tokenUser.role === "School" && tokenUser.school_id !== schoolId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const where: Record<string, unknown> = {};
      if (tokenUser.role === "School") {
        where.school_id = schoolId;
      } else {
        where.created_by_user_id = tokenUser.id;
      }

      const aips = await prisma.aIP.findMany({
        where,
        select: { project_coordinator: true },
        distinct: ["project_coordinator"],
      });

      const coordinators = aips
        .map((aip) => aip.project_coordinator)
        .filter((value): value is string =>
          typeof value === "string" && value.trim() !== ""
        );

      return c.json(coordinators);
    },
  ),
);

lookupsRoutes.get(
  "/schools/:id/persons-terms",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch persons terms",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const schoolId = safeParseInt(c.req.param("id"), 0);

      if (tokenUser.role === "School" && tokenUser.school_id !== schoolId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const aipWhere: Record<string, unknown> = {};
      if (tokenUser.role === "School") {
        aipWhere.school_id = schoolId;
      } else {
        aipWhere.created_by_user_id = tokenUser.id;
      }

      const activities = await prisma.aIPActivity.findMany({
        where: { aip: aipWhere },
        select: { persons_involved: true },
        distinct: ["persons_involved"],
        take: 100,
      });

      const terms = activities
        .map((activity) => activity.persons_involved)
        .filter((value): value is string =>
          typeof value === "string" && value.trim() !== ""
        );

      return c.json(terms);
    },
  ),
);

lookupsRoutes.get(
  "/users/:id/aip-status",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch AIP status",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const userId = safeParseInt(c.req.param("id"), 0);
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      if (tokenUser.id !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const aipCount = await prisma.aIP.count({
        where: { created_by_user_id: userId, school_id: null, year },
      });
      return c.json({ hasAIP: aipCount > 0, count: aipCount });
    },
  ),
);

lookupsRoutes.get(
  "/aips/activities",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch AIP activities",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programTitle = c.req.query("program_title") || "";
      const programId = safeParseInt(c.req.query("program_id"), 0);
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      if (!programTitle && !programId) {
        return c.json(
          { error: "program_title or program_id is required" },
          400,
        );
      }

      const program = await fetchProgramByReference(programId, programTitle);
      if (!program) return c.json({ error: "Resource not found" }, 404);

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
      }) as AIPWithActivities | null;

      if (!aip) {
        return c.json({ error: "No AIP found for this program and year" }, 404);
      }

      const totalBudget = aip.activities.reduce(
        (sum, activity: any) => sum + (parseFloat(activity.budget_amount) || 0),
        0,
      );
      const fundSources = [
        ...new Set(
          aip.activities.map((activity) => activity.budget_source).filter(
            Boolean,
          ),
        ),
      ].join(" / ");

      return c.json({
        aip_id: aip.id,
        program_id: program.id,
        project_coordinator: aip.project_coordinator || "",
        total_budget: totalBudget,
        fund_source: fundSources,
        indicators: serializeIndicators(aip.indicators as any[] ?? []),
        activities: aip.activities.map((activity) => ({
          id: activity.id,
          activity_name: activity.activity_name,
          implementation_period: activity.implementation_period,
          period_start_month: activity.period_start_month,
          period_end_month: activity.period_end_month,
          phase: activity.phase,
          budget_amount: activity.budget_amount,
          outputs: activity.outputs,
          persons_involved: activity.persons_involved,
        })),
      });
    },
  ),
);

export default lookupsRoutes;
