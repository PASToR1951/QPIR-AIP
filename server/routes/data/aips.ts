import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { logger } from "../../lib/logger.ts";
import { pushNotification, pushNotifications } from "../../lib/notifStream.ts";
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
  aipResourceKey,
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  withAdvisoryLock,
} from "../../lib/advisoryLock.ts";
import { ConflictError, HttpError } from "../../lib/errors.ts";
import { isPrismaUniqueConflictWithoutTarget } from "../../lib/prismaErrors.ts";
import { fetchAIPForUser, fetchProgramByReference } from "./shared/lookups.ts";
import { CES_ROLES } from "../../lib/routing.ts";
import {
  normalizeIndicators,
  serializeIndicators,
  transformAIPActivities,
  validateBudgetAmount,
} from "./shared/normalize.ts";
import type {
  AIPWithProgramActivities,
  AIPWithProgramSchool,
  DataRouteEnv,
} from "./shared/types.ts";

const aipRoutes = new Hono<{ Variables: DataRouteEnv }>();

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

function hasInvalidActivityBudget(
  activities: Array<{ budgetAmount?: unknown }> = [],
): boolean {
  for (const activity of activities) {
    try {
      validateBudgetAmount(activity.budgetAmount);
    } catch {
      return true;
    }
  }
  return false;
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

aipRoutes.use("/aips", requireAuth());
aipRoutes.use("/aips/*", requireAuth());

aipRoutes.get(
  "/aips",
  asyncHandler(
    "Unhandled route error",
    "Failed to fetch AIP",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programTitle = c.req.query("program_title") || "";
      const programId = c.req.query("program_id");
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      if (!programTitle && safeParseInt(programId, 0) === 0) {
        return c.json(
          { error: "program_id or program_title is required" },
          400,
        );
      }

      const program = await fetchProgramByReference(programId, programTitle);
      if (!program) {
        return c.json({ error: "Program not found" }, 404);
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
        program: true,
      }) as AIPWithProgramActivities | null;

      if (!aip) return c.json({ error: "No submitted AIP found" }, 404);

      const indicators = serializeIndicators(aip.indicators as any[] ?? []);

      return c.json({
        id: aip.id,
        programId: aip.program_id,
        year: aip.year,
        status: aip.status,
        editRequested: aip.edit_requested,
        editRequestedAt: aip.edit_requested_at ?? null,
        editRequestCount: (aip as any).edit_request_count ?? 0,
        isSchoolOwned: aip.school_id !== null,
        depedProgram: aip.program.title,
        outcome: aip.outcome,
        targetDescription: aip.target_description ||
          indicators[0]?.description || "",
        sipTitle: aip.sip_title,
        projectCoord: aip.project_coordinator,
        objectives: aip.objectives,
        indicators,
        preparedByName: aip.prepared_by_name,
        preparedByTitle: aip.prepared_by_title,
        approvedByName: aip.approved_by_name,
        approvedByTitle: aip.approved_by_title,
        activities: aip.activities.map((activity: any) => ({
          id: activity.id,
          phase: activity.phase,
          name: activity.activity_name,
          period: activity.implementation_period,
          periodStartMonth: activity.period_start_month,
          periodEndMonth: activity.period_end_month,
          persons: activity.persons_involved,
          outputs: activity.outputs,
          budgetAmount: activity.budget_amount,
          budgetSource: activity.budget_source,
        })),
      });
    },
  ),
);

aipRoutes.delete(
  "/aips",
  asyncHandler(
    "Failed to delete AIP",
    "Failed to delete AIP",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const programTitle = c.req.query("program_title");
      const programId = c.req.query("program_id");
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      if (!programTitle && safeParseInt(programId, 0) === 0) {
        return c.json(
          { error: "program_id or program_title is required" },
          400,
        );
      }

      const program = await fetchProgramByReference(programId, programTitle);
      if (!program) {
        return c.json({ error: "Program not found" }, 404);
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year);
      if (!aip) return c.json({ error: "AIP not found" }, 404);

      await withAdvisoryLock(
        LOCK_NAMESPACE.AIP,
        aipResourceKeyFromRecord(aip),
        async (tx) => {
          const lockedAip = await fetchAIPForUser(
            tokenUser,
            program.id,
            year,
            undefined,
            tx,
          );
          if (!lockedAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }

          const deletableStatuses = ["Draft", "Returned"];
          if (!deletableStatuses.includes(lockedAip.status)) {
            logger.warn("AIP deletion blocked by status", {
              aipId: lockedAip.id,
              status: lockedAip.status,
              userId: tokenUser.id,
            });
            throw new HttpError(
              403,
              "This AIP cannot be deleted in its current state.",
              "FORBIDDEN",
            );
          }

          await tx.aIP.delete({ where: { id: lockedAip.id } });
        },
      );
      writeUserLog({
        userId: tokenUser.id,
        action: "aip_delete",
        entityType: "AIP",
        entityId: aip.id,
        details: { programTitle: program.title, year },
        ipAddress: getClientIp(c),
      });
      return c.json({ message: "AIP deleted successfully" });
    },
  ),
);

aipRoutes.post(
  "/aips",
  asyncHandler(
    "Unhandled route error",
    "Failed to create AIP",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const clusterErr = await verifySchoolCluster(tokenUser);
      if (clusterErr) return c.json({ error: clusterErr }, 403);

      const body = sanitizeObject(await c.req.json());
      const {
        program_id,
        program_title,
        year,
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

      const program = await fetchProgramByReference(program_id, program_title);
      if (!program) return c.json({ error: "Resource not found" }, 404);

      if (
        tokenUser.role === "Division Personnel" ||
        CES_ROLES.includes(tokenUser.role as typeof CES_ROLES[number])
      ) {
        const assigned = await prisma.user.findFirst({
          where: {
            id: tokenUser.id,
            programs: { some: { id: program.id } },
          },
        });
        if (!assigned) {
          return c.json(
            { error: "You are not assigned to this program" },
            403,
          );
        }
      }

      const schoolId = (tokenUser.role === "School" ||
          tokenUser.role === "Cluster Coordinator")
        ? tokenUser.school_id
        : null;
      const isSchoolSubmission = tokenUser.role === "School" &&
        schoolId !== null;
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
      const parsedYear = safeParseInt(
        year,
        new Date().getFullYear(),
        2020,
        2100,
      );

      const aipFields = {
        outcome,
        target_description: resolveTargetDescription(
          target_description,
          indicators,
        ),
        sip_title,
        project_coordinator,
        objectives,
        indicators: normalizeIndicators(indicators),
        prepared_by_name: prepared_by_name || "",
        prepared_by_title: prepared_by_title || "",
        approved_by_name: approved_by_name || "",
        approved_by_title: approved_by_title || "",
        status: isSchoolSubmission ? "For Recommendation" : "Approved",
      };

      if (hasInvalidActivityBudget(activities)) {
        return c.json(
          { error: "Invalid budget amount: must be a non-negative number" },
          400,
        );
      }

      const activityFields = transformAIPActivities(activities);
      const resource = aipResourceKey(
        tokenUser,
        schoolId,
        program.id,
        parsedYear,
      );
      const aip = await mapTargetlessUniqueConflict(
        withAdvisoryLock(
          LOCK_NAMESPACE.AIP,
          resource,
          async (tx) => {
            const existingDraft = await fetchAIPForUser(
              tokenUser,
              program.id,
              parsedYear,
              undefined,
              tx,
            );

            if (existingDraft?.archived) {
              throw new ConflictError(
                "This AIP has been archived and cannot be modified",
              );
            }

            if (
              existingDraft && (
                existingDraft.status === "Draft" ||
                existingDraft.status === "Returned"
              )
            ) {
              await tx.aIPActivity.deleteMany({
                where: { aip_id: existingDraft.id },
              });
              return tx.aIP.update({
                where: { id: existingDraft.id },
                data: {
                  ...aipFields,
                  ...(isSchoolSubmission && {
                    focal_person_id: null,
                    focal_recommended_at: null,
                    focal_remarks: null,
                    ces_reviewer_id: null,
                    ces_noted_at: null,
                    ces_remarks: null,
                  }),
                  activities: { create: activityFields },
                },
                include: { activities: true },
              });
            }

            if (existingDraft) {
              logger.warn("AIP creation blocked — record already exists", {
                status: existingDraft.status,
                userId: tokenUser.id,
              });
              throw new ConflictError(
                "A record already exists for this request",
              );
            }

            return tx.aIP.create({
              data: {
                school_id: schoolId,
                program_id: program.id,
                created_by_user_id: tokenUser.id,
                year: parsedYear,
                ...aipFields,
                activities: { create: activityFields },
              },
              include: { activities: true },
            });
          },
        ),
      );

      let schoolLabel: string;
      if (aip.school_id) {
        schoolLabel = sanitizeString(
          (
            await prisma.school.findUnique({
              where: { id: aip.school_id },
              select: { name: true },
            })
          )?.name ?? "A school",
        );
      } else {
        const submitter = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          select: { name: true, email: true },
        });
        schoolLabel = sanitizeString(
          submitter?.name ?? submitter?.email ?? "Division Personnel",
        );
      }

      const reviewerIds = isSchoolSubmission
        ? focalPersonIds
        : (await prisma.user.findMany({
          where: { role: "Admin" },
          select: { id: true },
        })).map((admin) => admin.id);
      if (reviewerIds.length > 0) {
        const reviewerNotifs = await prisma.notification.createManyAndReturn({
          data: reviewerIds.map((userId) => ({
            user_id: userId,
            title: isSchoolSubmission
              ? "AIP Pending Recommendation"
              : "New AIP Received for Review",
            message: isSchoolSubmission
              ? `${schoolLabel} submitted an AIP for ${program.title} (FY ${parsedYear}) for your recommendation.`
              : `${schoolLabel} submitted an AIP for ${program.title} (FY ${parsedYear}) awaiting your review.`,
            type: isSchoolSubmission ? "for_recommendation" : "aip_submitted",
            entity_id: aip.id,
            entity_type: "aip",
          })),
        });
        pushNotifications(reviewerNotifs);
      }

      const submitterNotif = await prisma.notification.create({
        data: {
          user_id: tokenUser.id,
          title: "AIP Submitted",
          message:
            `Your AIP for ${program.title} (FY ${parsedYear}) has been submitted and is awaiting review.`,
          type: "aip_submitted",
          entity_id: aip.id,
          entity_type: "aip",
        },
      });
      pushNotification(submitterNotif);

      writeUserLog({
        userId: tokenUser.id,
        action: "aip_submit",
        entityType: "AIP",
        entityId: aip.id,
        details: { programTitle: program.title, year: parsedYear },
        ipAddress: getClientIp(c),
      });
      return c.json({ message: "AIP created successfully", aip });
    },
  ),
);

aipRoutes.delete(
  "/aips/:id",
  asyncHandler(
    "Failed to delete AIP",
    "Failed to delete AIP",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      if (tokenUser.role === "Admin") {
        return c.json({ error: "Forbidden" }, 403);
      }

      const aipId = safeParseInt(c.req.param("id"), 0);
      if (aipId === 0) return c.json({ error: "Invalid AIP id" }, 400);

      const aip = await prisma.aIP.findUnique({
        where: { id: aipId },
        include: { program: true },
      });
      if (!aip) return c.json({ error: "AIP not found" }, 404);

      await withAdvisoryLock(
        LOCK_NAMESPACE.AIP,
        aipResourceKeyFromRecord(aip),
        async (tx) => {
          const lockedAip = await tx.aIP.findUnique({ where: { id: aipId } });
          if (!lockedAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }

          const isOwner = (tokenUser.school_id != null &&
            lockedAip.school_id === tokenUser.school_id) ||
            lockedAip.created_by_user_id === tokenUser.id;
          if (!isOwner) throw new HttpError(403, "Forbidden", "FORBIDDEN");

          if (
            lockedAip.school_id !== null &&
            !["Draft", "Returned"].includes(lockedAip.status)
          ) {
            throw new HttpError(
              403,
              "This AIP cannot be deleted in its current state.",
              "FORBIDDEN",
            );
          }

          if (lockedAip.deleted_at) {
            throw new ConflictError("This AIP has already been deleted.");
          }

          await (tx.aIP as any).update({
            where: { id: aipId },
            data: { deleted_at: new Date() },
          });
        },
      );

      writeUserLog({
        userId: tokenUser.id,
        action: "aip_delete",
        entityType: "AIP",
        entityId: aipId,
        details: {
          programTitle: aip.program?.title ?? "Unknown",
          year: aip.year,
        },
        ipAddress: getClientIp(c),
      });
      return c.json({ message: "AIP deleted successfully" });
    },
  ),
);

aipRoutes.put(
  "/aips/:id",
  asyncHandler(
    "Unhandled route error",
    "Failed to update AIP",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const aipId = safeParseInt(c.req.param("id"), 0);
      if (aipId === 0) return c.json({ error: "Invalid AIP id" }, 400);

      const aip = await prisma.aIP.findUnique({
        where: { id: aipId },
        include: { program: true },
      });
      if (!aip) return c.json({ error: "AIP not found" }, 404);

      const body = sanitizeObject(await c.req.json());
      const {
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

      if (hasInvalidActivityBudget(activities)) {
        return c.json(
          { error: "Invalid budget amount: must be a non-negative number" },
          400,
        );
      }

      const activityFields = transformAIPActivities(activities);
      const resource = aipResourceKeyFromRecord(aip);

      const updated = await withAdvisoryLock(
        LOCK_NAMESPACE.AIP,
        resource,
        async (tx) => {
          const lockedAip = await tx.aIP.findUnique({
            where: { id: aipId },
          });
          if (!lockedAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }

          const isOwner = lockedAip.created_by_user_id === tokenUser.id ||
            (tokenUser.school_id != null &&
              lockedAip.school_id === tokenUser.school_id);
          if (!isOwner) throw new HttpError(403, "Forbidden", "FORBIDDEN");

          if (lockedAip.status !== "Returned") {
            throw new ConflictError(
              "This AIP can no longer be edited in its current state. Please request edit permission.",
            );
          }

          const isSchoolResubmission = tokenUser.role === "School" &&
            lockedAip.school_id !== null;
          if (isSchoolResubmission) {
            const focalCount = await tx.programFocalPerson.count({
              where: {
                program_id: lockedAip.program_id,
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

          await tx.aIPActivity.deleteMany({ where: { aip_id: aipId } });
          return tx.aIP.update({
            where: { id: aipId },
            data: {
              outcome,
              target_description: resolveTargetDescription(
                target_description,
                indicators,
              ),
              sip_title,
              project_coordinator,
              objectives,
              indicators: normalizeIndicators(indicators),
              prepared_by_name: prepared_by_name || "",
              prepared_by_title: prepared_by_title || "",
              approved_by_name: approved_by_name || "",
              approved_by_title: approved_by_title || "",
              status: isSchoolResubmission ? "For Recommendation" : "Approved",
              ...(isSchoolResubmission && {
                focal_person_id: null,
                focal_recommended_at: null,
                focal_remarks: null,
                ces_reviewer_id: null,
                ces_noted_at: null,
                ces_remarks: null,
              }),
              activities: { create: activityFields },
            },
            include: { activities: true },
          });
        },
      );

      if (tokenUser.role === "School" && aip.school_id !== null) {
        const focalIds = await getActiveFocalPersonIds(aip.program_id);
        if (focalIds.length > 0) {
          const school = tokenUser.school_id
            ? await prisma.school.findUnique({
              where: { id: tokenUser.school_id },
              select: { name: true },
            })
            : null;
          const reviewerNotifs = await prisma.notification.createManyAndReturn({
            data: focalIds.map((userId) => ({
              user_id: userId,
              title: "AIP Resubmitted for Recommendation",
              message: `${
                school?.name ?? "A school"
              } resubmitted an AIP for ${aip.program.title} (FY ${aip.year}) for your recommendation.`,
              type: "for_recommendation",
              entity_id: aipId,
              entity_type: "aip",
            })),
          });
          pushNotifications(reviewerNotifs);
        }
      }

      writeUserLog({
        userId: tokenUser.id,
        action: "aip_update",
        entityType: "AIP",
        entityId: aipId,
        details: { programTitle: aip.program.title, year: aip.year },
        ipAddress: getClientIp(c),
      });
      return c.json({ message: "AIP updated successfully", aip: updated });
    },
  ),
);

aipRoutes.post(
  "/aips/:id/request-edit",
  asyncHandler(
    "Unhandled route error",
    "Failed to send edit request",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const aipId = safeParseInt(c.req.param("id"), 0);
      const aip = await prisma.aIP.findUnique({
        where: { id: aipId },
        include: { program: true, school: true },
      }) as AIPWithProgramSchool | null;

      if (!aip) return c.json({ error: "AIP not found" }, 404);

      const MAX_EDIT_REQUESTS = 3;
      const updatedAip = await withAdvisoryLock(
        LOCK_NAMESPACE.AIP,
        aipResourceKeyFromRecord(aip),
        async (tx) => {
          const lockedAip = await tx.aIP.findUnique({
            where: { id: aipId },
            include: { program: true, school: true },
          });
          if (!lockedAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }

          const isOwner = lockedAip.created_by_user_id === tokenUser.id ||
            (tokenUser.school_id != null &&
              lockedAip.school_id === tokenUser.school_id);
          if (!isOwner) {
            throw new HttpError(
              403,
              "Not authorized to request edit for this AIP",
              "FORBIDDEN",
            );
          }

          if (lockedAip.status !== "Approved") {
            throw new ConflictError(
              "Edit requests can only be made for Approved AIPs",
            );
          }

          if (
            ((lockedAip as any).edit_request_count ?? 0) >= MAX_EDIT_REQUESTS
          ) {
            throw new ConflictError(
              "You have reached the maximum number of edit requests (3) for this AIP.",
            );
          }

          return (tx.aIP as any).update({
            where: { id: aipId },
            data: {
              edit_requested: true,
              edit_requested_at: new Date(),
              edit_request_count: { increment: 1 },
            },
            include: { program: true, school: true },
          }) as Promise<AIPWithProgramSchool>;
        },
      );

      let requesterLabel: string;
      if (updatedAip.school) {
        requesterLabel = updatedAip.school.name;
      } else {
        const requester = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          select: { name: true, email: true },
        });
        requesterLabel = requester?.name ?? requester?.email ??
          "Division Personnel";
      }

      const admins = await prisma.user.findMany({
        where: { role: "Admin" },
        select: { id: true },
      });
      if (admins.length > 0) {
        const editNotifs = await prisma.notification.createManyAndReturn({
          data: admins.map((admin) => ({
            user_id: admin.id,
            title: "Edit Request — AIP",
            message:
              `${requesterLabel} is requesting permission to edit their AIP for ${updatedAip.program.title} (FY ${updatedAip.year}).`,
            type: "aip_edit_requested",
            entity_id: aipId,
            entity_type: "aip",
          })),
        });
        pushNotifications(editNotifs);
      }

      writeUserLog({
        userId: tokenUser.id,
        action: "aip_edit_request",
        entityType: "AIP",
        entityId: aipId,
        details: {
          programTitle: updatedAip.program.title,
          year: updatedAip.year,
        },
        ipAddress: getClientIp(c),
      });
      return c.json({ message: "Edit request sent to admin" });
    },
  ),
);

aipRoutes.post(
  "/aips/:id/cancel-edit-request",
  asyncHandler(
    "Unhandled route error",
    "Failed to cancel edit request",
    async (c) => {
      const tokenUser = getAuthedUser(c);
      const aipId = safeParseInt(c.req.param("id"), 0);
      const aip = await prisma.aIP.findUnique({
        where: { id: aipId },
      });

      if (!aip) return c.json({ error: "AIP not found" }, 404);

      await withAdvisoryLock(
        LOCK_NAMESPACE.AIP,
        aipResourceKeyFromRecord(aip),
        async (tx) => {
          const lockedAip = await tx.aIP.findUnique({ where: { id: aipId } });
          if (!lockedAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }

          const isOwner = lockedAip.created_by_user_id === tokenUser.id ||
            (tokenUser.school_id != null &&
              lockedAip.school_id === tokenUser.school_id);
          if (!isOwner) {
            throw new HttpError(
              403,
              "Not authorized to cancel this edit request",
              "FORBIDDEN",
            );
          }

          if (!lockedAip.edit_requested) {
            throw new ConflictError("No pending edit request");
          }

          await tx.aIP.update({
            where: { id: aipId },
            data: { edit_requested: false, edit_requested_at: null },
          });
        },
      );

      writeUserLog({
        userId: tokenUser.id,
        action: "aip_cancel_edit_request",
        entityType: "AIP",
        entityId: aipId,
        ipAddress: getClientIp(c),
      });
      return c.json({ message: "Edit request cancelled" });
    },
  ),
);

export default aipRoutes;
