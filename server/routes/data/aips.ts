import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { logger } from "../../lib/logger.ts";
import { pushNotification, pushNotifications } from "../../lib/notifStream.ts";
import { sanitizeObject, sanitizeString } from "../../lib/sanitize.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { asyncHandler } from "./shared/asyncHandler.ts";
import { getAuthedUser, requireAuth, verifySchoolCluster } from "./shared/guards.ts";
import { fetchAIPForUser, fetchProgramByTitle } from "./shared/lookups.ts";
import {
  normalizeIndicators,
  transformAIPActivities,
  validateBudgetAmount,
} from "./shared/normalize.ts";
import type {
  AIPWithProgramActivities,
  AIPWithProgramSchool,
  DataRouteEnv,
} from "./shared/types.ts";

const aipRoutes = new Hono<{ Variables: DataRouteEnv }>();

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
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      if (!programTitle) {
        return c.json({ error: "program_title is required" }, 400);
      }

      const program = await fetchProgramByTitle(programTitle);
      if (!program) {
        return c.json({ error: `Program '${programTitle}' not found` }, 404);
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year, {
        activities: true,
        program: true,
      }) as AIPWithProgramActivities | null;

      if (!aip) return c.json({ error: "No submitted AIP found" }, 404);

      return c.json({
        id: aip.id,
        year: aip.year,
        status: aip.status,
        depedProgram: aip.program.title,
        outcome: aip.outcome,
        sipTitle: aip.sip_title,
        projectCoord: aip.project_coordinator,
        objectives: aip.objectives,
        indicators: aip.indicators,
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
      const year = safeParseInt(
        c.req.query("year"),
        new Date().getFullYear(),
        2020,
        2100,
      );

      if (!programTitle) {
        return c.json({ error: "program_title is required" }, 400);
      }

      const program = await fetchProgramByTitle(programTitle);
      if (!program) {
        return c.json({ error: `Program '${programTitle}' not found` }, 404);
      }

      const aip = await fetchAIPForUser(tokenUser, program.id, year);
      if (!aip) return c.json({ error: "AIP not found" }, 404);

      const deletableStatuses = ["Draft", "Returned"];
      if (!deletableStatuses.includes(aip.status)) {
        logger.warn("AIP deletion blocked by status", {
          aipId: aip.id,
          status: aip.status,
          userId: tokenUser.id,
        });
        return c.json(
          { error: "This AIP cannot be deleted in its current state." },
          403,
        );
      }

      await prisma.aIP.delete({ where: { id: aip.id } });
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
        program_title,
        year,
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

      const program = await fetchProgramByTitle(program_title);
      if (!program) return c.json({ error: "Resource not found" }, 404);

      if (tokenUser.role === "Division Personnel") {
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

      const schoolId = tokenUser.role === "School" ? tokenUser.school_id : null;
      const parsedYear = safeParseInt(year, new Date().getFullYear(), 2020, 2100);

      const aipFields = {
        outcome,
        sip_title,
        project_coordinator,
        objectives,
        indicators: normalizeIndicators(indicators),
        prepared_by_name: prepared_by_name || "",
        prepared_by_title: prepared_by_title || "",
        approved_by_name: approved_by_name || "",
        approved_by_title: approved_by_title || "",
        status: "Submitted",
      };

      if (hasInvalidActivityBudget(activities)) {
        return c.json(
          { error: "Invalid budget amount: must be a non-negative number" },
          400,
        );
      }

      const activityFields = transformAIPActivities(activities);
      const existingDraft = await fetchAIPForUser(tokenUser, program.id, parsedYear);

      let aip;
      if (existingDraft && (
          existingDraft.status === "Draft" || existingDraft.status === "Returned"
        )) {
        await prisma.aIPActivity.deleteMany({ where: { aip_id: existingDraft.id } });
        aip = await prisma.aIP.update({
          where: { id: existingDraft.id },
          data: {
            ...aipFields,
            activities: { create: activityFields },
          },
          include: { activities: true },
        });
      } else if (existingDraft) {
        if (existingDraft.archived) {
          return c.json(
            { error: "This AIP has been archived and cannot be modified" },
            409,
          );
        }
        logger.warn("AIP creation blocked — record already exists", {
          status: existingDraft.status,
          userId: tokenUser.id,
        });
        return c.json({ error: "A record already exists for this request" }, 409);
      } else {
        aip = await prisma.aIP.create({
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
      }

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

      const admins = await prisma.user.findMany({
        where: { role: "Admin" },
        select: { id: true },
      });
      if (admins.length > 0) {
        const adminNotifs = await prisma.notification.createManyAndReturn({
          data: admins.map((admin) => ({
            user_id: admin.id,
            title: "New AIP Received for Review",
            message:
              `${schoolLabel} submitted an AIP for ${program_title} (FY ${year}) awaiting your review.`,
            type: "aip_submitted",
            entity_id: aip.id,
            entity_type: "aip",
          })),
        });
        pushNotifications(adminNotifs);
      }

      const submitterNotif = await prisma.notification.create({
        data: {
          user_id: tokenUser.id,
          title: "AIP Submitted",
          message:
            `Your AIP for ${program_title} (FY ${year}) has been submitted and is awaiting review.`,
          type: "aip_submitted",
          entity_id: aip.id,
          entity_type: "aip",
        },
      });
      pushNotification(submitterNotif);

      return c.json({ message: "AIP created successfully", aip });
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

      const isOwner = aip.created_by_user_id === tokenUser.id ||
        (tokenUser.school_id != null && aip.school_id === tokenUser.school_id);
      if (!isOwner) return c.json({ error: "Forbidden" }, 403);

      if (aip.status !== "Submitted" && aip.status !== "Returned") {
        return c.json(
          { error: "This AIP can no longer be edited in its current state." },
          409,
        );
      }

      const body = sanitizeObject(await c.req.json());
      const {
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

      if (hasInvalidActivityBudget(activities)) {
        return c.json(
          { error: "Invalid budget amount: must be a non-negative number" },
          400,
        );
      }

      const activityFields = transformAIPActivities(activities);

      await prisma.aIPActivity.deleteMany({ where: { aip_id: aipId } });
      const updated = await prisma.aIP.update({
        where: { id: aipId },
        data: {
          outcome,
          sip_title,
          project_coordinator,
          objectives,
          indicators: normalizeIndicators(indicators),
          prepared_by_name: prepared_by_name || "",
          prepared_by_title: prepared_by_title || "",
          approved_by_name: approved_by_name || "",
          approved_by_title: approved_by_title || "",
          status: "Submitted",
          activities: { create: activityFields },
        },
        include: { activities: true },
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

      const isOwner = aip.created_by_user_id === tokenUser.id ||
        (tokenUser.school_id != null && aip.school_id === tokenUser.school_id);
      if (!isOwner) {
        return c.json(
          { error: "Not authorized to request edit for this AIP" },
          403,
        );
      }

      if (aip.status !== "Approved") {
        return c.json(
          { error: "Edit requests can only be made for Approved AIPs" },
          409,
        );
      }

      let requesterLabel: string;
      if (aip.school) {
        requesterLabel = aip.school.name;
      } else {
        const requester = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          select: { name: true, email: true },
        });
        requesterLabel = requester?.name ?? requester?.email ?? "Division Personnel";
      }

      await prisma.aIP.update({
        where: { id: aipId },
        data: { edit_requested: true },
      });

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
              `${requesterLabel} is requesting permission to edit their AIP for ${aip.program.title} (FY ${aip.year}).`,
            type: "aip_edit_requested",
            entity_id: aipId,
            entity_type: "aip",
          })),
        });
        pushNotifications(editNotifs);
      }

      return c.json({ message: "Edit request sent to admin" });
    },
  ),
);

export default aipRoutes;
