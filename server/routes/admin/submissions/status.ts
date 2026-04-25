import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import {
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  pirResourceKeyFromRecord,
  withAdvisoryLock,
} from "../../../lib/advisoryLock.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { HttpError } from "../../../lib/errors.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { writeAuditLog } from "../shared/audit.ts";
import {
  mergeRemarks,
  VALID_STATUSES,
  validateTextLength,
} from "./validation.ts";
import {
  pushAIPStatusNotification,
  pushPIRStatusNotification,
} from "./notifications.ts";
import { adminAsyncHandler } from "./asyncHandler.ts";

export const statusRouter = new Hono();

statusRouter.patch(
  "/submissions/:id/status",
  adminAsyncHandler(
    "PATCH submission status failed",
    "Failed to update submission status",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const id = safeParseInt(c.req.param("id"), 0);
      const { type, status, feedback } = sanitizeObject(await c.req.json());
      const normalizedFeedback = typeof feedback === "string"
        ? feedback.trim()
        : "";

      if (!VALID_STATUSES.has(status)) {
        return c.json({ error: "Invalid status" }, 400);
      }

      const feedbackError = validateTextLength(normalizedFeedback, "Feedback");
      if (feedbackError) return c.json({ error: feedbackError }, 400);

      if (type === "pir" && status === "Returned" && !normalizedFeedback) {
        return c.json(
          { error: "Feedback is required when returning a PIR" },
          400,
        );
      }

      if (type === "pir") {
        const currentPir = await prisma.pIR.findUnique({
          where: { id },
          select: { aip_id: true, quarter: true },
        });
        if (!currentPir) return c.json({ error: "Not found" }, 404);

        const pir = await withAdvisoryLock(
          LOCK_NAMESPACE.PIR,
          pirResourceKeyFromRecord(currentPir),
          async (tx) => {
            const existingPir = await tx.pIR.findUnique({
              where: { id },
              select: { remarks: true },
            });
            if (!existingPir) {
              throw new HttpError(404, "Not found", "NOT_FOUND");
            }

            const merged = mergeRemarks(
              existingPir.remarks?.trim() ?? "",
              normalizedFeedback,
            );

            return tx.pIR.update({
              where: { id },
              data: {
                status,
                ...(merged !== undefined ? { remarks: merged } : {}),
              },
              include: { aip: { include: { program: true, school: true } } },
            });
          },
        );

        await pushPIRStatusNotification(pir, status, normalizedFeedback);
      } else {
        const currentAip = await prisma.aIP.findUnique({
          where: { id },
          select: {
            id: true,
            school_id: true,
            created_by_user_id: true,
            program_id: true,
            year: true,
          },
        });
        if (!currentAip) return c.json({ error: "Not found" }, 404);

        const aip = await withAdvisoryLock(
          LOCK_NAMESPACE.AIP,
          aipResourceKeyFromRecord(currentAip),
          async (tx) => {
            const existingAip = await tx.aIP.findUnique({ where: { id } });
            if (!existingAip) {
              throw new HttpError(404, "Not found", "NOT_FOUND");
            }
            return tx.aIP.update({
              where: { id },
              data: { status },
              include: { program: true, school: true },
            });
          },
        );
        await pushAIPStatusNotification(aip, status, normalizedFeedback);
      }

      await writeAuditLog(
        admin.id,
        `updated_${type}_status`,
        type === "pir" ? "PIR" : "AIP",
        id,
        { status, feedback: normalizedFeedback || null },
        { ctx: c },
      );

      return c.json({ success: true });
    },
  ),
);
