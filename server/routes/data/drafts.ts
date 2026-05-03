import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import {
  aipResourceKey,
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  pirResourceKey,
  pirResourceKeyFromRecord,
  withAdvisoryLock,
  withAdvisoryLocks,
} from "../../lib/advisoryLock.ts";
import { ConflictError } from "../../lib/errors.ts";
import { isPrismaUniqueConflictWithoutTarget } from "../../lib/prismaErrors.ts";
import { normalizeQuarterLabel } from "../../lib/quarters.ts";
import { sanitizeObject, sanitizeString } from "../../lib/sanitize.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import {
  getDefaultReportingYear,
  normalizeTrimesterLabel,
} from "../../lib/trimesters.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import {
  fetchAIPForUser,
  fetchPIRForUser,
  fetchProgramByReference,
  fetchProgramByTitle,
} from "./shared/lookups.ts";
import {
  factorFieldsToClientShape,
  normalizeIndicators,
  pirActivityClientId,
  serializeIndicators,
  transformActivityReviews,
  transformAIPActivities,
  transformFactors,
  validateBudgetAmount,
} from "./shared/normalize.ts";
import type {
  AIPWithActivities,
  AIPWithProgramActivities,
  DataRouteEnv,
  PIRWithFactorsAndReviews,
} from "./shared/types.ts";

const draftsRoutes = new Hono<{ Variables: DataRouteEnv }>();

function resolveTargetDescription(
  targetDescription: unknown,
  indicators: Array<{ description?: unknown }> | null | undefined,
): string {
  const explicitTarget = typeof targetDescription === "string"
    ? targetDescription.trim()
    : "";
  if (explicitTarget) {
    return explicitTarget;
  }

  const firstIndicator = indicators?.find((indicator) =>
    typeof indicator?.description === "string" &&
    indicator.description.trim().length > 0
  );
  return typeof firstIndicator?.description === "string"
    ? firstIndicator.description.trim()
    : "";
}

async function mapTargetlessUniqueConflict<T>(
  operation: Promise<T>,
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (isPrismaUniqueConflictWithoutTarget(error)) {
      throw new ConflictError("A record already exists for this request");
    }
    throw error;
  }
}

draftsRoutes.use("/aips/draft", requireAuth());
draftsRoutes.use("/pirs/draft", requireAuth());

draftsRoutes.post(
  "/aips/draft",
  asyncHandler(
    "Failed to save AIP draft",
    "Failed to save draft",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const body = sanitizeObject(await c.req.json());
      const {
        program_id,
        program_title,
        year: rawYear,
        outcome,
        target_description,
        sip_title,
        project_coordinator,
        objectives,
        indicators,
        prepared_by_name,
        prepared_by_title,
        approved_by_name,
        approved_by_title,
        activities,
      } = body;

      if (!program_title && safeParseInt(program_id, 0) === 0) {
        return c.json(
          { error: "program_id or program_title is required" },
          400,
        );
      }

      const cleanProgramTitle = sanitizeString(program_title);
      const program = await fetchProgramByReference(
        program_id,
        cleanProgramTitle,
      );
      if (!program) return c.json({ error: "Resource not found" }, 404);

      const year = safeParseInt(
        rawYear,
        getDefaultReportingYear(tokenUser.role),
        2020,
        2100,
      );
      const schoolId = tokenUser.role === "School" ? tokenUser.school_id : null;

      const aipData = {
        outcome: outcome || "",
        target_description: resolveTargetDescription(
          target_description,
          indicators,
        ),
        sip_title: sip_title || "",
        project_coordinator: project_coordinator || "",
        objectives: objectives || [],
        indicators: normalizeIndicators(indicators),
        prepared_by_name: prepared_by_name || "",
        prepared_by_title: prepared_by_title || "",
        approved_by_name: approved_by_name || "",
        approved_by_title: approved_by_title || "",
        status: "Draft",
      };

      for (const act of activities || []) {
        try {
          validateBudgetAmount(act.budgetAmount);
        } catch {
          return c.json(
            { error: "Invalid budget amount: must be a non-negative number" },
            400,
          );
        }
      }

      const activityData = transformAIPActivities(activities);

      const resource = aipResourceKey(tokenUser, schoolId, program.id, year);
      const aip = await mapTargetlessUniqueConflict(
        withAdvisoryLock(
          LOCK_NAMESPACE.AIP,
          resource,
          async (tx) => {
            const existing = await fetchAIPForUser(
              tokenUser,
              program.id,
              year,
              {
                activities: true,
              },
              tx,
            ) as AIPWithActivities | null;

            if (existing?.archived) {
              throw new ConflictError(
                "This AIP has been archived and cannot be modified",
              );
            }
            if (existing && existing.status !== "Draft") {
              throw new ConflictError(
                "An AIP has already been submitted for this program and year",
              );
            }

            if (existing) {
              await tx.aIPActivity.deleteMany({
                where: { aip_id: existing.id },
              });
              return tx.aIP.update({
                where: { id: existing.id },
                data: {
                  ...aipData,
                  activities: { create: activityData },
                },
                include: { activities: true },
              });
            }

            return tx.aIP.create({
              data: {
                school_id: schoolId,
                program_id: program.id,
                created_by_user_id: tokenUser.id,
                year,
                ...aipData,
                activities: { create: activityData },
              },
              include: { activities: true },
            });
          },
        ),
      );

      return c.json({ message: "Draft saved successfully", aip });
    },
  ),
);

draftsRoutes.get(
  "/aips/draft",
  asyncHandler(
    "Failed to load AIP draft",
    "Failed to load draft",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programId = c.req.query("program_id");
      const year = safeParseInt(
        c.req.query("year"),
        getDefaultReportingYear(tokenUser.role),
        2020,
        2100,
      );

      const programTitle = c.req.query("program_title");
      if (!programTitle && safeParseInt(programId, 0) === 0) {
        const drafts = tokenUser.role === "School" && tokenUser.school_id
          ? await prisma.aIP.findMany({
            where: { school_id: tokenUser.school_id, year, status: "Draft" },
            include: { activities: true, program: true },
          })
          : await prisma.aIP.findMany({
            where: {
              created_by_user_id: tokenUser.id,
              school_id: null,
              year,
              status: "Draft",
            },
            include: { activities: true, program: true },
          });

        if (drafts.length === 0) return c.json({ hasDraft: false });

        const aip = drafts[0] as AIPWithProgramActivities;
        return c.json({
          hasDraft: true,
          draftProgram: aip.program.title,
          lastSaved: aip.created_at,
        });
      }

      const program = await fetchProgramByReference(programId, programTitle);
      if (!program) return c.json({ hasDraft: false });

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
        program: true,
      }) as AIPWithProgramActivities | null;

      if (!aip || aip.status !== "Draft") return c.json({ hasDraft: false });

      const indicators = serializeIndicators(aip.indicators as any[] ?? []);
      const draftData = {
        programId: aip.program_id,
        outcome: aip.outcome,
        targetDescription: aip.target_description ||
          indicators[0]?.description || "",
        year: String(aip.year),
        depedProgram: aip.program.title,
        sipTitle: aip.sip_title,
        projectCoord: aip.project_coordinator,
        objectives: aip.objectives,
        indicators,
        preparedByName: aip.prepared_by_name,
        preparedByTitle: aip.prepared_by_title,
        approvedByName: aip.approved_by_name,
        approvedByTitle: aip.approved_by_title,
        activities: aip.activities.map((a) => ({
          id: a.id,
          phase: a.phase,
          name: a.activity_name,
          period: a.implementation_period,
          periodStartMonth: a.period_start_month,
          periodEndMonth: a.period_end_month,
          persons: a.persons_involved,
          outputs: a.outputs,
          budgetAmount: a.budget_amount,
          budgetSource: a.budget_source,
        })),
      };

      return c.json({ hasDraft: true, draftData, lastSaved: aip.created_at });
    },
  ),
);

draftsRoutes.delete(
  "/aips/draft",
  asyncHandler(
    "Failed to delete AIP draft",
    "Failed to delete draft",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programTitle = c.req.query("program_title");
      const programId = c.req.query("program_id");
      const year = safeParseInt(
        c.req.query("year"),
        getDefaultReportingYear(tokenUser.role),
        2020,
        2100,
      );

      const where: Record<string, unknown> = { status: "Draft", year };
      if (tokenUser.role === "School" && tokenUser.school_id) {
        where.school_id = tokenUser.school_id;
      } else {
        where.created_by_user_id = tokenUser.id;
        where.school_id = null;
      }

      if (programTitle || safeParseInt(programId, 0) > 0) {
        const program = await fetchProgramByReference(programId, programTitle);
        if (program) where.program_id = program.id;
      }

      const drafts = await prisma.aIP.findMany({
        where,
        select: {
          id: true,
          school_id: true,
          created_by_user_id: true,
          program_id: true,
          year: true,
        },
        orderBy: { id: "asc" },
      });

      if (drafts.length > 0) {
        await withAdvisoryLocks(
          drafts.map((draft) => ({
            namespace: LOCK_NAMESPACE.AIP,
            resource: aipResourceKeyFromRecord(draft),
          })),
          async (tx) => {
            await tx.aIP.deleteMany({
              where: {
                id: { in: drafts.map((draft) => draft.id) },
                status: "Draft",
              },
            });
          },
        );
      }
      return c.json({ message: "Draft deleted" });
    },
  ),
);

draftsRoutes.post(
  "/pirs/draft",
  asyncHandler(
    "Failed to save PIR draft",
    "Failed to save PIR draft",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const body = sanitizeObject(await c.req.json());
      const {
        program_title,
        quarter,
        program_owner,
        budget_from_division,
        budget_from_co_psf,
        functional_division,
        indicator_quarterly_targets,
        action_items,
        activity_reviews,
        factors,
      } = body;

      if (!program_title || !quarter) {
        return c.json(
          { error: "program_title and quarter are required" },
          400,
        );
      }

      const sanitizedTitle = sanitizeString(program_title);
      const sanitizedQuarter = tokenUser.role === "School"
        ? normalizeTrimesterLabel(sanitizeString(quarter))
        : normalizeQuarterLabel(sanitizeString(quarter));
      if (!sanitizedTitle || !sanitizedQuarter) {
        return c.json(
          { error: "program_title and quarter are required" },
          400,
        );
      }

      const program = await fetchProgramByTitle(sanitizedTitle);
      if (!program) return c.json({ error: "Resource not found" }, 404);

      const yearMatch = sanitizedQuarter.match(/CY (\d{4})/);
      const year = yearMatch
        ? safeParseInt(
          yearMatch[1],
          getDefaultReportingYear(tokenUser.role),
          2020,
          2100,
        )
        : getDefaultReportingYear(tokenUser.role);

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
      }) as AIPWithActivities | null;
      if (!aip) return c.json({ error: "Resource not found" }, 404);

      let budgetDiv: number;
      let budgetPsf: number;
      try {
        budgetDiv = validateBudgetAmount(budget_from_division);
      } catch {
        return c.json(
          {
            error:
              "Invalid budget_from_division: must be a non-negative number",
          },
          400,
        );
      }
      try {
        budgetPsf = validateBudgetAmount(budget_from_co_psf);
      } catch {
        return c.json(
          {
            error: "Invalid budget_from_co_psf: must be a non-negative number",
          },
          400,
        );
      }

      const pirData = {
        program_owner: program_owner || "",
        budget_from_division: budgetDiv,
        budget_from_co_psf: budgetPsf,
        functional_division: functional_division ?? null,
        indicator_quarterly_targets: indicator_quarterly_targets ?? [],
        action_items: action_items ?? [],
        status: "Draft",
      };

      const factorData = transformFactors(factors);
      const reviewData = transformActivityReviews(activity_reviews);

      const resource = pirResourceKey(aip.id, sanitizedQuarter);
      const pir = await mapTargetlessUniqueConflict(
        withAdvisoryLock(
          LOCK_NAMESPACE.PIR,
          resource,
          async (tx) => {
            const existing = await fetchPIRForUser(
              aip.id,
              sanitizedQuarter,
              undefined,
              tx,
            );
            if (existing && existing.status !== "Draft") {
              throw new ConflictError(
                "A PIR has already been submitted for this quarter",
              );
            }

            if (existing) {
              await tx.pIRActivityReview.deleteMany({
                where: { pir_id: existing.id },
              });
              await tx.pIRFactor.deleteMany({ where: { pir_id: existing.id } });
              return tx.pIR.update({
                where: { id: existing.id },
                data: {
                  ...pirData,
                  factors: { create: factorData },
                  activity_reviews: { create: reviewData },
                },
              });
            }

            return tx.pIR.create({
              data: {
                aip_id: aip.id,
                created_by_user_id: tokenUser.id,
                quarter: sanitizedQuarter,
                ...pirData,
                factors: { create: factorData },
                activity_reviews: { create: reviewData },
              },
            });
          },
        ),
      );

      return c.json({ message: "PIR draft saved successfully", pir });
    },
  ),
);

draftsRoutes.get(
  "/pirs/draft",
  asyncHandler(
    "Failed to load PIR draft",
    "Failed to load PIR draft",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programTitle = c.req.query("program_title");
      const quarter = c.req.query("quarter")
        ? tokenUser.role === "School"
          ? normalizeTrimesterLabel(sanitizeString(c.req.query("quarter")))
          : normalizeQuarterLabel(sanitizeString(c.req.query("quarter")))
        : undefined;

      if (!programTitle) {
        const aipWhere = tokenUser.role === "School" && tokenUser.school_id
          ? { school_id: tokenUser.school_id }
          : { created_by_user_id: tokenUser.id, school_id: null };

        const anyDraft = await prisma.pIR.findFirst({
          where: { status: "Draft", aip: aipWhere },
          include: { aip: { include: { program: true } } },
          orderBy: { created_at: "desc" },
        });

        if (!anyDraft) return c.json({ hasDraft: false });
        return c.json({
          hasDraft: true,
          draftProgram: anyDraft.aip.program.title,
          lastSaved: anyDraft.created_at,
        });
      }

      const yearMatch = quarter?.match(/CY (\d{4})/);
      const year = yearMatch
        ? safeParseInt(
          yearMatch[1],
          getDefaultReportingYear(tokenUser.role),
          2020,
          2100,
        )
        : getDefaultReportingYear(tokenUser.role);

      const program = await fetchProgramByTitle(programTitle);
      if (!program) return c.json({ hasDraft: false });

      const aip = await fetchAIPForUser(tokenUser, program.id, year);
      if (!aip) return c.json({ hasDraft: false });

      const pir = quarter
        ? await fetchPIRForUser(aip.id, quarter, {
          activity_reviews: { orderBy: { id: "asc" } },
          factors: true,
        })
        : await prisma.pIR.findFirst({
          where: { aip_id: aip.id, status: "Draft" },
          include: {
            activity_reviews: { orderBy: { id: "asc" } },
            factors: true,
          },
        });

      if (!pir || pir.status !== "Draft") return c.json({ hasDraft: false });

      const typedPir = pir as PIRWithFactorsAndReviews;
      const factorsMap: Record<string, unknown> = {};
      for (const factor of typedPir.factors) {
        factorsMap[factor.factor_type] = factorFieldsToClientShape(factor);
      }

      return c.json({
        hasDraft: true,
        draftData: {
          program: programTitle,
          quarter: typedPir.quarter,
          owner: typedPir.program_owner,
          budgetFromDivision: String(typedPir.budget_from_division ?? 0),
          budgetFromCoPSF: String(typedPir.budget_from_co_psf ?? 0),
          functionalDivision: typedPir.functional_division ?? null,
          indicatorQuarterlyTargets:
            typedPir.indicator_quarterly_targets as any[] ?? [],
          actionItems: typedPir.action_items as any[] ?? [],
          activities: (() => {
            let unplannedIndex = 0;
            return typedPir.activity_reviews.map((review) => {
              const clientId = pirActivityClientId(review, unplannedIndex);
              if (review.is_unplanned) unplannedIndex += 1;
              return {
                id: clientId,
                aip_activity_id: review.aip_activity_id,
                fromAIP: Boolean(review.aip_activity_id),
                complied: review.complied,
                actualTasksConducted: review.actual_tasks_conducted ?? "",
                contributoryIndicators:
                  review.contributory_performance_indicators ?? "",
                movsExpectedOutputs: review.movs_expected_outputs ?? "",
                adjustments: review.adjustments ?? "",
                isUnplanned: review.is_unplanned ?? false,
                physTarget: String(review.physical_target),
                finTarget: String(review.financial_target),
                physAcc: String(review.physical_accomplished),
                finAcc: String(review.financial_accomplished),
                actions: review.actions_to_address_gap || "",
              };
            });
          })(),
          factors: factorsMap,
        },
        lastSaved: typedPir.created_at,
      });
    },
  ),
);

draftsRoutes.delete(
  "/pirs/draft",
  asyncHandler(
    "Failed to delete PIR draft",
    "Failed to delete PIR draft",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programTitle = c.req.query("program_title");
      const quarter = c.req.query("quarter")
        ? tokenUser.role === "School"
          ? normalizeTrimesterLabel(sanitizeString(c.req.query("quarter")))
          : normalizeQuarterLabel(sanitizeString(c.req.query("quarter")))
        : undefined;

      if (!programTitle || !quarter) {
        return c.json(
          { error: "program_title and quarter are required" },
          400,
        );
      }

      const yearMatch = quarter.match(/CY (\d{4})/);
      const year = yearMatch
        ? safeParseInt(
          yearMatch[1],
          getDefaultReportingYear(tokenUser.role),
          2020,
          2100,
        )
        : getDefaultReportingYear(tokenUser.role);

      const program = await fetchProgramByTitle(programTitle);
      if (!program) return c.json({ message: "No draft found" });

      const aip = await fetchAIPForUser(tokenUser, program.id, year);
      if (!aip) return c.json({ message: "No draft found" });

      const pir = await fetchPIRForUser(aip.id, quarter);
      if (pir && pir.status === "Draft") {
        await withAdvisoryLock(
          LOCK_NAMESPACE.PIR,
          pirResourceKeyFromRecord(pir),
          async (tx) => {
            const lockedPir = await tx.pIR.findUnique({
              where: { id: pir.id },
            });
            if (lockedPir?.status === "Draft") {
              await tx.pIR.delete({ where: { id: pir.id } });
            }
          },
        );
      }

      return c.json({ message: "Draft deleted" });
    },
  ),
);

export default draftsRoutes;
