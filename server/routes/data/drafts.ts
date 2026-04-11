import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { sanitizeObject, sanitizeString } from "../../lib/sanitize.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import { fetchAIPForUser, fetchPIRForUser, fetchProgramByTitle } from "./shared/lookups.ts";
import {
  normalizeIndicators,
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
        program_title,
        year: rawYear,
        outcome,
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

      if (!program_title) {
        return c.json({ error: "program_title is required" }, 400);
      }

      const cleanProgramTitle = sanitizeString(program_title);
      const program = await fetchProgramByTitle(cleanProgramTitle);
      if (!program) return c.json({ error: "Resource not found" }, 404);

      const year = safeParseInt(rawYear, new Date().getFullYear(), 2020, 2100);
      const schoolId = tokenUser.role === "School" ? tokenUser.school_id : null;

      const existing = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
      }) as AIPWithActivities | null;

      if (existing && existing.status !== "Draft") {
        return c.json(
          { error: "An AIP has already been submitted for this program and year" },
          409,
        );
      }
      if (existing && existing.archived) {
        return c.json(
          { error: "This AIP has been archived and cannot be modified" },
          409,
        );
      }

      const aipData = {
        outcome: outcome || "",
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

      let aip;
      if (existing) {
        await prisma.aIPActivity.deleteMany({ where: { aip_id: existing.id } });
        aip = await prisma.aIP.update({
          where: { id: existing.id },
          data: {
            ...aipData,
            activities: { create: activityData },
          },
          include: { activities: true },
        });
      } else {
        aip = await prisma.aIP.create({
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
      }

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
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

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
      const draftData = {
        outcome: aip.outcome,
        year: String(aip.year),
        depedProgram: aip.program.title,
        sipTitle: aip.sip_title,
        projectCoord: aip.project_coordinator,
        objectives: aip.objectives,
        indicators: aip.indicators,
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
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
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

      if (programTitle) {
        const program = await fetchProgramByTitle(programTitle);
        if (program) where.program_id = program.id;
      }

      await prisma.aIP.deleteMany({ where });
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
      const sanitizedQuarter = sanitizeString(quarter);
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
        ? safeParseInt(yearMatch[1], new Date().getFullYear(), 2020, 2100)
        : new Date().getFullYear();

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
      }) as AIPWithActivities | null;
      if (!aip) return c.json({ error: "Resource not found" }, 404);

      const existing = await fetchPIRForUser(aip.id, sanitizedQuarter);
      if (existing && existing.status !== "Draft") {
        return c.json(
          { error: "A PIR has already been submitted for this quarter" },
          409,
        );
      }

      let budgetDiv: number;
      let budgetPsf: number;
      try {
        budgetDiv = validateBudgetAmount(budget_from_division);
      } catch {
        return c.json(
          {
            error: "Invalid budget_from_division: must be a non-negative number",
          },
          400,
        );
      }
      try {
        budgetPsf = validateBudgetAmount(budget_from_co_psf);
      } catch {
        return c.json(
          { error: "Invalid budget_from_co_psf: must be a non-negative number" },
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

      let pir;
      if (existing) {
        await prisma.pIRActivityReview.deleteMany({ where: { pir_id: existing.id } });
        await prisma.pIRFactor.deleteMany({ where: { pir_id: existing.id } });
        pir = await prisma.pIR.update({
          where: { id: existing.id },
          data: {
            ...pirData,
            factors: { create: factorData },
            activity_reviews: { create: reviewData },
          },
        });
      } else {
        pir = await prisma.pIR.create({
          data: {
            aip_id: aip.id,
            created_by_user_id: tokenUser.id,
            quarter: sanitizedQuarter,
            ...pirData,
            factors: { create: factorData },
            activity_reviews: { create: reviewData },
          },
        });
      }

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
      const quarter = c.req.query("quarter");

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
        ? safeParseInt(yearMatch[1], new Date().getFullYear(), 2020, 2100)
        : new Date().getFullYear();

      const program = await fetchProgramByTitle(programTitle);
      if (!program) return c.json({ hasDraft: false });

      const aip = await fetchAIPForUser(tokenUser, program.id, year);
      if (!aip) return c.json({ hasDraft: false });

      const pir = quarter
        ? await fetchPIRForUser(aip.id, quarter, {
          activity_reviews: true,
          factors: true,
        })
        : await prisma.pIR.findFirst({
          where: { aip_id: aip.id, status: "Draft" },
          include: { activity_reviews: true, factors: true },
        });

      if (!pir || pir.status !== "Draft") return c.json({ hasDraft: false });

      const typedPir = pir as PIRWithFactorsAndReviews;
      const factorsMap: Record<string, unknown> = {};
      for (const factor of typedPir.factors) {
        factorsMap[factor.factor_type] = {
          facilitating: factor.facilitating_factors,
          hindering: factor.hindering_factors,
          recommendations: factor.recommendations ?? "",
        };
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
          indicatorQuarterlyTargets: typedPir.indicator_quarterly_targets as
            any[] ?? [],
          actionItems: typedPir.action_items as any[] ?? [],
          activities: typedPir.activity_reviews.map((review) => ({
            aip_activity_id: review.aip_activity_id,
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
          })),
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
      const quarter = c.req.query("quarter");

      if (!programTitle || !quarter) {
        return c.json(
          { error: "program_title and quarter are required" },
          400,
        );
      }

      const yearMatch = quarter.match(/CY (\d{4})/);
      const year = yearMatch
        ? safeParseInt(yearMatch[1], new Date().getFullYear(), 2020, 2100)
        : new Date().getFullYear();

      const program = await fetchProgramByTitle(programTitle);
      if (!program) return c.json({ message: "No draft found" });

      const aip = await fetchAIPForUser(tokenUser, program.id, year);
      if (!aip) return c.json({ message: "No draft found" });

      const pir = await fetchPIRForUser(aip.id, quarter);
      if (pir && pir.status === "Draft") {
        await prisma.pIR.delete({ where: { id: pir.id } });
      }

      return c.json({ message: "Draft deleted" });
    },
  ),
);

export default draftsRoutes;
