import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { writeAuditLog } from "../shared/audit.ts";
import {
  pushAIPEditApprovedNotification,
  pushAIPEditDeniedNotification,
} from "./notifications.ts";

export const aipEditRouter = new Hono();

// PATCH /aips/:id/approve-edit
aipEditRouter.patch("/aips/:id/approve-edit", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);

  const aip = await prisma.aIP.update({
    where: { id },
    data: { edit_requested: false, status: "Returned" },
    include: { program: true, school: true },
  });

  await pushAIPEditApprovedNotification(aip);
  await writeAuditLog(admin.id, "approved_aip_edit_request", "AIP", id, {}, {
    ctx: c,
  });
  return c.json({ success: true });
});

// PATCH /aips/:id/deny-edit
aipEditRouter.patch("/aips/:id/deny-edit", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);

  const aip = await prisma.aIP.update({
    where: { id },
    data: { edit_requested: false },
    include: { program: true, school: true },
  });

  await pushAIPEditDeniedNotification(aip);
  await writeAuditLog(admin.id, "denied_aip_edit_request", "AIP", id, {}, {
    ctx: c,
  });
  return c.json({ success: true });
});
