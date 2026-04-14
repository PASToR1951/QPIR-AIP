import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getCESRoleForDivisionPIR, CES_ROLES } from "../../lib/routing.ts";
import { logger } from "../../lib/logger.ts";
import { pushNotifications } from "../../lib/notifStream.ts";
import { sanitizeObject, sanitizeString } from "../../lib/sanitize.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth, verifySchoolCluster } from "./shared/guards.ts";
import { writeUserLog, getClientIp } from "../../lib/userActivityLog.ts";
import { fetchAIPForUser, fetchPIRForUser, fetchProgramByTitle } from "./shared/lookups.ts";
import {
  transformActivityReviews,
  transformFactors,
  validateBudgetAmount,
} from "./shared/normalize.ts";
import type {
  AIPWithProgramSchoolClusterActivities,
  AIPWithProgramSchool,
  DataRouteEnv,
  PIRWithReviewActivitiesAndFactors,
} from "./shared/types.ts";

const pirRoutes = new Hono<{ Variables: DataRouteEnv }>();

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

async function validateQuarterSubmissionWindow(
  year: number,
  quarterNum: number,
): Promise<string | null> {
  const deadlineRecord = await prisma.deadline.findUnique({
    where: { year_quarter: { year, quarter: quarterNum } },
  });

  const deadline = buildDeadline(year, quarterNum, deadlineRecord?.date ?? undefined);
  const graceDays = deadlineRecord?.grace_period_days ?? 0;
  const graceEnd = new Date(deadline.getTime() + graceDays * 86400000);
  graceEnd.setHours(23, 59, 59, 999);

  const quarterStarts: Record<number, Date> = {
    1: new Date(year, 0, 1),
    2: new Date(year, 3, 1),
    3: new Date(year, 6, 1),
    4: new Date(year, 9, 1),
  };

  const openDate = deadlineRecord?.open_date
    ? new Date(deadlineRecord.open_date)
    : quarterStarts[quarterNum];
  const now = new Date();

  if (now < openDate) {
    return "Submission window has not opened yet for this quarter.";
  }
  if (now > graceEnd) {
    return "The submission window for this quarter is closed.";
  }
  return null;
}

pirRoutes.use("/pirs", requireAuth());
pirRoutes.use("/pirs/*", requireAuth());

pirRoutes.get(
  "/pirs",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch PIR",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programTitle = c.req.query("program_title") || "";
      const quarter = c.req.query("quarter") || "";

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
      if (!program) {
        return c.json({ error: `Program '${programTitle}' not found` }, 404);
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        school: true,
        program: true,
      }) as AIPWithProgramSchool | null;
      if (!aip) return c.json({ error: "No AIP found for this program" }, 404);

      const pir = await fetchPIRForUser(aip.id, quarter, {
        activity_reviews: { include: { aip_activity: true } },
        factors: true,
      }) as PIRWithReviewActivitiesAndFactors | null;
      if (!pir) {
        return c.json({ error: "No submitted PIR found for this quarter" }, 404);
      }

      if (tokenUser.role === "School" && aip.school_id !== tokenUser.school_id) {
        return c.json({ error: "Forbidden" }, 403);
      }
      if (
        pir.created_by_user_id !== null &&
        pir.created_by_user_id !== tokenUser.id &&
        tokenUser.role !== "Division Personnel" &&
        tokenUser.role !== "School"
      ) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const factorsMap: Record<string, unknown> = {};
      for (const factor of pir.factors) {
        factorsMap[factor.factor_type] = {
          facilitating: factor.facilitating_factors,
          hindering: factor.hindering_factors,
          recommendations: factor.recommendations ?? "",
        };
      }

      await prisma.auditLog.create({
        data: {
          admin_id: tokenUser.id,
          action: "user_read_pir",
          entity_type: "PIR",
          entity_id: pir.id,
          details: { quarter: pir.quarter },
        },
      });

      return c.json({
        id: pir.id,
        status: pir.status,
        quarter: pir.quarter,
        program: aip.program.title,
        school: aip.school?.name ?? "Division",
        owner: pir.program_owner,
        budgetFromDivision: pir.budget_from_division,
        budgetFromCoPSF: pir.budget_from_co_psf,
        functionalDivision: pir.functional_division ?? null,
        indicatorQuarterlyTargets: pir.indicator_quarterly_targets as any[] ?? [],
        actionItems: pir.action_items as any[] ?? [],
        activities: pir.activity_reviews.map((review) => ({
          id: review.id,
          name: review.aip_activity?.activity_name ?? "",
          implementation_period: review.aip_activity?.implementation_period ?? "",
          period_start_month: review.aip_activity?.period_start_month ?? null,
          period_end_month: review.aip_activity?.period_end_month ?? null,
          complied: review.complied,
          actualTasksConducted: review.actual_tasks_conducted ?? "",
          contributoryIndicators:
            review.contributory_performance_indicators ?? "",
          movsExpectedOutputs: review.movs_expected_outputs ?? "",
          adjustments: review.adjustments ?? "",
          isUnplanned: review.is_unplanned ?? false,
          physTarget: review.physical_target,
          finTarget: review.financial_target,
          physAcc: review.physical_accomplished,
          finAcc: review.financial_accomplished,
          actions: review.actions_to_address_gap ?? "",
        })),
        factors: factorsMap,
      });
    },
  ),
);

pirRoutes.post(
  "/pirs",
  asyncHandler(
    "Unhandled route error",
    "Failed to create PIR",
    async (c) => {
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

      const tokenUser = getAuthedUser(c);
      const clusterErr = await verifySchoolCluster(tokenUser);
      if (clusterErr) return c.json({ error: clusterErr }, 403);

      const cleanProgramTitle = sanitizeString(program_title);
      const cleanQuarter = sanitizeString(quarter);

      const program = await fetchProgramByTitle(cleanProgramTitle);
      if (!program) return c.json({ error: "Resource not found" }, 404);

      const yearMatch = cleanQuarter.match(/CY (\d{4})/);
      const year = yearMatch
        ? safeParseInt(yearMatch[1], new Date().getFullYear(), 2020, 2100)
        : new Date().getFullYear();

      const qNumMatch = cleanQuarter.match(/(\d+)(?:st|nd|rd|th) Quarter/);
      const quarterNum = qNumMatch ? safeParseInt(qNumMatch[1], 0, 1, 4) : null;
      if (quarterNum) {
        const submissionWindowError = await validateQuarterSubmissionWindow(
          year,
          quarterNum,
        );
        if (submissionWindowError) {
          return c.json({ error: submissionWindowError }, 403);
        }
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
        program: true,
        school: { include: { cluster: true } },
      }) as AIPWithProgramSchoolClusterActivities | null;
      if (!aip) return c.json({ error: "Resource not found" }, 404);

      if (
        (tokenUser.role === "Division Personnel" || CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])) &&
        aip.created_by_user_id !== tokenUser.id
      ) {
        return c.json({ error: "Access denied" }, 403);
      }

      let pirBudgetDiv: number;
      let pirBudgetPsf: number;
      try {
        pirBudgetDiv = validateBudgetAmount(budget_from_division);
      } catch {
        return c.json(
          {
            error: "Invalid budget_from_division: must be a non-negative number",
          },
          400,
        );
      }
      try {
        pirBudgetPsf = validateBudgetAmount(budget_from_co_psf);
      } catch {
        return c.json(
          { error: "Invalid budget_from_co_psf: must be a non-negative number" },
          400,
        );
      }

      const factorData = transformFactors(factors);
      const reviewData = transformActivityReviews(activity_reviews);
      const existingDraft = await fetchPIRForUser(aip.id, cleanQuarter);
      const inProgressStatuses = [
        "For CES Review",
        "For Cluster Head Review",
        "For Admin Review",
        "Under Review",
      ];

      if (existingDraft && inProgressStatuses.includes(existingDraft.status)) {
        return c.json(
          {
            error: "A PIR has already been submitted for this program and quarter.",
          },
          409,
        );
      }

      let pir;
      if (existingDraft && existingDraft.status === "Draft") {
        await prisma.pIRActivityReview.deleteMany({ where: { pir_id: existingDraft.id } });
        await prisma.pIRFactor.deleteMany({ where: { pir_id: existingDraft.id } });
        pir = await prisma.pIR.update({
          where: { id: existingDraft.id },
          data: {
            program_owner,
            budget_from_division: pirBudgetDiv,
            budget_from_co_psf: pirBudgetPsf,
            functional_division: functional_division ?? null,
            indicator_quarterly_targets: indicator_quarterly_targets ?? [],
            action_items: action_items ?? [],
            status: aip.school_id !== null
              ? "For Cluster Head Review"
              : CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])
              ? "For Admin Review"
              : "For CES Review",
            factors: { create: factorData },
            activity_reviews: { create: reviewData },
          },
        });
      } else {
        pir = await prisma.pIR.create({
          data: {
            aip_id: aip.id,
            created_by_user_id: tokenUser.id,
            quarter: cleanQuarter,
            program_owner,
            budget_from_division: pirBudgetDiv,
            budget_from_co_psf: pirBudgetPsf,
            functional_division: functional_division ?? null,
            indicator_quarterly_targets: indicator_quarterly_targets ?? [],
            action_items: action_items ?? [],
            status: aip.school_id !== null
              ? "For Cluster Head Review"
              : CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])
              ? "For Admin Review"
              : "For CES Review",
            factors: { create: factorData },
            activity_reviews: { create: reviewData },
          },
        });
      }

      let submitterLabel: string;
      if (aip.school?.name) {
        submitterLabel = sanitizeString(aip.school.name);
      } else {
        const submitter = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          select: { name: true, email: true },
        });
        submitterLabel = sanitizeString(submitter?.name ?? submitter?.email ?? "A user");
      }

      const pirAdmins = await prisma.user.findMany({
        where: { role: "Admin" },
        select: { id: true },
      });

      let reviewerIds: number[] = [];
      if (tokenUser.role === "School") {
        const clusterCoords = await prisma.user.findMany({
          where: {
            role: "Cluster Coordinator",
            cluster_id: aip.school?.cluster_id ?? null,
            is_active: true,
          },
          select: { id: true },
        });
        reviewerIds = clusterCoords.map((user: { id: number }) => user.id);
      } else if (tokenUser.role === "Cluster Coordinator") {
        const cesCID = await prisma.user.findMany({
          where: { role: "CES-CID", is_active: true },
          select: { id: true },
        });
        reviewerIds = cesCID.map((user: { id: number }) => user.id);
      } else if (CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])) {
        // CES-submitted PIRs go directly to Admin — no intermediate reviewer to notify
        reviewerIds = [];
      } else {
        const cesRole = getCESRoleForDivisionPIR(aip.program?.division ?? null);
        const cesUsers = await prisma.user.findMany({
          where: { role: cesRole, is_active: true },
          select: { id: true },
        });
        reviewerIds = cesUsers.map((user: { id: number }) => user.id);
      }

      const notifyIds = [...new Set([
        ...reviewerIds,
        ...pirAdmins.map((user: { id: number }) => user.id),
      ])];
      if (notifyIds.length > 0) {
        const pirNotifs = await prisma.notification.createManyAndReturn({
          data: notifyIds.map((userId) => ({
            user_id: userId,
            title: "New PIR Submitted",
            message:
              `${submitterLabel} submitted a PIR for ${cleanProgramTitle} (${cleanQuarter}).`,
            type: "pir_submitted",
            entity_id: pir.id,
            entity_type: "pir",
          })),
        });
        pushNotifications(pirNotifs);
      }

      writeUserLog({ userId: tokenUser.id, action: "pir_submit", entityType: "PIR", entityId: pir.id, details: { programTitle: cleanProgramTitle, quarter: cleanQuarter }, ipAddress: getClientIp(c) });
      return c.json({ message: "PIR created successfully", pir });
    },
  ),
);

pirRoutes.put(
  "/pirs/:id",
  asyncHandler(
    "Unhandled route error",
    "Failed to update PIR",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const clusterErr = await verifySchoolCluster(tokenUser);
      if (clusterErr) return c.json({ error: clusterErr }, 403);

      const pirId = safeParseInt(c.req.param("id"), 0);
      if (pirId === 0) return c.json({ error: "Invalid PIR id" }, 400);

      const pir = await prisma.pIR.findUnique({ where: { id: pirId } });
      if (!pir) return c.json({ error: "PIR not found" }, 404);

      if (pir.created_by_user_id === null || pir.created_by_user_id !== tokenUser.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
      if (
        pir.status !== "For CES Review" &&
        pir.status !== "For Cluster Head Review" &&
        pir.status !== "Returned"
      ) {
        return c.json(
          {
            error:
              "This PIR can no longer be edited — it is currently under review.",
          },
          409,
        );
      }

      const body = sanitizeObject(await c.req.json());
      const {
        program_owner,
        budget_from_division,
        budget_from_co_psf,
        functional_division,
        indicator_quarterly_targets,
        action_items,
        activity_reviews,
        factors,
      } = body;

      let putBudgetDiv: number;
      let putBudgetPsf: number;
      try {
        putBudgetDiv = validateBudgetAmount(budget_from_division);
      } catch {
        return c.json(
          {
            error: "Invalid budget_from_division: must be a non-negative number",
          },
          400,
        );
      }
      try {
        putBudgetPsf = validateBudgetAmount(budget_from_co_psf);
      } catch {
        return c.json(
          { error: "Invalid budget_from_co_psf: must be a non-negative number" },
          400,
        );
      }

      const factorData = transformFactors(factors);
      const reviewData = transformActivityReviews(activity_reviews);
      const pirAip = await prisma.aIP.findUnique({
        where: { id: pir.aip_id },
        select: { school_id: true },
      });
      const resubmitStatus = pirAip?.school_id !== null
        ? "For Cluster Head Review"
        : "For CES Review";

      await prisma.pIRActivityReview.deleteMany({ where: { pir_id: pirId } });
      await prisma.pIRFactor.deleteMany({ where: { pir_id: pirId } });

      const updated = await prisma.pIR.update({
        where: { id: pirId },
        data: {
          program_owner,
          budget_from_division: putBudgetDiv,
          budget_from_co_psf: putBudgetPsf,
          functional_division: functional_division ?? null,
          indicator_quarterly_targets: indicator_quarterly_targets ?? [],
          action_items: action_items ?? [],
          status: resubmitStatus,
          factors: { create: factorData },
          activity_reviews: { create: reviewData },
        },
      });

      writeUserLog({ userId: tokenUser.id, action: "pir_update", entityType: "PIR", entityId: pirId, details: { quarter: pir.quarter }, ipAddress: getClientIp(c) });
      return c.json({ message: "PIR updated successfully", pir: updated });
    },
  ),
);

pirRoutes.delete(
  "/pirs/:id",
  asyncHandler(
    "Failed to delete PIR",
    "Failed to delete PIR",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const pirId = safeParseInt(c.req.param("id"), 0);
      if (pirId === 0) return c.json({ error: "Invalid PIR id" }, 400);

      const pir = await prisma.pIR.findUnique({ where: { id: pirId } });
      if (!pir) return c.json({ error: "PIR not found" }, 404);

      if (pir.created_by_user_id === null || pir.created_by_user_id !== tokenUser.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
      if (
        pir.status !== "For CES Review" &&
        pir.status !== "For Cluster Head Review" &&
        pir.status !== "Returned"
      ) {
        return c.json(
          {
            error:
              "This PIR can no longer be deleted — it is currently under review.",
          },
          409,
        );
      }

      await prisma.pIR.delete({ where: { id: pirId } });
      writeUserLog({ userId: tokenUser.id, action: "pir_delete", entityType: "PIR", entityId: pirId, details: { quarter: pir.quarter }, ipAddress: getClientIp(c) });
      return c.json({ message: "PIR deleted successfully" });
    },
  ),
);

export default pirRoutes;
