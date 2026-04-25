import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import {
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  withAdvisoryLock,
} from "../../../lib/advisoryLock.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { HttpError } from "../../../lib/errors.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { writeAuditLog } from "../shared/audit.ts";
import {
  pushAIPEditApprovedNotification,
  pushAIPEditDeniedNotification,
} from "./notifications.ts";
import { adminAsyncHandler } from "./asyncHandler.ts";

export const aipEditRouter = new Hono();

aipEditRouter.patch(
  "/aips/:id/approve-edit",
  adminAsyncHandler(
    "PATCH approve AIP edit failed",
    "Failed to approve edit request",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const id = safeParseInt(c.req.param("id"), 0);

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
      if (!currentAip) return c.json({ error: "AIP not found" }, 404);

      const aip = await withAdvisoryLock(
        LOCK_NAMESPACE.AIP,
        aipResourceKeyFromRecord(currentAip),
        async (tx) => {
          const existingAip = await tx.aIP.findUnique({ where: { id } });
          if (!existingAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }
          return tx.aIP.update({
            where: { id },
            data: { edit_requested: false, status: "Returned" },
            include: { program: true, school: true },
          });
        },
      );

      await pushAIPEditApprovedNotification(aip);
      await writeAuditLog(
        admin.id,
        "approved_aip_edit_request",
        "AIP",
        id,
        {},
        {
          ctx: c,
        },
      );
      return c.json({ success: true });
    },
  ),
);

aipEditRouter.patch(
  "/aips/:id/deny-edit",
  adminAsyncHandler(
    "PATCH deny AIP edit failed",
    "Failed to deny edit request",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const id = safeParseInt(c.req.param("id"), 0);

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
      if (!currentAip) return c.json({ error: "AIP not found" }, 404);

      const aip = await withAdvisoryLock(
        LOCK_NAMESPACE.AIP,
        aipResourceKeyFromRecord(currentAip),
        async (tx) => {
          const existingAip = await tx.aIP.findUnique({ where: { id } });
          if (!existingAip) {
            throw new HttpError(404, "AIP not found", "NOT_FOUND");
          }
          return tx.aIP.update({
            where: { id },
            data: { edit_requested: false },
            include: { program: true, school: true },
          });
        },
      );

      await pushAIPEditDeniedNotification(aip);
      await writeAuditLog(admin.id, "denied_aip_edit_request", "AIP", id, {}, {
        ctx: c,
      });
      return c.json({ success: true });
    },
  ),
);
