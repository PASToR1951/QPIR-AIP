import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { adminOnly } from "./shared/guards.ts";

const auditRoutes = new Hono();

auditRoutes.use("/audit-log", adminOnly);
auditRoutes.use("/audit-logs", adminOnly);

auditRoutes.get("/audit-log", async (c) => {
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = Math.min(100, safeParseInt(c.req.query("limit"), 50));
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
      include: { admin: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return c.json({
    data: logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

auditRoutes.get("/audit-logs", async (c) => {
  const page = Math.max(1, safeParseInt(c.req.query("page"), 1));
  const limit = Math.min(100, safeParseInt(c.req.query("limit"), 50));
  const action = c.req.query("action");
  const entity_type = c.req.query("entity_type");
  const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined;
  const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined;

  const where = {
    ...(action && { action: { contains: action } }),
    ...(entity_type && { entity_type }),
    ...(from || to
      ? { created_at: { ...(from && { gte: from }), ...(to && { lte: to }) } }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        admin_id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        details: true,
        created_at: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return c.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
});

export default auditRoutes;
