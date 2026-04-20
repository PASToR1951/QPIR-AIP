import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import { getActionMeta } from "./actionCatalog.ts";
import {
  AdminLogQueryError,
  buildActionFacetQuery,
  buildActorRoleFacetQuery,
  buildEntityTypeFacetQuery,
  parseAdminLogFiltersFromQuery,
} from "./query.ts";
import { adminOnly } from "../shared/guards.ts";

export const facetsRoutes = new Hono();

facetsRoutes.use("/logs/facets", adminOnly);

facetsRoutes.get("/logs/facets", async (c) => {
  try {
    const filters = parseAdminLogFiltersFromQuery(c);
    const [actionRows, entityTypeRows, actorRoleRows] = await Promise.all([
      prisma.$queryRaw<Array<{ key: string; count: bigint | number | string }>>(
        buildActionFacetQuery(filters),
      ),
      prisma.$queryRaw<Array<{ key: string; count: bigint | number | string }>>(
        buildEntityTypeFacetQuery(filters),
      ),
      prisma.$queryRaw<Array<{ key: string; count: bigint | number | string }>>(
        buildActorRoleFacetQuery(filters),
      ),
    ]);

    const severityCounts = new Map<string, number>();
    for (const row of actionRows) {
      const count = Number(row.count);
      const severity = getActionMeta(row.key).severity;
      severityCounts.set(severity, (severityCounts.get(severity) ?? 0) + count);
    }

    return c.json({
      actions: actionRows.map((row) => {
        const meta = getActionMeta(row.key);
        return {
          key: row.key,
          label: meta.label,
          severity: meta.severity,
          category: meta.category,
          count: Number(row.count),
        };
      }),
      entity_types: entityTypeRows.map((row) => ({
        key: row.key,
        count: Number(row.count),
      })),
      actor_roles: actorRoleRows.map((row) => ({
        key: row.key,
        count: Number(row.count),
      })),
      severities: ["critical", "warn", "notice", "info"].map((key) => ({
        key,
        count: severityCounts.get(key) ?? 0,
      })).filter((entry) => entry.count > 0),
    });
  } catch (error) {
    if (error instanceof AdminLogQueryError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("[admin logs facets]", error);
    return c.json({ error: "Failed to load admin log filters." }, 500);
  }
});
