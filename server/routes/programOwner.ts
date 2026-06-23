import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { getUserFromToken, type TokenPayload } from "../lib/auth.ts";
import { normalizeQuarterLabel } from "../lib/quarters.ts";
import { safeParseInt } from "../lib/safeParseInt.ts";
import { sanitizeString } from "../lib/sanitize.ts";
import {
  factorFieldsToClientShape,
  pirActivityClientId,
} from "./data/shared/normalize.ts";
import { buildSubmittedBy } from "./admin/shared/display.ts";
import {
  documentWhereFromRef,
  publicDocumentRef,
} from "./admin/shared/documentRefs.ts";
import { adminAsyncHandler } from "./admin/submissions/asyncHandler.ts";

const programOwnerRoutes = new Hono();

async function requireProgramOwner(c: Parameters<typeof getUserFromToken>[0]) {
  const user = await getUserFromToken(c);
  if (!user || user.role !== "Division Personnel") return null;
  return user;
}

async function ownedProgramIds(userId: number): Promise<number[]> {
  const [direct, focal] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { programs: { select: { id: true } } },
    }),
    prisma.programFocalPerson.findMany({
      where: {
        user_id: userId,
        user: { role: "Division Personnel", is_active: true },
      },
      select: { program_id: true },
    }),
  ]);

  return [
    ...new Set([
      ...(direct?.programs ?? []).map((program) => program.id),
      ...focal.map((entry) => entry.program_id),
    ]),
  ];
}

function parseProgramOwnerFilters(c: any) {
  const year = safeParseInt(c.req.query("year"), 0, 2020, 2100) || undefined;
  const status = sanitizeString(c.req.query("status") ?? "").trim();
  const programId = safeParseInt(c.req.query("program_id"), 0) || undefined;
  const rawQuarter = c.req.query("quarter");
  let quarter: string | undefined;

  if (rawQuarter) {
    const quarterNumber = safeParseInt(rawQuarter, 0, 1, 4);
    if (quarterNumber && year) {
      const ordinals = ["", "1st", "2nd", "3rd", "4th"];
      quarter = `${ordinals[quarterNumber]} Quarter CY ${year}`;
    } else {
      quarter = normalizeQuarterLabel(sanitizeString(rawQuarter));
    }
  }

  return { year, status, programId, quarter };
}

function serializeAipDocument(aip: any) {
  return {
    id: publicDocumentRef(aip),
    internalId: aip.id,
    type: "AIP",
    status: aip.status,
    year: aip.year,
    program: aip.program.title,
    programId: aip.program.id,
    school: aip.school?.name ?? "Division",
    schoolId: aip.school_id ?? null,
    submittedAt: aip.created_at,
    submittedBy: buildSubmittedBy(aip.created_by),
  };
}

function serializePirDocument(pir: any) {
  return {
    id: publicDocumentRef(pir),
    internalId: pir.id,
    type: "PIR",
    status: pir.status,
    year: pir.aip.year,
    quarter: pir.quarter,
    program: pir.aip.program.title,
    programId: pir.aip.program.id,
    school: pir.aip.school?.name ?? "Division",
    schoolId: pir.aip.school_id ?? null,
    submittedAt: pir.created_at,
    submittedBy: buildSubmittedBy(pir.created_by),
  };
}

function serializeAipDetail(aip: any) {
  return {
    ...serializeAipDocument(aip),
    outcome: aip.outcome,
    targetDescription: aip.target_description,
    kpis: aip.kpis ?? null,
    baseline: aip.baseline ?? null,
    quarterlyTarget: aip.quarterly_target ?? null,
    sipTitle: aip.sip_title,
    projectCoordinator: aip.project_coordinator,
    objectives: aip.objectives ?? [],
    indicators: aip.indicators ?? [],
    focalRemarks: aip.focal_remarks ?? null,
    cesRemarks: aip.ces_remarks ?? null,
    activities: (aip.activities ?? []).map((activity: any) => ({
      id: activity.id,
      phase: activity.phase,
      name: activity.activity_name,
      implementationPeriod: activity.implementation_period,
      periodStartMonth: activity.period_start_month,
      periodEndMonth: activity.period_end_month,
      persons: activity.persons_involved,
      outputs: activity.outputs,
      budgetAmount: activity.budget_amount,
      budgetSource: activity.budget_source,
    })),
  };
}

function serializePirDetail(pir: any) {
  const factorsMap: Record<string, any> = {};
  for (const factor of pir.factors ?? []) {
    factorsMap[factor.factor_type] = factorFieldsToClientShape(factor);
  }

  let unplannedIndex = 0;
  return {
    ...serializePirDocument(pir),
    programOwner: pir.program_owner,
    budgetFromDivision: pir.budget_from_division,
    budgetFromCoPSF: pir.budget_from_co_psf,
    functionalDivision: pir.functional_division ?? null,
    indicatorQuarterlyTargets: pir.indicator_quarterly_targets ?? [],
    actionItems: pir.action_items ?? [],
    focalRemarks: pir.focal_remarks ?? null,
    cesRemarks: pir.ces_remarks ?? null,
    activities: (pir.activity_reviews ?? []).map((review: any) => {
      const clientId = pirActivityClientId(review, unplannedIndex);
      if (review.is_unplanned) unplannedIndex += 1;
      return {
        id: clientId,
        aipActivityId: review.aip_activity_id,
        fromAIP: Boolean(review.aip_activity_id),
        name: review.aip_activity?.activity_name ?? "",
        implementationPeriod: review.aip_activity?.implementation_period ?? "",
        complied: review.complied,
        actualTasksConducted: review.actual_tasks_conducted ?? "",
        contributoryIndicators: review.contributory_performance_indicators ??
          "",
        movsExpectedOutputs: review.movs_expected_outputs ?? "",
        adjustments: review.adjustments ?? "",
        isUnplanned: review.is_unplanned ?? false,
        physicalTarget: review.physical_target,
        financialTarget: review.financial_target,
        physicalAccomplished: review.physical_accomplished,
        financialAccomplished: review.financial_accomplished,
        actionsToAddressGap: review.actions_to_address_gap ?? "",
      };
    }),
    factors: factorsMap,
  };
}

function hasProgramAccess(programIds: number[], programId: number) {
  return programIds.includes(programId);
}

async function requireOwnedPrograms(user: TokenPayload, c: any) {
  const programIds = await ownedProgramIds(user.id);
  if (programIds.length === 0) {
    return c.json({ aips: [], pirs: [], documents: [] });
  }
  return programIds;
}

programOwnerRoutes.get(
  "/programs",
  adminAsyncHandler(
    "Program Owner programs failed",
    "Failed to fetch programs",
    async (c) => {
      const tokenUser = await requireProgramOwner(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const programIds = await ownedProgramIds(tokenUser.id);
      const programs = programIds.length
        ? await prisma.program.findMany({
          where: { id: { in: programIds } },
          orderBy: { title: "asc" },
        })
        : [];

      return c.json(programs);
    },
  ),
);

programOwnerRoutes.get(
  "/documents",
  adminAsyncHandler(
    "Program Owner documents failed",
    "Failed to fetch documents",
    async (c) => {
      const tokenUser = await requireProgramOwner(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);

      const programIdsResult = await requireOwnedPrograms(tokenUser, c);
      if (!Array.isArray(programIdsResult)) return programIdsResult;
      const programIds = programIdsResult;
      const { year, status, programId, quarter } = parseProgramOwnerFilters(c);
      const activeProgramIds = programId
        ? programIds.filter((id) => id === programId)
        : programIds;
      if (activeProgramIds.length === 0) {
        return c.json({ aips: [], pirs: [], documents: [] });
      }

      const type = sanitizeString(c.req.query("type") ?? "all").trim()
        .toLowerCase();
      const includeAips = type === "all" || type === "aip" || type === "";
      const includePirs = type === "all" || type === "pir" || type === "";

      const [aips, pirs] = await Promise.all([
        includeAips
          ? prisma.aIP.findMany({
            where: {
              program_id: { in: activeProgramIds },
              status: status ? status : { not: "Draft" },
              ...(year ? { year } : {}),
            },
            include: {
              program: true,
              school: true,
              created_by: {
                select: {
                  name: true,
                  first_name: true,
                  middle_initial: true,
                  last_name: true,
                  email: true,
                },
              },
            },
            orderBy: { created_at: "desc" },
          })
          : [],
        includePirs
          ? prisma.pIR.findMany({
            where: {
              deleted_at: null,
              status: status ? status : { not: "Draft" },
              ...(quarter ? { quarter } : {}),
              aip: {
                program_id: { in: activeProgramIds },
                ...(year ? { year } : {}),
              },
            },
            include: {
              aip: { include: { program: true, school: true } },
              created_by: {
                select: {
                  name: true,
                  first_name: true,
                  middle_initial: true,
                  last_name: true,
                  email: true,
                },
              },
            },
            orderBy: { created_at: "desc" },
          })
          : [],
      ]);

      const normalizedAips = aips.map(serializeAipDocument);
      const normalizedPirs = pirs.map(serializePirDocument);
      const documents = [...normalizedAips, ...normalizedPirs].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime(),
      );

      return c.json({ aips: normalizedAips, pirs: normalizedPirs, documents });
    },
  ),
);

programOwnerRoutes.get(
  "/aips/:id",
  adminAsyncHandler(
    "Program Owner AIP detail failed",
    "Failed to fetch AIP",
    async (c) => {
      const tokenUser = await requireProgramOwner(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);
      const programIds = await ownedProgramIds(tokenUser.id);

      const aip = await prisma.aIP.findUnique({
        where: documentWhereFromRef(c.req.param("id")),
        include: {
          program: true,
          school: true,
          created_by: {
            select: {
              name: true,
              first_name: true,
              middle_initial: true,
              last_name: true,
              email: true,
            },
          },
          activities: { orderBy: { id: "asc" } },
        },
      });
      if (!aip) return c.json({ error: "AIP not found" }, 404);
      if (!hasProgramAccess(programIds, aip.program_id)) {
        return c.json({ error: "Forbidden" }, 403);
      }

      return c.json(serializeAipDetail(aip));
    },
  ),
);

programOwnerRoutes.get(
  "/pirs/:id",
  adminAsyncHandler(
    "Program Owner PIR detail failed",
    "Failed to fetch PIR",
    async (c) => {
      const tokenUser = await requireProgramOwner(c);
      if (!tokenUser) return c.json({ error: "Forbidden" }, 403);
      const programIds = await ownedProgramIds(tokenUser.id);

      const pir = await prisma.pIR.findUnique({
        where: documentWhereFromRef(c.req.param("id")),
        include: {
          aip: { include: { program: true, school: true } },
          created_by: {
            select: {
              name: true,
              first_name: true,
              middle_initial: true,
              last_name: true,
              email: true,
            },
          },
          activity_reviews: {
            orderBy: { id: "asc" },
            include: { aip_activity: true },
          },
          factors: true,
        },
      });
      if (!pir || pir.deleted_at) {
        return c.json({ error: "PIR not found" }, 404);
      }
      if (!hasProgramAccess(programIds, pir.aip.program_id)) {
        return c.json({ error: "Forbidden" }, 403);
      }

      return c.json(serializePirDetail(pir));
    },
  ),
);

export default programOwnerRoutes;
