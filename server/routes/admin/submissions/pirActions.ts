import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { validateTextLength } from "./validation.ts";
import { pushPIRRemarksNotification } from "./notifications.ts";

export const pirActionsRouter = new Hono();

// PATCH /pirs/:id/remarks
pirActionsRouter.patch("/pirs/:id/remarks", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { remarks } = sanitizeObject(await c.req.json());

  if (typeof remarks !== "string") {
    return c.json({ error: "remarks must be a string" }, 400);
  }

  const lengthError = validateTextLength(remarks, "Remarks");
  if (lengthError) return c.json({ error: lengthError }, 400);

  const pir = await prisma.pIR.update({
    where: { id },
    data: { remarks },
    include: { aip: { include: { program: true, school: true } } },
  });

  if (remarks.trim()) {
    await pushPIRRemarksNotification(pir);
  }

  await writeAuditLog(admin.id, "update_remarks", "PIR", id, { remarks });
  return c.json({ success: true, remarks: pir.remarks });
});

// PATCH /pirs/:id/presented
pirActionsRouter.patch("/pirs/:id/presented", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);

  const pir = await prisma.pIR.findUnique({ where: { id } });
  if (!pir) return c.json({ error: "PIR not found" }, 404);

  const updated = await prisma.pIR.update({
    where: { id },
    data: { presented: !pir.presented },
  });

  await writeAuditLog(admin.id, "toggle_presented", "PIR", id, {
    presented: updated.presented,
  });

  return c.json({ success: true, presented: updated.presented });
});

// PATCH /pirs/:id/activity-notes
pirActionsRouter.patch("/pirs/:id/activity-notes", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const pirId = safeParseInt(c.req.param("id"), 0);
  const { activity_review_id, notes } = sanitizeObject(await c.req.json());

  if (!activity_review_id || typeof notes !== "string") {
    return c.json({ error: "activity_review_id and notes are required" }, 400);
  }

  const lengthError = validateTextLength(notes, "Notes");
  if (lengthError) return c.json({ error: lengthError }, 400);

  await prisma.pIRActivityReview.update({
    where: { id: activity_review_id },
    data: { admin_notes: notes },
  });

  await writeAuditLog(admin.id, "update_activity_notes", "PIR", pirId, {
    activity_review_id,
    notes,
  });

  return c.json({ ok: true });
});
