import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { writeAuditLog } from "../shared/audit.ts";
import {
  mergeRemarks,
  validateTextLength,
  VALID_STATUSES,
} from "./validation.ts";
import {
  pushAIPStatusNotification,
  pushPIRStatusNotification,
} from "./notifications.ts";

export const statusRouter = new Hono();

// PATCH /submissions/:id/status
statusRouter.patch("/submissions/:id/status", async (c) => {
  const admin = getUserFromToken(c)!;
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
    return c.json({ error: "Feedback is required when returning a PIR" }, 400);
  }

  if (type === "pir") {
    const existingPir = await prisma.pIR.findUnique({
      where: { id },
      select: { remarks: true },
    });
    if (!existingPir) return c.json({ error: "Not found" }, 404);

    const merged = mergeRemarks(
      existingPir.remarks?.trim() ?? "",
      normalizedFeedback,
    );

    const pir = await prisma.pIR.update({
      where: { id },
      data: {
        status,
        ...(merged !== undefined ? { remarks: merged } : {}),
      },
      include: { aip: { include: { program: true, school: true } } },
    });

    await pushPIRStatusNotification(pir, status, normalizedFeedback);
  } else {
    const aip = await prisma.aIP.update({
      where: { id },
      data: { status },
      include: { program: true, school: true },
    });
    await pushAIPStatusNotification(aip, status, normalizedFeedback);
  }

  await writeAuditLog(
    admin.id,
    `updated_${type}_status`,
    type === "pir" ? "PIR" : "AIP",
    id,
    { status, feedback: normalizedFeedback || null },
  );

  return c.json({ success: true });
});
