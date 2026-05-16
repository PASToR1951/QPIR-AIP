import { Hono } from "hono";
import {
  dismissAnnouncementForUser,
  getActiveAnnouncementsForUser,
  getAnnouncementForUser,
} from "../lib/announcements.ts";
import { getUserFromToken } from "../lib/auth.ts";
import { safeParseInt } from "../lib/safeParseInt.ts";

const announcementsRoutes = new Hono();

async function requireAnnouncementUser(c: any) {
  const user = await getUserFromToken(c);
  if (!user) return null;
  return user;
}

announcementsRoutes.get("/announcements/active", async (c) => {
  const user = await requireAnnouncementUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  return c.json(await getActiveAnnouncementsForUser(user));
});

announcementsRoutes.get("/announcements/:id", async (c) => {
  const user = await requireAnnouncementUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid announcement ID" }, 400);

  const announcement = await getAnnouncementForUser(user, id);
  if (!announcement) return c.json({ error: "Announcement not found" }, 404);
  return c.json(announcement);
});

announcementsRoutes.post("/announcements/:id/dismiss", async (c) => {
  const user = await requireAnnouncementUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid announcement ID" }, 400);

  const announcement = await getAnnouncementForUser(user, id);
  if (!announcement) return c.json({ error: "Announcement not found" }, 404);
  if (announcement.dismissible === false) {
    return c.json({ error: "Announcement cannot be dismissed" }, 400);
  }

  await dismissAnnouncementForUser(id, user.id);
  return c.json({ ok: true });
});

// Backward-compatible single-banner endpoint.
announcementsRoutes.get("/announcement", async (c) => {
  const user = await requireAnnouncementUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const active = await getActiveAnnouncementsForUser(user);
  return c.json(active[0] ?? null);
});

export default announcementsRoutes;
