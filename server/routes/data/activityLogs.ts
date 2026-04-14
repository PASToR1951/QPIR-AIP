import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { getAuthedUser, requireAuth } from "./shared/guards.ts";
import type { DataRouteEnv } from "./shared/types.ts";

const activityLogsRoutes = new Hono<{ Variables: DataRouteEnv }>();

activityLogsRoutes.use("/activity-logs", requireAuth("Unauthorized"));

activityLogsRoutes.get("/activity-logs", async (c) => {
  const tokenUser = getAuthedUser(c);
  const page = Math.max(1, safeParseInt(c.req.query("page"), 1));
  const limit = Math.min(100, safeParseInt(c.req.query("limit"), 30));
  const action = c.req.query("action");

  // Hard-filter by the authenticated user's own ID — users may only read their own logs.
  const where = {
    user_id: tokenUser.id,
    ...(action ? { action } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.userActivityLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        details: true,
        ip_address: true,
        created_at: true,
      },
    }),
    prisma.userActivityLog.count({ where }),
  ]);

  return c.json({
    logs,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
});

export default activityLogsRoutes;
