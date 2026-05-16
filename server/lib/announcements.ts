import { prisma } from "../db/client.ts";
import type { TokenPayload } from "./auth.ts";
import { logger } from "./logger.ts";
import { pushNotifications } from "./notifStream.ts";

export const ANNOUNCEMENT_TYPES = ["info", "warning", "critical"] as const;
export const ANNOUNCEMENT_TARGET_ROLES = [
  "School",
  "Division Personnel",
  "Admin",
  "CES-SGOD",
  "CES-ASDS",
  "CES-CID",
  "Observer",
] as const;

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

interface AnnouncementAudienceShape {
  id: number;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  is_active?: boolean | null;
  dismissible?: boolean | null;
  starts_at?: Date | string | null;
  expires_at?: Date | string | null;
  archived_at?: Date | string | null;
  action_label?: string | null;
  action_url?: string | null;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
  mentioned_schools?: Array<{ school_id: number }>;
  mentioned_users?: Array<{ user_id: number }>;
  target_roles?: Array<{ role: string } | string>;
  receipts?: Array<{
    user_id?: number;
    dismissed_at?: Date | string | null;
    notified_at?: Date | string | null;
  }>;
}

interface AnnouncementUserShape {
  id: number;
  role: string;
  school_id?: number | null;
}

function dateTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : null;
}

function roleTargets(announcement: AnnouncementAudienceShape): string[] {
  return [
    ...new Set(
      (announcement.target_roles ?? [])
        .map((item) => typeof item === "string" ? item : item.role)
        .filter(Boolean),
    ),
  ];
}

function schoolTargets(announcement: AnnouncementAudienceShape): number[] {
  return [
    ...new Set(
      (announcement.mentioned_schools ?? [])
        .map((item) => item.school_id)
        .filter((id) => Number.isInteger(id)),
    ),
  ];
}

function userTargets(announcement: AnnouncementAudienceShape): number[] {
  return [
    ...new Set(
      (announcement.mentioned_users ?? [])
        .map((item) => item.user_id)
        .filter((id) => Number.isInteger(id)),
    ),
  ];
}

export function hasAnnouncementAudienceTargets(
  announcement: AnnouncementAudienceShape,
): boolean {
  return roleTargets(announcement).length > 0 ||
    schoolTargets(announcement).length > 0 ||
    userTargets(announcement).length > 0;
}

export function isAnnouncementActiveNow(
  announcement: AnnouncementAudienceShape,
  now = new Date(),
): boolean {
  if (!announcement.is_active || announcement.archived_at) return false;

  const nowTime = now.getTime();
  const startsAt = dateTime(announcement.starts_at);
  const expiresAt = dateTime(announcement.expires_at);

  if (startsAt !== null && startsAt > nowTime) return false;
  if (expiresAt !== null && expiresAt <= nowTime) return false;
  return true;
}

export function announcementMatchesUser(
  announcement: AnnouncementAudienceShape,
  user: AnnouncementUserShape,
): boolean {
  if (!hasAnnouncementAudienceTargets(announcement)) return true;

  if (userTargets(announcement).includes(user.id)) return true;
  if (roleTargets(announcement).includes(user.role)) return true;

  return user.school_id != null &&
    schoolTargets(announcement).includes(user.school_id);
}

export function isAnnouncementDismissedByUser(
  announcement: AnnouncementAudienceShape,
  userId: number,
): boolean {
  return (announcement.receipts ?? []).some((receipt) =>
    receipt.user_id === userId && Boolean(receipt.dismissed_at)
  );
}

export function shouldShowAnnouncementToUser(
  announcement: AnnouncementAudienceShape,
  user: AnnouncementUserShape,
  now = new Date(),
): boolean {
  return isAnnouncementActiveNow(announcement, now) &&
    announcementMatchesUser(announcement, user) &&
    !isAnnouncementDismissedByUser(announcement, user.id);
}

export function recipientIdsNeedingAnnouncementNotification(
  recipientIds: number[],
  receipts: Array<{
    user_id: number;
    notified_at?: Date | string | null;
    dismissed_at?: Date | string | null;
  }>,
): number[] {
  const receiptByUser = new Map(receipts.map((receipt) => [
    receipt.user_id,
    receipt,
  ]));
  return [...new Set(recipientIds)].filter((userId) =>
    !receiptByUser.get(userId)?.notified_at &&
    !receiptByUser.get(userId)?.dismissed_at
  );
}

export function serializeAnnouncementForUser(
  announcement: AnnouncementAudienceShape,
) {
  return {
    id: announcement.id,
    title: announcement.title ?? "Announcement",
    message: announcement.message ?? "",
    type: announcement.type ?? "info",
    is_active: announcement.is_active !== false,
    dismissible: announcement.dismissible !== false,
    starts_at: announcement.starts_at ?? null,
    expires_at: announcement.expires_at ?? null,
    archived_at: announcement.archived_at ?? null,
    action_label: announcement.action_label ?? null,
    action_url: announcement.action_url ?? null,
    created_at: announcement.created_at ?? null,
    updated_at: announcement.updated_at ?? null,
  };
}

export function sortAnnouncementsForDisplay<
  T extends AnnouncementAudienceShape,
>(
  announcements: T[],
): T[] {
  return [...announcements].sort((a, b) => {
    const severity = (SEVERITY_RANK[a.type ?? "info"] ?? 2) -
      (SEVERITY_RANK[b.type ?? "info"] ?? 2);
    if (severity !== 0) return severity;
    return (dateTime(b.updated_at) ?? 0) - (dateTime(a.updated_at) ?? 0);
  });
}

function plainAnnouncementMessage(message: string): string {
  return message.replace(/@\[([^\]]+)\]/g, (_match, name) => `@${name}`);
}

async function resolveAnnouncementRecipientIds(
  announcement: AnnouncementAudienceShape,
): Promise<number[]> {
  const roles = roleTargets(announcement);
  const schoolIds = schoolTargets(announcement);
  const directUserIds = userTargets(announcement);

  const audienceOr: any[] = [];
  if (roles.length > 0) audienceOr.push({ role: { in: roles } });
  if (schoolIds.length > 0) audienceOr.push({ school_id: { in: schoolIds } });
  if (directUserIds.length > 0) audienceOr.push({ id: { in: directUserIds } });

  const users = await prisma.user.findMany({
    where: {
      is_active: true,
      deleted_at: null,
      ...(audienceOr.length > 0 ? { OR: audienceOr } : {}),
    },
    select: { id: true },
  });

  return users.map((user) => user.id);
}

async function findDeliverableAnnouncement(id: number) {
  return prisma.announcement.findUnique({
    where: { id },
    include: {
      mentioned_schools: { select: { school_id: true } },
      mentioned_users: { select: { user_id: true } },
      target_roles: { select: { role: true } },
    },
  });
}

export async function deliverAnnouncementNotifications(
  announcementId: number,
  now = new Date(),
) {
  const announcement = await findDeliverableAnnouncement(announcementId);
  if (!announcement || !isAnnouncementActiveNow(announcement, now)) return [];

  const recipientIds = await resolveAnnouncementRecipientIds(announcement);
  if (recipientIds.length === 0) return [];

  const receipts = await prisma.announcementReceipt.findMany({
    where: {
      announcement_id: announcement.id,
      user_id: { in: recipientIds },
    },
    select: { user_id: true, notified_at: true, dismissed_at: true },
  });
  const toNotify = recipientIdsNeedingAnnouncementNotification(
    recipientIds,
    receipts,
  );
  if (toNotify.length === 0) return [];

  const notifications = await prisma.$transaction(async (tx) => {
    const created = await tx.notification.createManyAndReturn({
      data: toNotify.map((userId) => ({
        user_id: userId,
        title: announcement.title || "Announcement",
        message: plainAnnouncementMessage(announcement.message),
        type: "announcement",
        entity_id: announcement.id,
        entity_type: "announcement",
      })),
    });

    await tx.announcementReceipt.createMany({
      data: toNotify.map((userId) => ({
        announcement_id: announcement.id,
        user_id: userId,
        notified_at: now,
      })),
      skipDuplicates: true,
    });
    await tx.announcementReceipt.updateMany({
      where: {
        announcement_id: announcement.id,
        user_id: { in: toNotify },
        notified_at: null,
      },
      data: { notified_at: now },
    });

    return created;
  });

  if (notifications.length > 0) pushNotifications(notifications);
  return notifications;
}

export async function deliverDueAnnouncementNotifications(now = new Date()) {
  const due = await prisma.announcement.findMany({
    where: {
      is_active: true,
      archived_at: null,
      OR: [{ starts_at: null }, { starts_at: { lte: now } }],
      AND: [{ OR: [{ expires_at: null }, { expires_at: { gt: now } }] }],
    },
    select: { id: true },
  });

  const delivered = [];
  for (const announcement of due) {
    delivered.push(
      ...await deliverAnnouncementNotifications(announcement.id, now),
    );
  }
  return delivered;
}

let schedulerStarted = false;

export function startAnnouncementDeliveryScheduler(intervalMs = 60_000) {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const run = () => {
    deliverDueAnnouncementNotifications().catch((error) => {
      logger.warn("Announcement delivery scheduler failed", {
        error: error?.message ?? String(error),
      });
    });
  };

  setTimeout(run, 5_000);
  setInterval(run, intervalMs);
}

export async function getActiveAnnouncementsForUser(user: TokenPayload) {
  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      is_active: true,
      archived_at: null,
      OR: [{ starts_at: null }, { starts_at: { lte: now } }],
      AND: [{ OR: [{ expires_at: null }, { expires_at: { gt: now } }] }],
    },
    include: {
      mentioned_schools: { select: { school_id: true } },
      mentioned_users: { select: { user_id: true } },
      target_roles: { select: { role: true } },
      receipts: {
        where: { user_id: user.id },
        select: { user_id: true, dismissed_at: true, notified_at: true },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  return sortAnnouncementsForDisplay(
    announcements.filter((announcement) =>
      shouldShowAnnouncementToUser(announcement, user, now)
    ),
  ).map(serializeAnnouncementForUser);
}

export async function getAnnouncementForUser(
  user: TokenPayload,
  announcementId: number,
) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: {
      mentioned_schools: { select: { school_id: true } },
      mentioned_users: { select: { user_id: true } },
      target_roles: { select: { role: true } },
      receipts: {
        where: { user_id: user.id },
        select: { user_id: true, dismissed_at: true, notified_at: true },
      },
    },
  });
  if (!announcement) return null;

  if (announcementMatchesUser(announcement, user)) {
    return serializeAnnouncementForUser(announcement);
  }

  const hasNotification = await prisma.notification.findFirst({
    where: {
      user_id: user.id,
      type: "announcement",
      entity_type: "announcement",
      entity_id: announcement.id,
    },
    select: { id: true },
  });

  return hasNotification ? serializeAnnouncementForUser(announcement) : null;
}

export async function dismissAnnouncementForUser(
  announcementId: number,
  userId: number,
) {
  const now = new Date();
  await prisma.announcementReceipt.upsert({
    where: {
      announcement_id_user_id: {
        announcement_id: announcementId,
        user_id: userId,
      },
    },
    create: {
      announcement_id: announcementId,
      user_id: userId,
      dismissed_at: now,
    },
    update: { dismissed_at: now },
  });
}
