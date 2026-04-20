import { Hono, type Context } from "hono";
import { prisma } from "../../../db/client.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { hashSessionToken } from "../../../lib/userSessions.ts";
import { adminOnly } from "../shared/guards.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { resolveEntityLabels } from "./entityResolver.ts";
import {
  AdminLogQueryError,
  buildLogsCountQuery,
  buildLogsListQuery,
  parseAdminLogFiltersFromQuery,
} from "./query.ts";
import { buildAdminLogRow, type RawAdminLogRow } from "./shared.ts";

export const listRoutes = new Hono();

listRoutes.use("/logs", adminOnly);

function buildSessionFingerprint(sessionHash: string): number {
  return parseInt(sessionHash.slice(0, 8), 16);
}

async function ensureViewedAdminLogsAudit(c: Context) {
  const actor = await getUserFromToken(c);
  if (!actor?.sid) return;

  const sessionHash = await hashSessionToken(actor.sid);
  const sessionFingerprint = buildSessionFingerprint(sessionHash);

  if (!Number.isInteger(sessionFingerprint) || sessionFingerprint <= 0) return;

  const existing = await prisma.auditLog.findFirst({
    where: {
      admin_id: actor.id,
      action: "viewed_admin_logs",
      entity_type: "AdminLogsSession",
      entity_id: sessionFingerprint,
    },
    select: { id: true },
  });

  if (existing) return;

  await writeAuditLog(actor.id, "viewed_admin_logs", "AdminLogsSession", sessionFingerprint, {
    session_fingerprint: sessionFingerprint,
  }, { ctx: c });
}

listRoutes.get("/logs", async (c) => {
  try {
    const filters = parseAdminLogFiltersFromQuery(c);
    const [rows, totals] = await Promise.all([
      prisma.$queryRaw<RawAdminLogRow[]>(buildLogsListQuery(filters)),
      prisma.$queryRaw<Array<{ total: bigint | number | string }>>(
        buildLogsCountQuery(filters),
      ),
    ]);

    const entityLabels = await resolveEntityLabels(rows);
    await ensureViewedAdminLogsAudit(c);
    return c.json({
      rows: rows.map((row) => buildAdminLogRow(row, { entityLabels })),
      total: Number(totals[0]?.total ?? 0),
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error) {
    if (error instanceof AdminLogQueryError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("[admin logs list]", error);
    return c.json({ error: "Failed to load admin logs." }, 500);
  }
});
