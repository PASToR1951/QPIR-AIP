import { Hono } from "hono";
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { prisma } from "../../../db/client.ts";
import { adminOnly } from "../shared/guards.ts";
import { makeRateLimiter } from "../../../lib/rateLimiter.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { toCSV } from "../shared/exports.ts";
import {
  AdminLogQueryError,
  buildLogsCountQuery,
  buildLogsExportQuery,
  parseAdminLogFiltersFromBody,
} from "./query.ts";
import { resolveEntityLabels } from "./entityResolver.ts";
import { buildAdminLogRow, type AdminLogDetailRow, type RawAdminLogRow } from "./shared.ts";
import { getUserFromToken } from "../../../lib/auth.ts";

const EXPORT_LIMIT = 25_000;

function formatManilaDate(iso: string): string {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} +08:00`;
}

function escapeCsvFormula(value: unknown): unknown {
  if (typeof value !== "string" || value.length === 0) return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function toExportRow(row: AdminLogDetailRow) {
  return {
    Source: row.source,
    Action: row.action_label,
    "Action Key": row.action,
    Severity: row.severity,
    Actor: row.actor?.name ?? "—",
    "Actor Email": row.actor?.email ?? "—",
    "Actor Role": row.actor?.role ?? "—",
    "Entity Type": row.entity_type ?? "—",
    "Entity ID": row.entity_id ?? "—",
    Entity: row.entity_label ?? "—",
    "IP Address": row.ip_address ?? "—",
    "Created At (Asia/Manila)": formatManilaDate(row.created_at),
    Details: JSON.stringify(row.details),
  };
}

function buildFilename() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );
  return `admin-logs-${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}.csv`;
}

export const exportRoutes = new Hono();

exportRoutes.use("/logs/export", adminOnly);
exportRoutes.use("/logs/export", makeRateLimiter(5, 60_000, {
  keyPrefix: "/api/admin/logs/export",
}));

exportRoutes.post("/logs/export", async (c) => {
  try {
    const actor = (await getUserFromToken(c))!;
    const body = sanitizeObject(await c.req.json().catch(() => ({}))) as
      Record<string, unknown>;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (reason.length < 8 || reason.length > 500) {
      return c.json({
        error: "reason must be between 8 and 500 characters.",
      }, 400);
    }

    const filters = parseAdminLogFiltersFromBody(body, EXPORT_LIMIT);
    const totals = await prisma.$queryRaw<Array<{ total: bigint | number | string }>>(
      buildLogsCountQuery(filters),
    );
    const total = Number(totals[0]?.total ?? 0);

    if (!total) {
      return c.json({ error: "No logs matched the current filters." }, 404);
    }

    if (total > EXPORT_LIMIT) {
      return c.json({
        error: `Too many rows to export. Narrow the filters below ${EXPORT_LIMIT.toLocaleString()} rows.`,
      }, 413);
    }

    const rawRows = await prisma.$queryRaw<RawAdminLogRow[]>(
      buildLogsExportQuery(filters, EXPORT_LIMIT),
    );
    const entityLabels = await resolveEntityLabels(rawRows);
    const rows = rawRows.map((row) => buildAdminLogRow(row, {
      entityLabels,
      includeDetails: true,
    }) as AdminLogDetailRow);

    const csvRows = rows.map((row) => {
      const shaped = toExportRow(row);
      return Object.fromEntries(
        Object.entries(shaped).map(([key, value]) => [key, escapeCsvFormula(value)]),
      );
    });

    await writeAuditLog(actor.id, "exported_admin_logs", "Export", 0, {
      reason,
      source: filters.source,
      action: filters.actions,
      entityType: filters.entityTypes,
      role: filters.roles,
      severity: filters.severities,
      from: filters.from?.toISOString() ?? null,
      to: filters.to?.toISOString() ?? null,
      ip: filters.ip,
      q: filters.q,
      row_count: rows.length,
    }, { ctx: c });

    return new Response(toCSV(csvRows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${buildFilename()}"`,
      },
    });
  } catch (error) {
    if (error instanceof AdminLogQueryError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("[admin logs export]", error);
    return c.json({ error: "Failed to export admin logs." }, 500);
  }
});
