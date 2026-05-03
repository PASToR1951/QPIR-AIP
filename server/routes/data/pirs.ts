import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { CES_ROLES, getCESRoleForDivisionPIR } from "../../lib/routing.ts";
import { logger } from "../../lib/logger.ts";
import { pushNotifications } from "../../lib/notifStream.ts";
import { sanitizeObject, sanitizeString } from "../../lib/sanitize.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import {
  getAuthedUser,
  requireAuth,
  verifySchoolCluster,
} from "./shared/guards.ts";
import { writeUserLog } from "../../lib/userActivityLog.ts";
import { getClientIp } from "../../lib/clientIp.ts";
import {
  LOCK_NAMESPACE,
  pirResourceKey,
  pirResourceKeyFromRecord,
  withAdvisoryLock,
} from "../../lib/advisoryLock.ts";
import { ConflictError, HttpError } from "../../lib/errors.ts";
import { isPrismaUniqueConflictWithoutTarget } from "../../lib/prismaErrors.ts";
import { normalizeQuarterLabel, parseQuarterLabel } from "../../lib/quarters.ts";
import {
  getDefaultReportingYear,
  normalizeTrimesterLabel,
  parseTrimesterLabel,
} from "../../lib/trimesters.ts";
import {
  fetchAIPForUser,
  fetchPIRForUser,
  fetchProgramByTitle,
} from "./shared/lookups.ts";
import {
  factorFieldsToClientShape,
  pirActivityClientId,
  transformActivityReviews,
  transformFactors,
  validateBudgetAmount,
} from "./shared/normalize.ts";
import type {
  AIPWithProgramSchool,
  AIPWithProgramSchoolClusterActivities,
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

  const deadline = buildDeadline(
    year,
    quarterNum,
    deadlineRecord?.date ?? undefined,
  );
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

async function validateTrimesterSubmissionWindow(
  year: number,
  trimester: number,
): Promise<string | null> {
  const deadlineRecord = await prisma.trimesterDeadline.findUnique({
    where: { year_trimester: { year, trimester } },
  });

  if (!deadlineRecord) {
    return "Submission window not configured for this trimester — contact your administrator.";
  }

  const deadline = new Date(deadlineRecord.date);
  deadline.setHours(23, 59, 59, 999);
  const graceEnd = new Date(
    deadline.getTime() + deadlineRecord.grace_period_days * 86400000,
  );
  graceEnd.setHours(23, 59, 59, 999);
  const openDate = new Date(deadlineRecord.open_date);
  const now = new Date();

  if (now < openDate) {
    return "Submission window has not opened yet for this trimester.";
  }
  if (now > graceEnd) {
    return "The submission window for this trimester is closed.";
  }
  return null;
}

async function validateSubmissionWindowForRole(
  role: string,
  periodLabel: string,
): Promise<string | null> {
  if (role === "School") {
    const parsed = parseTrimesterLabel(periodLabel);
    if (!parsed) return "Invalid trimester label.";
    return validateTrimesterSubmissionWindow(parsed.year, parsed.trimester);
  }

  const parsed = parseQuarterLabel(periodLabel);
  if (!parsed) return null;
  return validateQuarterSubmissionWindow(parsed.year, parsed.quarter);
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

async function getActiveFocalPersonIds(programId: number): Promise<number[]> {
  const focalPeople = await prisma.programFocalPerson.findMany({
    where: {
      program_id: programId,
      user: { role: "Division Personnel", is_active: true },
    },
    select: { user_id: true },
  });
  return focalPeople.map((person) => person.user_id);
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
      const quarter = tokenUser.role === "School"
        ? normalizeTrimesterLabel(sanitizeString(c.req.query("quarter") || ""))
        : normalizeQuarterLabel(sanitizeString(c.req.query("quarter") || ""));

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
      if (!program) {
        return c.json({ error: `Program '${programTitle}' not found` }, 404);
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        school: true,
        program: true,
      }) as AIPWithProgramSchool | null;
      if (!aip) return c.json({ error: "No AIP found for this program" }, 404);

      const pir = await fetchPIRForUser(aip.id, quarter, {
        activity_reviews: {
          orderBy: { id: "asc" },
          include: { aip_activity: true },
        },
        factors: true,
      }) as PIRWithReviewActivitiesAndFactors | null;
      if (!pir) {
        return c.json(
          { error: "No submitted PIR found for this quarter" },
          404,
        );
      }

      if (
        tokenUser.role === "School" && aip.school_id !== tokenUser.school_id
      ) {
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
        factorsMap[factor.factor_type] = factorFieldsToClientShape(factor);
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
        cesRemarks: pir.ces_remarks ?? null,
        quarter: pir.quarter,
        program: aip.program.title,
        school: aip.school?.name ?? "Division",
        owner: pir.program_owner,
        budgetFromDivision: pir.budget_from_division,
        budgetFromCoPSF: pir.budget_from_co_psf,
        functionalDivision: pir.functional_division ?? null,
        indicatorQuarterlyTargets: pir.indicator_quarterly_targets as any[] ??
          [],
        actionItems: pir.action_items as any[] ?? [],
        activities: (() => {
          let unplannedIndex = 0;
          return pir.activity_reviews.map((review) => {
            const clientId = pirActivityClientId(review, unplannedIndex);
            if (review.is_unplanned) unplannedIndex += 1;
            return {
              id: clientId,
              aip_activity_id: review.aip_activity_id,
              fromAIP: Boolean(review.aip_activity_id),
              name: review.aip_activity?.activity_name ?? "",
              implementation_period:
                review.aip_activity?.implementation_period ??
                  "",
              period_start_month: review.aip_activity?.period_start_month ??
                null,
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
            };
          });
        })(),
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
      const cleanQuarter = tokenUser.role === "School"
        ? normalizeTrimesterLabel(sanitizeString(quarter))
        : normalizeQuarterLabel(sanitizeString(quarter));

      const program = await fetchProgramByTitle(cleanProgramTitle);
      if (!program) return c.json({ error: "Resource not found" }, 404);

      const yearMatch = cleanQuarter.match(/CY (\d{4})/);
      const year = yearMatch
        ? safeParseInt(
          yearMatch[1],
          getDefaultReportingYear(tokenUser.role),
          2020,
          2100,
        )
        : getDefaultReportingYear(tokenUser.role);

      const submissionWindowError = await validateSubmissionWindowForRole(
        tokenUser.role,
        cleanQuarter,
      );
      if (submissionWindowError) {
        const status = submissionWindowError.startsWith("Invalid") ? 400 : 403;
        return c.json({ error: submissionWindowError }, status);
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
        program: true,
        school: { include: { cluster: true } },
      }) as AIPWithProgramSchoolClusterActivities | null;
      if (!aip) return c.json({ error: "Resource not found" }, 404);

      const isSchoolSubmission = tokenUser.role === "School" &&
        aip.school_id !== null;
      if (isSchoolSubmission && aip.status !== "Approved") {
        throw new ConflictError(
          "PIR submission is available only after the related AIP is approved.",
        );
      }
      const focalPersonIds = isSchoolSubmission
        ? await getActiveFocalPersonIds(program.id)
        : [];
      if (isSchoolSubmission && focalPersonIds.length === 0) {
        return c.json(
          {
            error:
              "No focal persons assigned to this program. Contact your administrator.",
          },
          400,
        );
      }

      if (
        (tokenUser.role === "Division Personnel" ||
          CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])) &&
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
            error:
              "Invalid budget_from_division: must be a non-negative number",
          },
          400,
        );
      }
      try {
        pirBudgetPsf = validateBudgetAmount(budget_from_co_psf);
      } catch {
        return c.json(
          {
            error: "Invalid budget_from_co_psf: must be a non-negative number",
          },
          400,
        );
      }

      const factorData = transformFactors(factors);
      const reviewData = transformActivityReviews(activity_reviews);
      const nextStatus = isSchoolSubmission
        ? "For Recommendation"
        : CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])
        ? "For Admin Review"
        : "For CES Review";
      const resource = pirResourceKey(aip.id, cleanQuarter);
      const pir = await mapTargetlessUniqueConflict(
        withAdvisoryLock(
          LOCK_NAMESPACE.PIR,
          resource,
          async (tx) => {
            const existingDraft = await fetchPIRForUser(
              aip.id,
              cleanQuarter,
              undefined,
              tx,
            );

            if (existingDraft && existingDraft.status !== "Draft") {
              if (existingDraft.status === "Returned") {
                throw new ConflictError(
                  "This PIR was returned for correction. Please update the returned PIR instead of submitting a new one.",
                );
              }
              throw new ConflictError(
                "A PIR has already been submitted for this program and quarter.",
              );
            }

            if (existingDraft) {
              await tx.pIRActivityReview.deleteMany({
                where: { pir_id: existingDraft.id },
              });
              await tx.pIRFactor.deleteMany({
                where: { pir_id: existingDraft.id },
              });
              return tx.pIR.update({
                where: { id: existingDraft.id },
                data: {
                  program_owner,
                  budget_from_division: pirBudgetDiv,
                  budget_from_co_psf: pirBudgetPsf,
                  functional_division: functional_division ?? null,
                  indicator_quarterly_targets: indicator_quarterly_targets ??
                    [],
                  action_items: action_items ?? [],
                  status: nextStatus,
                  ...(isSchoolSubmission && {
                    focal_person_id: null,
                    focal_recommended_at: null,
                    focal_remarks: null,
                    ces_reviewer_id: null,
                    ces_noted_at: null,
                    ces_remarks: null,
                    active_reviewer_id: null,
                    active_review_started_at: null,
                  }),
                  factors: { create: factorData },
                  activity_reviews: { create: reviewData },
                },
              });
            }

            return tx.pIR.create({
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
                status: nextStatus,
                factors: { create: factorData },
                activity_reviews: { create: reviewData },
              },
            });
          },
        ),
      );

      let submitterLabel: string;
      if (aip.school?.name) {
        submitterLabel = sanitizeString(aip.school.name);
      } else {
        const submitter = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          select: { name: true, email: true },
        });
        submitterLabel = sanitizeString(
          submitter?.name ?? submitter?.email ?? "A user",
        );
      }

      const pirAdmins = await prisma.user.findMany({
        where: { role: "Admin" },
        select: { id: true },
      });

      let reviewerIds: number[] = [];
      if (isSchoolSubmission) {
        reviewerIds = focalPersonIds;
      } else if (
        CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])
      ) {
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

      const notifyIds = isSchoolSubmission ? [...new Set(reviewerIds)] : [
        ...new Set([
          ...reviewerIds,
          ...pirAdmins.map((user: { id: number }) => user.id),
        ]),
      ];
      if (notifyIds.length > 0) {
        const pirNotifs = await prisma.notification.createManyAndReturn({
          data: notifyIds.map((userId) => ({
            user_id: userId,
            title: isSchoolSubmission
              ? "PIR Pending Recommendation"
              : "New PIR Submitted",
            message: isSchoolSubmission
              ? `${submitterLabel} submitted a PIR for ${cleanProgramTitle} (${cleanQuarter}) for your recommendation.`
              : `${submitterLabel} submitted a PIR for ${cleanProgramTitle} (${cleanQuarter}).`,
            type: isSchoolSubmission ? "for_recommendation" : "pir_submitted",
            entity_id: pir.id,
            entity_type: "pir",
          })),
        });
        pushNotifications(pirNotifs);
      }

      writeUserLog({
        userId: tokenUser.id,
        action: "pir_submit",
        entityType: "PIR",
        entityId: pir.id,
        details: { programTitle: cleanProgramTitle, quarter: cleanQuarter },
        ipAddress: getClientIp(c),
      });
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
            error:
              "Invalid budget_from_division: must be a non-negative number",
          },
          400,
        );
      }
      try {
        putBudgetPsf = validateBudgetAmount(budget_from_co_psf);
      } catch {
        return c.json(
          {
            error: "Invalid budget_from_co_psf: must be a non-negative number",
          },
          400,
        );
      }

      const factorData = transformFactors(factors);
      const reviewData = transformActivityReviews(activity_reviews);
      const resource = pirResourceKeyFromRecord(pir);

      const updated = await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        resource,
        async (tx) => {
          const lockedPir = await tx.pIR.findUnique({ where: { id: pirId } });
          if (!lockedPir) {
            throw new HttpError(404, "PIR not found", "NOT_FOUND");
          }

          if (
            lockedPir.created_by_user_id === null ||
            lockedPir.created_by_user_id !== tokenUser.id
          ) {
            throw new HttpError(403, "Forbidden", "FORBIDDEN");
          }
          const pirAip = await tx.aIP.findUnique({
            where: { id: lockedPir.aip_id },
            select: { school_id: true, program_id: true },
          });
          const isSchoolResubmission = tokenUser.role === "School" &&
            pirAip?.school_id != null;
          if (
            isSchoolResubmission
              ? lockedPir.status !== "Returned"
              : lockedPir.status !== "For CES Review" &&
                lockedPir.status !== "Returned"
          ) {
            throw new ConflictError(
              "This PIR can no longer be edited — it is currently under review.",
            );
          }
          if (isSchoolResubmission) {
            const submissionWindowError =
              await validateSubmissionWindowForRole(
                tokenUser.role,
                lockedPir.quarter,
              );
            if (submissionWindowError) {
              const status = submissionWindowError.startsWith("Invalid")
                ? 400
                : 403;
              throw new HttpError(status, submissionWindowError, "FORBIDDEN");
            }

            const focalCount = await tx.programFocalPerson.count({
              where: {
                program_id: pirAip?.program_id ?? -1,
                user: { role: "Division Personnel", is_active: true },
              },
            });
            if (focalCount === 0) {
              throw new HttpError(
                400,
                "No focal persons assigned to this program. Contact your administrator.",
                "NO_FOCAL_PERSONS",
              );
            }
          }

          const resubmitStatus = isSchoolResubmission
            ? "For Recommendation"
            : "For CES Review";

          await tx.pIRActivityReview.deleteMany({ where: { pir_id: pirId } });
          await tx.pIRFactor.deleteMany({ where: { pir_id: pirId } });

          return tx.pIR.update({
            where: { id: pirId },
            data: {
              program_owner,
              budget_from_division: putBudgetDiv,
              budget_from_co_psf: putBudgetPsf,
              functional_division: functional_division ?? null,
              indicator_quarterly_targets: indicator_quarterly_targets ?? [],
              action_items: action_items ?? [],
              status: resubmitStatus,
              ...(isSchoolResubmission && {
                focal_person_id: null,
                focal_recommended_at: null,
                focal_remarks: null,
                ces_reviewer_id: null,
                ces_noted_at: null,
                ces_remarks: null,
                active_reviewer_id: null,
                active_review_started_at: null,
              }),
              factors: { create: factorData },
              activity_reviews: { create: reviewData },
            },
          });
        },
      );

      if (tokenUser.role === "School") {
        const resubmittedPir = await prisma.pIR.findUnique({
          where: { id: pirId },
          include: { aip: { include: { program: true, school: true } } },
        });
        if (resubmittedPir?.aip.school_id != null) {
          const focalIds = await getActiveFocalPersonIds(
            resubmittedPir.aip.program_id,
          );
          if (focalIds.length > 0) {
            const reviewerNotifs = await prisma.notification
              .createManyAndReturn({
                data: focalIds.map((userId) => ({
                  user_id: userId,
                  title: "PIR Resubmitted for Recommendation",
                  message: `${
                    resubmittedPir.aip.school?.name ?? "A school"
                  } resubmitted a PIR for ${resubmittedPir.aip.program.title} (${resubmittedPir.quarter}) for your recommendation.`,
                  type: "for_recommendation",
                  entity_id: pirId,
                  entity_type: "pir",
                })),
              });
            pushNotifications(reviewerNotifs);
          }
        }
      }

      writeUserLog({
        userId: tokenUser.id,
        action: "pir_update",
        entityType: "PIR",
        entityId: pirId,
        details: { quarter: pir.quarter },
        ipAddress: getClientIp(c),
      });
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
      if (tokenUser.role === "Admin") {
        return c.json({ error: "Forbidden" }, 403);
      }

      const pirId = safeParseInt(c.req.param("id"), 0);
      if (pirId === 0) return c.json({ error: "Invalid PIR id" }, 400);

      const pir = await prisma.pIR.findUnique({ where: { id: pirId } });
      if (!pir) return c.json({ error: "PIR not found" }, 404);

      await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        pirResourceKeyFromRecord(pir),
        async (tx) => {
          const lockedPir = await tx.pIR.findUnique({ where: { id: pirId } });
          if (!lockedPir) {
            throw new HttpError(404, "PIR not found", "NOT_FOUND");
          }

          const pirAip = await tx.aIP.findUnique({
            where: { id: lockedPir.aip_id },
            select: { school_id: true },
          });

          const isSchoolOwner = tokenUser.school_id != null &&
            pirAip?.school_id === tokenUser.school_id;
          const isCreator = lockedPir.created_by_user_id !== null &&
            lockedPir.created_by_user_id === tokenUser.id;
          if (!isSchoolOwner && !isCreator) {
            throw new HttpError(403, "Forbidden", "FORBIDDEN");
          }

          if (
            isSchoolOwner &&
            !["Draft", "Returned"].includes(lockedPir.status)
          ) {
            throw new ConflictError(
              "This PIR can no longer be deleted — it is currently under review.",
            );
          }

          if ((lockedPir as any).deleted_at) {
            throw new ConflictError("This PIR has already been deleted.");
          }

          await (tx.pIR as any).update({
            where: { id: pirId },
            data: { deleted_at: new Date() },
          });
        },
      );

      writeUserLog({
        userId: tokenUser.id,
        action: "pir_delete",
        entityType: "PIR",
        entityId: pirId,
        details: { quarter: pir.quarter },
        ipAddress: getClientIp(c),
      });
      return c.json({ message: "PIR deleted successfully" });
    },
  ),
);

export default pirRoutes;
