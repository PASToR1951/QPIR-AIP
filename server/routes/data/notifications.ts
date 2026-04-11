import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { prisma } from "../../db/client.ts";
import { subscribe } from "../../lib/notifStream.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import type { DataRouteEnv } from "./shared/types.ts";

const notificationsRoutes = new Hono<{ Variables: DataRouteEnv }>();

notificationsRoutes.use("/notifications", requireAuth("Unauthorized"));
notificationsRoutes.use("/notifications/*", requireAuth("Unauthorized"));

notificationsRoutes.get("/notifications/stream", async (c) => {
  const tokenUser = getAuthedUser(c);

  const requestOrigin = c.req.header("Origin");
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173";
  if (requestOrigin === allowedOrigin) {
    c.header("Access-Control-Allow-Origin", allowedOrigin);
    c.header("Access-Control-Allow-Credentials", "true");
  }

  return streamSSE(c, async (stream) => {
    const unsubscribe = subscribe(tokenUser.id, (notif) => {
      stream.writeSSE({
        event: "notification",
        data: JSON.stringify(notif),
      }).catch(() => {});
    });

    if (!unsubscribe) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({ message: "Too many connections" }),
      });
      return;
    }

    await stream.writeSSE({ event: "connected", data: "{}" });

    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: "ping", data: "" }).catch(() =>
        clearInterval(heartbeat)
      );
    }, 20000);

    await new Promise<void>((resolve) => {
      const signal = c.req.raw.signal;
      if (signal.aborted) {
        resolve();
        return;
      }
      signal.addEventListener("abort", () => resolve(), { once: true });
    });

    clearInterval(heartbeat);
    unsubscribe();
  });
});

notificationsRoutes.get("/notifications", async (c) => {
  const tokenUser = getAuthedUser(c);

  const notifications = await prisma.notification.findMany({
    where: { user_id: tokenUser.id },
    orderBy: [{ read: "asc" }, { created_at: "desc" }],
    take: 20,
  });

  return c.json(notifications);
});

notificationsRoutes.patch("/notifications/:id/read", async (c) => {
  const tokenUser = getAuthedUser(c);
  const id = safeParseInt(c.req.param("id"), 0);
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.user_id !== tokenUser.id) {
    return c.json({ error: "Not found" }, 404);
  }

  await prisma.notification.update({ where: { id }, data: { read: true } });
  return c.json({ success: true });
});

notificationsRoutes.patch("/notifications/read-all", async (c) => {
  const tokenUser = getAuthedUser(c);

  await prisma.notification.updateMany({
    where: { user_id: tokenUser.id, read: false },
    data: { read: true },
  });

  return c.json({ success: true });
});

export default notificationsRoutes;
