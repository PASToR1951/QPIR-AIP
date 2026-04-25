import { Hono } from "hono";
import type { Context } from "hono";
import { prisma } from "../../../db/client.ts";
import {
  LOCK_NAMESPACE,
  pirResourceKeyFromRecord,
  withAdvisoryLock,
} from "../../../lib/advisoryLock.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { HttpError } from "../../../lib/errors.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { validateTextLength } from "./validation.ts";
import { pushPIRRemarksNotification } from "./notifications.ts";
import { adminAsyncHandler } from "./asyncHandler.ts";
import { resolvePresentedValue } from "./presented.ts";

export const pirActionsRouter = new Hono();

async function readOptionalBody(c: Context) {
  const rawBody = await c.req.text();
  if (!rawBody.trim()) {
    return {};
  }
  try {
    return sanitizeObject(JSON.parse(rawBody));
  } catch {
    throw new HttpError(400, "Invalid JSON body", "BAD_REQUEST");
  }
}

pirActionsRouter.patch(
  "/pirs/:id/remarks",
  adminAsyncHandler(
    "PATCH PIR remarks failed",
    "Failed to update PIR remarks",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const id = safeParseInt(c.req.param("id"), 0);
      const { remarks } = sanitizeObject(await c.req.json());

      if (typeof remarks !== "string") {
        return c.json({ error: "remarks must be a string" }, 400);
      }

      const lengthError = validateTextLength(remarks, "Remarks");
      if (lengthError) return c.json({ error: lengthError }, 400);

      const currentPir = await prisma.pIR.findUnique({
        where: { id },
        select: { aip_id: true, quarter: true },
      });
      if (!currentPir) return c.json({ error: "PIR not found" }, 404);

      const pir = await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        pirResourceKeyFromRecord(currentPir),
        async (tx) => {
          const existingPir = await tx.pIR.findUnique({ where: { id } });
          if (!existingPir) {
            throw new HttpError(404, "PIR not found", "NOT_FOUND");
          }
          return tx.pIR.update({
            where: { id },
            data: { remarks },
            include: { aip: { include: { program: true, school: true } } },
          });
        },
      );

      if (remarks.trim()) {
        await pushPIRRemarksNotification(pir);
      }

      await writeAuditLog(admin.id, "update_remarks", "PIR", id, { remarks }, {
        ctx: c,
      });
      return c.json({ success: true, remarks: pir.remarks });
    },
  ),
);

pirActionsRouter.patch(
  "/pirs/:id/presented",
  adminAsyncHandler(
    "PATCH PIR presented failed",
    "Failed to update PIR presented status",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const id = safeParseInt(c.req.param("id"), 0);
      const body = await readOptionalBody(c);
      if ("presented" in body && typeof body.presented !== "boolean") {
        return c.json({ error: "presented must be a boolean" }, 400);
      }

      const pir = await prisma.pIR.findUnique({ where: { id } });
      if (!pir) return c.json({ error: "PIR not found" }, 404);

      const updated = await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        pirResourceKeyFromRecord(pir),
        async (tx) => {
          const lockedPir = await tx.pIR.findUnique({ where: { id } });
          if (!lockedPir) {
            throw new HttpError(404, "PIR not found", "NOT_FOUND");
          }
          const presented = resolvePresentedValue(
            lockedPir.presented,
            body.presented,
          );
          return tx.pIR.update({
            where: { id },
            data: { presented },
          });
        },
      );

      await writeAuditLog(admin.id, "toggle_presented", "PIR", id, {
        presented: updated.presented,
      }, { ctx: c });

      return c.json({ success: true, presented: updated.presented });
    },
  ),
);

pirActionsRouter.patch(
  "/pirs/:id/activity-notes",
  adminAsyncHandler(
    "PATCH PIR activity notes failed",
    "Failed to update PIR activity notes",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const pirId = safeParseInt(c.req.param("id"), 0);
      const { activity_review_id, notes } = sanitizeObject(await c.req.json());

      if (!activity_review_id || typeof notes !== "string") {
        return c.json(
          { error: "activity_review_id and notes are required" },
          400,
        );
      }

      const lengthError = validateTextLength(notes, "Notes");
      if (lengthError) return c.json({ error: lengthError }, 400);

      const currentPir = await prisma.pIR.findUnique({
        where: { id: pirId },
        select: { aip_id: true, quarter: true },
      });
      if (!currentPir) return c.json({ error: "PIR not found" }, 404);

      await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        pirResourceKeyFromRecord(currentPir),
        async (tx) => {
          await tx.pIRActivityReview.update({
            where: { id: activity_review_id },
            data: { admin_notes: notes },
          });
        },
      );

      await writeAuditLog(admin.id, "update_activity_notes", "PIR", pirId, {
        activity_review_id,
        notes,
      }, { ctx: c });

      return c.json({ ok: true });
    },
  ),
);
