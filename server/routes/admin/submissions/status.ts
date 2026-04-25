import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import {
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  withAdvisoryLock,
} from "../../../lib/advisoryLock.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { HttpError } from "../../../lib/errors.ts";
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { documentWhereFromRef } from "../shared/documentRefs.ts";
import {
  VALID_STATUSES,
  validateTextLength,
} from "./validation.ts";
import { pushAIPStatusNotification } from "./notifications.ts";
import { adminAsyncHandler } from "./asyncHandler.ts";

export const statusRouter = new Hono();

statusRouter.patch(
  "/submissions/:id/status",
  adminAsyncHandler(
    "PATCH submission status failed",
    "Failed to update submission status",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const ref = c.req.param("id");
      const { type, status, feedback } = sanitizeObject(await c.req.json());
      const normalizedFeedback = typeof feedback === "string"
        ? feedback.trim()
        : "";

      if (type === "pir") {
        return c.json(
          { error: "Forbidden: PIR approval is handled by CES or Cluster Head" },
          403,
        );
      }

      if (!VALID_STATUSES.has(status)) {
        return c.json({ error: "Invalid status" }, 400);
      }

      const feedbackError = validateTextLength(normalizedFeedback, "Feedback");
      if (feedbackError) return c.json({ error: feedbackError }, 400);

      const currentAip = await prisma.aIP.findUnique({
        where: documentWhereFromRef(ref),
        select: {
          id: true,
          school_id: true,
          created_by_user_id: true,
          program_id: true,
          year: true,
        },
      });
      if (!currentAip) return c.json({ error: "Not found" }, 404);
      const id = currentAip.id;

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

      await writeAuditLog(
        admin.id,
        "updated_aip_status",
        "AIP",
        id,
        { status, feedback: normalizedFeedback || null },
        { ctx: c },
      );

      return c.json({ success: true });
    },
  ),
);
