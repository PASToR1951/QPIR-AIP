import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { pushNotifications } from "../../lib/notifStream.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { adminOnly } from "./shared/guards.ts";

const announcementsRoutes = new Hono();

announcementsRoutes.use("/announcements", adminOnly);

announcementsRoutes.get("/announcements", async (c) => {
  const announcement = await prisma.announcement.findFirst({
    orderBy: { updated_at: "desc" },
    include: {
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
    },
  });
  return c.json(announcement ?? null);
});

announcementsRoutes.post("/announcements", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const { message, type, is_active, dismissible, expires_at } = sanitizeObject(
    await c.req.json(),
  );

  const expiresAtDate = expires_at ? new Date(expires_at) : null;
  const mentionTokens: string[] = [...message.matchAll(/@\[([^\]]+)\]/g)].map((
    match: RegExpMatchArray,
  ) => match[1] as string);

  const mentionedSchoolIds: number[] = [];
  const mentionedUserIds: number[] = [];

  if (mentionTokens.length > 0) {
    const [allSchools, allDivPersonnel] = await Promise.all([
      prisma.school.findMany({
        select: { id: true, name: true, abbreviation: true },
      }),
      prisma.user.findMany({
        where: { role: "Division Personnel", is_active: true },
        select: { id: true, name: true, first_name: true, last_name: true },
      }),
    ]);

    for (const token of mentionTokens) {
      const normalized = token.toLowerCase();
      const school = allSchools.find((candidate) =>
        candidate.name.toLowerCase() === normalized ||
        (candidate.abbreviation ?? "").toLowerCase() === normalized
      );
      if (school) {
        mentionedSchoolIds.push(school.id);
        continue;
      }

      const user = allDivPersonnel.find((candidate) => {
        const fullName = [candidate.first_name, candidate.last_name]
          .filter(Boolean)
          .join(" ");
        return fullName.toLowerCase() === normalized ||
          (candidate.name ?? "").toLowerCase() === normalized;
      });
      if (user) mentionedUserIds.push(user.id);
    }
  }

  const announcement = await prisma.$transaction(async (tx) => {
    const existing = await tx.announcement.findFirst({
      orderBy: { created_at: "desc" },
    });
    const saved = existing
      ? await tx.announcement.update({
        where: { id: existing.id },
        data: {
          message,
          type: type ?? "info",
          is_active: is_active ?? true,
          dismissible: dismissible ?? true,
          expires_at: expiresAtDate,
        },
      })
      : await tx.announcement.create({
        data: {
          message,
          type: type ?? "info",
          is_active: is_active ?? true,
          dismissible: dismissible ?? true,
          expires_at: expiresAtDate,
          created_by: admin.id,
        },
      });

    await tx.announcementMentionSchool.deleteMany({
      where: { announcement_id: saved.id },
    });
    await tx.announcementMentionUser.deleteMany({
      where: { announcement_id: saved.id },
    });

    if (mentionedSchoolIds.length > 0) {
      await tx.announcementMentionSchool.createMany({
        data: mentionedSchoolIds.map((schoolId) => ({
          announcement_id: saved.id,
          school_id: schoolId,
        })),
      });
    }
    if (mentionedUserIds.length > 0) {
      await tx.announcementMentionUser.createMany({
        data: mentionedUserIds.map((userId) => ({
          announcement_id: saved.id,
          user_id: userId,
        })),
      });
    }

    if (mentionedSchoolIds.length > 0 || mentionedUserIds.length > 0) {
      const schoolUsers = mentionedSchoolIds.length > 0
        ? await tx.user.findMany({
          where: { school_id: { in: mentionedSchoolIds }, is_active: true },
          select: { id: true },
        })
        : [];

      const notifyIds = [
        ...new Set([
          ...schoolUsers.map((user) => user.id),
          ...mentionedUserIds,
        ]),
      ];
      const plainMessage = message.replace(
        /@\[([^\]]+)\]/g,
        (_match: string, name: string) => `@${name}`,
      );

      if (notifyIds.length > 0) {
        const notifications = await tx.notification.createManyAndReturn({
          data: notifyIds.map((userId) => ({
            user_id: userId,
            title: "You were mentioned in an announcement",
            message: plainMessage,
            type: "announcement",
            entity_id: saved.id,
            entity_type: "announcement",
          })),
          skipDuplicates: true,
        });
        Object.assign(saved, { _sseNotifs: notifications });
      }
    }

    await tx.auditLog.create({
      data: {
        admin_id: admin.id,
        action: "updated_announcement",
        entity_type: "Announcement",
        entity_id: saved.id,
        details: { message, type, is_active, dismissible },
      },
    });

    return saved;
  });

  const notifications = (announcement as any)._sseNotifs;
  if (notifications?.length) pushNotifications(notifications);

  return c.json(announcement);
});

announcementsRoutes.delete("/announcements", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const existing = await prisma.announcement.findFirst({
    orderBy: { created_at: "desc" },
  });
  if (!existing) return c.json({ ok: true });

  await prisma.$transaction([
    prisma.announcementMentionSchool.deleteMany({
      where: { announcement_id: existing.id },
    }),
    prisma.announcementMentionUser.deleteMany({
      where: { announcement_id: existing.id },
    }),
    prisma.announcement.delete({ where: { id: existing.id } }),
  ]);
  await prisma.auditLog.create({
    data: {
      admin_id: admin.id,
      action: "deleted_announcement",
      entity_type: "Announcement",
      entity_id: existing.id,
      details: {},
    },
  });
  return c.json({ ok: true });
});

export default announcementsRoutes;
