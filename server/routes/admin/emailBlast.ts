import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { prisma } from "../../db/client.ts";
import {
  buildBlastKey,
  listEmailRecipients,
  sendPortalOpenNotification,
  sendWelcomeEmail,
} from "../../lib/accountEmails.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { adminOnly } from "./shared/guards.ts";
import { writeAuditLog } from "./shared/audit.ts";

const emailRoutes = new Hono();

emailRoutes.use("/email-recipients", adminOnly);
emailRoutes.use("/email/send-welcome-batch", adminOnly);
emailRoutes.use("/email-blast", adminOnly);
emailRoutes.use("/email-blast/*", adminOnly);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeStreamPayload(
  // deno-lint-ignore no-explicit-any
  stream: any,
  payload: Record<string, unknown>,
) {
  await stream.writeSSE({
    data: JSON.stringify(payload),
  });
}

emailRoutes.get("/email-recipients", async (c) => {
  return c.json(await listEmailRecipients());
});

emailRoutes.post("/email/send-welcome-batch", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = sanitizeObject(await c.req.json().catch(() => ({})));
  const userIds = Array.isArray(body.user_ids)
    ? body.user_ids
      .map(Number)
      .filter((value: number) => Number.isInteger(value) && value > 0)
    : [];

  if (userIds.length === 0) {
    return c.json({ error: "user_ids must contain at least one valid user ID." }, 400);
  }

  return streamSSE(c, async (stream) => {
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    await writeStreamPayload(stream, {
      type: "started",
      total: userIds.length,
    });

    for (const [index, userId] of userIds.entries()) {
      const result = await sendWelcomeEmail(userId);

      if (result.status === "sent") sent++;
      else if (result.status === "failed") failed++;
      else skipped++;

      await writeStreamPayload(stream, {
        type: "item",
        user_id: result.user_id,
        email: result.email ?? null,
        status: result.status,
        ...(result.error ? { error: result.error } : {}),
      });

      if (index < userIds.length - 1) {
        await delay(1000);
      }
    }

    await writeAuditLog(admin.id, "sent_welcome_email_batch", "EmailConfig", 0, {
      total: userIds.length,
      sent,
      failed,
      skipped,
    }, { ctx: c });

    await writeStreamPayload(stream, {
      type: "complete",
      total: userIds.length,
      sent,
      failed,
      skipped,
    });
  });
});

emailRoutes.post("/email-blast", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = sanitizeObject(await c.req.json().catch(() => ({})));
  const type = body.type === "pir" ? "pir" : body.type === "aip" ? "aip" : null;
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const targetRoles = Array.isArray(body.target_roles) && body.target_roles.length > 0
    ? body.target_roles
      .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
    : ["School", "Division Personnel"];

  if (!type) return c.json({ error: "type must be either 'aip' or 'pir'." }, 400);
  if (!label) return c.json({ error: "label is required." }, 400);

  const recipients = await prisma.user.findMany({
    where: {
      role: { in: targetRoles },
      is_active: true,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: { email: "asc" },
  });

  const blastKey = buildBlastKey(type, label);
  const existingLogs = await prisma.emailBlastLog.findMany({
    where: {
      blast_key: blastKey,
      user_id: { in: recipients.map((user) => user.id) },
    },
    select: { user_id: true },
  });
  const alreadySent = new Set(existingLogs.map((entry) => entry.user_id));

  return streamSSE(c, async (stream) => {
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    await writeStreamPayload(stream, {
      type: "started",
      total: recipients.length,
      blast_key: blastKey,
    });

    for (const [index, recipient] of recipients.entries()) {
      if (alreadySent.has(recipient.id)) {
        skipped++;
        await writeStreamPayload(stream, {
          type: "item",
          user_id: recipient.id,
          email: recipient.email,
          status: "skipped",
          error: "This blast was already sent to the recipient.",
        });
      } else {
        const result = await sendPortalOpenNotification(recipient.id, {
          type,
          label,
        });

        if (result.status === "sent") {
          sent++;
          await prisma.emailBlastLog.create({
            data: {
              blast_key: blastKey,
              blast_type: type,
              blast_label: label,
              user_id: recipient.id,
            },
          });
        } else if (result.status === "failed") {
          failed++;
        } else {
          skipped++;
        }

        await writeStreamPayload(stream, {
          type: "item",
          user_id: recipient.id,
          email: result.email ?? recipient.email,
          status: result.status,
          ...(result.error ? { error: result.error } : {}),
        });
      }

      if (index < recipients.length - 1) {
        await delay(1000);
      }
    }

    await writeAuditLog(admin.id, "sent_portal_open_email_blast", "EmailBlastLog", 0, {
      blast_key: blastKey,
      blast_type: type,
      blast_label: label,
      target_roles: targetRoles,
      total: recipients.length,
      sent,
      failed,
      skipped,
    }, { ctx: c });

    await writeStreamPayload(stream, {
      type: "complete",
      total: recipients.length,
      blast_key: blastKey,
      sent,
      failed,
      skipped,
    });
  });
});

emailRoutes.get("/email-blast/history", async (c) => {
  const rows = await prisma.emailBlastLog.findMany({
    orderBy: { sent_at: "desc" },
    take: 250,
    select: {
      blast_key: true,
      blast_type: true,
      blast_label: true,
      sent_at: true,
      user_id: true,
    },
  });

  const grouped = new Map<string, {
    blast_key: string;
    blast_type: string;
    blast_label: string;
    sent_at: Date;
    recipient_count: number;
  }>();

  for (const row of rows) {
    const existing = grouped.get(row.blast_key);
    if (!existing) {
      grouped.set(row.blast_key, {
        blast_key: row.blast_key,
        blast_type: row.blast_type,
        blast_label: row.blast_label,
        sent_at: row.sent_at,
        recipient_count: 1,
      });
      continue;
    }
    existing.recipient_count += 1;
    if (row.sent_at > existing.sent_at) {
      existing.sent_at = row.sent_at;
    }
  }

  return c.json(
    Array.from(grouped.values())
      .sort((left, right) => right.sent_at.getTime() - left.sent_at.getTime())
      .slice(0, 20),
  );
});

export default emailRoutes;
