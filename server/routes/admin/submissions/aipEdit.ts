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
import { writeAuditLog } from "../shared/audit.ts";
import { documentWhereFromRef } from "../shared/documentRefs.ts";
import {
  pushAIPEditApprovedNotification,
  pushAIPEditDeniedNotification,
  pushPIREditApprovedNotification,
  pushPIREditDeniedNotification,
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
      const ref = c.req.param("id");

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
      if (!currentAip) return c.json({ error: "AIP not found" }, 404);
      const id = currentAip.id;

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
  "/pirs/:id/approve-edit",
  adminAsyncHandler(
    "PATCH approve PIR edit failed",
    "Failed to approve edit request",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const ref = c.req.param("id");

      const currentPir = await prisma.pIR.findUnique({
        where: documentWhereFromRef(ref),
        select: {
          id: true,
          aip_id: true,
          quarter: true,
          created_by_user_id: true,
        },
      });
      if (!currentPir) return c.json({ error: "PIR not found" }, 404);
      const id = currentPir.id;

      const pir = await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        pirResourceKeyFromRecord(currentPir),
        async (tx) => {
          const existingPir = await tx.pIR.findUnique({ where: { id } });
          if (!existingPir) {
            throw new HttpError(404, "PIR not found", "NOT_FOUND");
          }
          return (tx.pIR as any).update({
            where: { id },
            data: {
              edit_requested: false,
              edit_requested_at: null,
              status: "Returned",
            },
            include: { aip: { include: { program: true } } },
          });
        },
      );

      await pushPIREditApprovedNotification(pir);
      await writeAuditLog(
        admin.id,
        "approved_pir_edit_request",
        "PIR",
        id,
        {},
        { ctx: c },
      );
      return c.json({ success: true });
    },
  ),
);

aipEditRouter.patch(
  "/pirs/:id/deny-edit",
  adminAsyncHandler(
    "PATCH deny PIR edit failed",
    "Failed to deny edit request",
    async (c) => {
      const admin = (await getUserFromToken(c))!;
      const ref = c.req.param("id");

      const currentPir = await prisma.pIR.findUnique({
        where: documentWhereFromRef(ref),
        select: {
          id: true,
          aip_id: true,
          quarter: true,
          created_by_user_id: true,
        },
      });
      if (!currentPir) return c.json({ error: "PIR not found" }, 404);
      const id = currentPir.id;

      const pir = await withAdvisoryLock(
        LOCK_NAMESPACE.PIR,
        pirResourceKeyFromRecord(currentPir),
        async (tx) => {
          const existingPir = await tx.pIR.findUnique({ where: { id } });
          if (!existingPir) {
            throw new HttpError(404, "PIR not found", "NOT_FOUND");
          }
          return (tx.pIR as any).update({
            where: { id },
            data: { edit_requested: false, edit_requested_at: null },
            include: { aip: { include: { program: true } } },
          });
        },
      );

      await pushPIREditDeniedNotification(pir);
      await writeAuditLog(admin.id, "denied_pir_edit_request", "PIR", id, {}, {
        ctx: c,
      });
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
      const ref = c.req.param("id");

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
      if (!currentAip) return c.json({ error: "AIP not found" }, 404);
      const id = currentAip.id;

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
