import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import {
  ANNOUNCEMENT_TARGET_ROLES,
  ANNOUNCEMENT_TYPES,
  deliverAnnouncementNotifications,
  isAnnouncementActiveNow,
} from "../../lib/announcements.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { adminOnly } from "./shared/guards.ts";

const announcementsRoutes = new Hono();

announcementsRoutes.use("/announcements", adminOnly);
announcementsRoutes.use("/announcements/*", adminOnly);

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 500;
const MAX_ACTION_LABEL_LENGTH = 40;
const VALID_TYPES = new Set<string>(ANNOUNCEMENT_TYPES);
const VALID_ROLES = new Set<string>(ANNOUNCEMENT_TARGET_ROLES);

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

function parseDateValue(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseIdList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.map((item) => Number(item)).filter((item) =>
        Number.isInteger(item) && item > 0
      ),
    ),
  ];
}

function parseRoleList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.map((item) => String(item)).filter((role) => VALID_ROLES.has(role)),
    ),
  ];
}

function validateActionUrl(value: unknown): string {
  const raw = cleanText(value, 500);
  if (!raw) return "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "https:") return raw;
  } catch {
    // handled below
  }
  throw new Error("Action URL must be an internal path or HTTPS URL");
}

async function normalizeAnnouncementPayload(source: Record<string, unknown>) {
  const title = cleanText(source.title, MAX_TITLE_LENGTH) || "Announcement";
  const message = cleanText(source.message, MAX_MESSAGE_LENGTH);
  const type = VALID_TYPES.has(String(source.type))
    ? String(source.type)
    : "info";
  const starts_at = parseDateValue(source.starts_at);
  const expires_at = parseDateValue(source.expires_at);
  const action_url = validateActionUrl(source.action_url);
  const action_label = action_url
    ? cleanText(source.action_label, MAX_ACTION_LABEL_LENGTH) || "Open"
    : "";

  if (!message) throw new Error("Message is required");
  if (source.starts_at && !starts_at) throw new Error("Start date is invalid");
  if (source.expires_at && !expires_at) {
    throw new Error("Expiration date is invalid");
  }
  if (
    starts_at && expires_at &&
    expires_at.getTime() <= starts_at.getTime()
  ) {
    throw new Error("Expiration must be after the start date");
  }

  const audience = source.audience && typeof source.audience === "object"
    ? source.audience as Record<string, unknown>
    : {};
  const target_roles = parseRoleList(audience.roles ?? source.target_roles);
  const school_ids = parseIdList(audience.school_ids ?? source.school_ids);
  const user_ids = parseIdList(audience.user_ids ?? source.user_ids);

  if (school_ids.length > 0) {
    const count = await prisma.school.count({
      where: { id: { in: school_ids } },
    });
    if (count !== school_ids.length) {
      throw new Error("One or more schools were not found");
    }
  }
  if (user_ids.length > 0) {
    const count = await prisma.user.count({
      where: {
        id: { in: user_ids },
        is_active: true,
        role: "Division Personnel",
      },
    });
    if (count !== user_ids.length) {
      throw new Error("One or more personnel targets were not found");
    }
  }

  return {
    data: {
      title,
      message,
      type,
      is_active: asBoolean(source.is_active, true),
      dismissible: asBoolean(source.dismissible, true),
      starts_at,
      expires_at,
      action_label: action_label || null,
      action_url: action_url || null,
    },
    target_roles,
    school_ids,
    user_ids,
  };
}

async function replaceAnnouncementTargets(
  tx: any,
  announcementId: number,
  targets: { target_roles: string[]; school_ids: number[]; user_ids: number[] },
) {
  await tx.announcementTargetRole.deleteMany({
    where: { announcement_id: announcementId },
  });
  await tx.announcementMentionSchool.deleteMany({
    where: { announcement_id: announcementId },
  });
  await tx.announcementMentionUser.deleteMany({
    where: { announcement_id: announcementId },
  });

  if (targets.target_roles.length > 0) {
    await tx.announcementTargetRole.createMany({
      data: targets.target_roles.map((role) => ({
        announcement_id: announcementId,
        role,
      })),
    });
  }
  if (targets.school_ids.length > 0) {
    await tx.announcementMentionSchool.createMany({
      data: targets.school_ids.map((schoolId) => ({
        announcement_id: announcementId,
        school_id: schoolId,
      })),
    });
  }
  if (targets.user_ids.length > 0) {
    await tx.announcementMentionUser.createMany({
      data: targets.user_ids.map((userId) => ({
        announcement_id: announcementId,
        user_id: userId,
      })),
    });
  }
}

function statusForAnnouncement(announcement: any): string {
  if (announcement.archived_at) return "archived";
  if (!announcement.is_active) return "draft";
  const now = new Date();
  if (announcement.starts_at && new Date(announcement.starts_at) > now) {
    return "scheduled";
  }
  if (announcement.expires_at && new Date(announcement.expires_at) <= now) {
    return "expired";
  }
  return "active";
}

function audienceSummary(announcement: any): string {
  const parts = [];
  if (announcement.target_roles?.length) {
    parts.push(
      `${announcement.target_roles.length} role${
        announcement.target_roles.length === 1 ? "" : "s"
      }`,
    );
  }
  if (announcement.mentioned_schools?.length) {
    parts.push(
      `${announcement.mentioned_schools.length} school${
        announcement.mentioned_schools.length === 1 ? "" : "s"
      }`,
    );
  }
  if (announcement.mentioned_users?.length) {
    parts.push(`${announcement.mentioned_users.length} personnel`);
  }
  return parts.length ? parts.join(", ") : "All active users";
}

function serializeAdminAnnouncement(announcement: any) {
  const notified_count =
    (announcement.receipts ?? []).filter((receipt: any) => receipt.notified_at)
      .length;
  const dismissed_count =
    (announcement.receipts ?? []).filter((receipt: any) => receipt.dismissed_at)
      .length;

  return {
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    is_active: announcement.is_active,
    dismissible: announcement.dismissible,
    starts_at: announcement.starts_at,
    expires_at: announcement.expires_at,
    archived_at: announcement.archived_at,
    action_label: announcement.action_label,
    action_url: announcement.action_url,
    created_at: announcement.created_at,
    updated_at: announcement.updated_at,
    status: statusForAnnouncement(announcement),
    audience_summary: audienceSummary(announcement),
    notified_count,
    dismissed_count,
    audience: {
      roles: (announcement.target_roles ?? []).map((target: any) =>
        target.role
      ),
      school_ids: (announcement.mentioned_schools ?? []).map((target: any) =>
        target.school_id
      ),
      user_ids: (announcement.mentioned_users ?? []).map((target: any) =>
        target.user_id
      ),
    },
    mentioned_schools: announcement.mentioned_schools ?? [],
    mentioned_users: announcement.mentioned_users ?? [],
    target_roles: announcement.target_roles ?? [],
  };
}

async function listAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    where: { archived_at: null },
    include: {
      target_roles: true,
      mentioned_schools: {
        include: { school: { select: { id: true, name: true } } },
      },
      mentioned_users: {
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true, name: true },
          },
        },
      },
      receipts: { select: { notified_at: true, dismissed_at: true } },
    },
    orderBy: { updated_at: "desc" },
  });
  return announcements.map(serializeAdminAnnouncement);
}

announcementsRoutes.get("/announcements", async (c) => {
  return c.json(await listAnnouncements());
});

announcementsRoutes.post("/announcements", async (c) => {
  const admin = (await getUserFromToken(c))!;
  let payload;
  try {
    payload = await normalizeAnnouncementPayload(
      sanitizeObject(await c.req.json()) as Record<string, unknown>,
    );
  } catch (error: any) {
    return c.json({ error: error?.message ?? "Invalid announcement" }, 400);
  }

  const announcement = await prisma.$transaction(async (tx) => {
    const created = await tx.announcement.create({
      data: { ...payload.data, created_by: admin.id },
    });
    await replaceAnnouncementTargets(tx, created.id, payload);
    await tx.auditLog.create({
      data: {
        admin_id: admin.id,
        action: "created_announcement",
        entity_type: "Announcement",
        entity_id: created.id,
        details: {
          title: payload.data.title,
          type: payload.data.type,
          is_active: payload.data.is_active,
          audience: {
            roles: payload.target_roles,
            school_ids: payload.school_ids,
            user_ids: payload.user_ids,
          },
        },
      },
    });
    return created;
  });

  if (isAnnouncementActiveNow(announcement)) {
    await deliverAnnouncementNotifications(announcement.id);
  }

  return c.json(
    serializeAdminAnnouncement({
      ...announcement,
      target_roles: payload.target_roles.map((role) => ({ role })),
      mentioned_schools: payload.school_ids.map((school_id) => ({ school_id })),
      mentioned_users: payload.user_ids.map((user_id) => ({ user_id })),
      receipts: [],
    }),
    201,
  );
});

announcementsRoutes.patch("/announcements/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid announcement ID" }, 400);

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing || existing.archived_at) {
    return c.json({ error: "Announcement not found" }, 404);
  }

  let payload;
  try {
    payload = await normalizeAnnouncementPayload(
      sanitizeObject(await c.req.json()) as Record<string, unknown>,
    );
  } catch (error: any) {
    return c.json({ error: error?.message ?? "Invalid announcement" }, 400);
  }

  const announcement = await prisma.$transaction(async (tx) => {
    const updated = await tx.announcement.update({
      where: { id },
      data: payload.data,
    });
    await replaceAnnouncementTargets(tx, id, payload);
    await tx.auditLog.create({
      data: {
        admin_id: admin.id,
        action: "updated_announcement",
        entity_type: "Announcement",
        entity_id: id,
        details: {
          title: payload.data.title,
          type: payload.data.type,
          is_active: payload.data.is_active,
          audience: {
            roles: payload.target_roles,
            school_ids: payload.school_ids,
            user_ids: payload.user_ids,
          },
        },
      },
    });
    return updated;
  });

  if (isAnnouncementActiveNow(announcement)) {
    await deliverAnnouncementNotifications(announcement.id);
  }

  return c.json(serializeAdminAnnouncement({
    ...announcement,
    target_roles: payload.target_roles.map((role) => ({ role })),
    mentioned_schools: payload.school_ids.map((school_id) => ({ school_id })),
    mentioned_users: payload.user_ids.map((user_id) => ({ user_id })),
    receipts: [],
  }));
});

announcementsRoutes.delete("/announcements/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid announcement ID" }, 400);

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing || existing.archived_at) return c.json({ ok: true });

  await prisma.announcement.update({
    where: { id },
    data: { archived_at: new Date(), is_active: false },
  });
  await writeAuditLog(admin.id, "archived_announcement", "Announcement", id, {
    title: existing.title,
  }, { ctx: c });

  return c.json({ ok: true });
});

// Legacy clear endpoint: archive the latest active authoring record.
announcementsRoutes.delete("/announcements", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const latest = await prisma.announcement.findFirst({
    where: { archived_at: null },
    orderBy: { updated_at: "desc" },
    select: { id: true, title: true },
  });
  if (!latest) return c.json({ ok: true });

  await prisma.announcement.update({
    where: { id: latest.id },
    data: { archived_at: new Date(), is_active: false },
  });
  await writeAuditLog(
    admin.id,
    "archived_announcement",
    "Announcement",
    latest.id,
    {
      title: latest.title,
    },
    { ctx: c },
  );

  return c.json({ ok: true });
});

export default announcementsRoutes;
