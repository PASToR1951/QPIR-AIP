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
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { documentWhereFromRef } from "../shared/documentRefs.ts";
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
  "/pirs/:id/presented",
  adminAsyncHandler(
    "PATCH PIR presented failed",
    "Failed to update PIR presented status",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const ref = c.req.param("id");
      const body = await readOptionalBody(c);
      if ("presented" in body && typeof body.presented !== "boolean") {
        return c.json({ error: "presented must be a boolean" }, 400);
      }

      const pir = await prisma.pIR.findUnique({
        where: documentWhereFromRef(ref),
      });
      if (!pir) return c.json({ error: "PIR not found" }, 404);
      const id = pir.id;

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
