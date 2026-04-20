import type { Context } from "hono";
import pkg from "@prisma/client";
import { listActionCatalog, type AdminLogSeverity } from "./actionCatalog.ts";

const { Prisma } = pkg;

export interface AdminLogFilters {
  source: "all" | "admin" | "user";
  actions: string[];
  entityTypes: string[];
  roles: string[];
  severities: AdminLogSeverity[];
  from: Date | null;
  to: Date | null;
  ip: string | null;
  q: string | null;
  page: number;
  limit: number;
  offset: number;
}

export class AdminLogQueryError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AdminLogQueryError";
    this.status = status;
  }
}

const VALID_SEVERITIES = new Set<AdminLogSeverity>([
  "info",
  "notice",
  "warn",
  "critical",
]);

const ACTIONS_BY_SEVERITY = listActionCatalog().reduce(
  (acc, entry) => {
    acc[entry.severity].push(entry.key);
    return acc;
  },
  {
    info: [] as string[],
    notice: [] as string[],
    warn: [] as string[],
    critical: [] as string[],
  },
);

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

interface FilterInput {
  source?: unknown;
  action?: unknown;
  entityType?: unknown;
  role?: unknown;
  severity?: unknown;
  from?: unknown;
  to?: unknown;
  ip?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value
      .flatMap((item) => String(item ?? "").split(","))
      .map((item) => item.trim())
      .filter(Boolean));
  }

  if (typeof value === "string") {
    return uniqueStrings(value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean));
  }

  return [];
}

function parseSource(value: unknown): "all" | "admin" | "user" {
  const source = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!source || source === "all") return "all";
  if (source === "admin" || source === "user") return source;
  throw new AdminLogQueryError("source must be one of: all, admin, user");
}

function parseDate(value: unknown, name: string): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? `${raw}${name === "to" ? "T23:59:59.999Z" : "T00:00:00.000Z"}`
      : raw,
  );
  if (Number.isNaN(parsed.getTime())) {
    throw new AdminLogQueryError(`${name} must be a valid ISO date`);
  }
  return parsed;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export function parseAdminLogFilters(
  input: FilterInput,
  {
    defaultLimit = 50,
    maxLimit = 100,
  }: {
    defaultLimit?: number;
    maxLimit?: number;
  } = {},
): AdminLogFilters {
  const source = parseSource(input.source);
  const actions = normalizeList(input.action);
  const entityTypes = normalizeList(input.entityType);
  const roles = normalizeList(input.role);
  const severities = normalizeList(input.severity).map((value) =>
    value.toLowerCase()
  );
  const from = parseDate(input.from, "from");
  const to = parseDate(input.to, "to");
  const ip = typeof input.ip === "string" && input.ip.trim()
    ? input.ip.trim()
    : null;
  const q = typeof input.q === "string" && input.q.trim()
    ? input.q.trim().slice(0, 200)
    : null;
  const page = parsePositiveInt(input.page, 1);
  const limit = Math.min(maxLimit, parsePositiveInt(input.limit, defaultLimit));

  if (from && to && from > to) {
    throw new AdminLogQueryError("from must be earlier than or equal to to");
  }

  for (const severity of severities) {
    if (!VALID_SEVERITIES.has(severity as AdminLogSeverity)) {
      throw new AdminLogQueryError(`Unknown severity filter: ${severity}`);
    }
  }

  return {
    source,
    actions,
    entityTypes,
    roles,
    severities: severities as AdminLogSeverity[],
    from,
    to,
    ip,
    q,
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function parseAdminLogFiltersFromQuery(c: Context): AdminLogFilters {
  return parseAdminLogFilters({
    source: c.req.query("source"),
    action: c.req.query("action"),
    entityType: c.req.query("entityType"),
    role: c.req.query("role"),
    severity: c.req.query("severity"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    ip: c.req.query("ip"),
    q: c.req.query("q"),
    page: c.req.query("page"),
    limit: c.req.query("limit"),
  });
}

export function parseAdminLogFiltersFromBody(
  body: Record<string, unknown>,
  maxLimit = 25_000,
): AdminLogFilters {
  return parseAdminLogFilters(
    {
      source: body.source,
      action: body.action,
      entityType: body.entityType,
      role: body.role,
      severity: body.severity,
      from: body.from,
      to: body.to,
      ip: body.ip,
      q: body.q,
      page: 1,
      limit: maxLimit,
    },
    { defaultLimit: maxLimit, maxLimit },
  );
}

function buildUnionSql() {
  return Prisma.sql`
    SELECT
      logs.id,
      logs.source,
      logs.action,
      logs.entity_type,
      logs.entity_id,
      logs.details,
      logs.ip_address,
      logs.created_at,
      logs.actor_id,
      logs.actor_role,
      logs.actor_name,
      logs.actor_email,
      logs.actor_first_name,
      logs.actor_middle_initial,
      logs.actor_last_name
    FROM (
      SELECT
        al.id,
        'admin'::text AS source,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.created_at,
        al.admin_id AS actor_id,
        u.role AS actor_role,
        u.name AS actor_name,
        u.email AS actor_email,
        u.first_name AS actor_first_name,
        u.middle_initial AS actor_middle_initial,
        u.last_name AS actor_last_name
      FROM "audit_logs" al
      LEFT JOIN "User" u
        ON u.id = al.admin_id

      UNION ALL

      SELECT
        ul.id,
        'user'::text AS source,
        ul.action,
        ul.entity_type,
        ul.entity_id,
        ul.details,
        ul.ip_address,
        ul.created_at,
        ul.user_id AS actor_id,
        u.role AS actor_role,
        u.name AS actor_name,
        u.email AS actor_email,
        u.first_name AS actor_first_name,
        u.middle_initial AS actor_middle_initial,
        u.last_name AS actor_last_name
      FROM "user_activity_logs" ul
      LEFT JOIN "User" u
        ON u.id = ul.user_id
    ) logs
  `;
}

function buildSeverityCaseSql() {
  return Prisma.sql`
    CASE
      WHEN logs.action IN (${Prisma.join(ACTIONS_BY_SEVERITY.critical)}) THEN 'critical'
      WHEN logs.action IN (${Prisma.join(ACTIONS_BY_SEVERITY.warn)}) THEN 'warn'
      WHEN logs.action IN (${Prisma.join(ACTIONS_BY_SEVERITY.notice)}) THEN 'notice'
      WHEN logs.action IN (${Prisma.join(ACTIONS_BY_SEVERITY.info)}) THEN 'info'
      WHEN LOWER(logs.action) = 'failed_login'
        OR LOWER(logs.action) LIKE '%deleted%'
        OR LOWER(logs.action) LIKE '%anonymized%'
        OR LOWER(logs.action) LIKE '%revoked%'
        OR LOWER(logs.action) LIKE '%backup_triggered%'
      THEN 'critical'
      WHEN LOWER(logs.action) LIKE '%returned%'
        OR LOWER(logs.action) LIKE '%denied%'
        OR LOWER(logs.action) LIKE '%reset%'
        OR LOWER(logs.action) LIKE '%changed_deadline%'
        OR LOWER(logs.action) LIKE '%updated_email_config%'
        OR LOWER(logs.action) LIKE '%exported_admin_logs%'
      THEN 'warn'
      WHEN LOWER(logs.action) LIKE '%created%'
        OR LOWER(logs.action) LIKE '%updated%'
        OR LOWER(logs.action) LIKE '%approved%'
        OR LOWER(logs.action) LIKE '%submitted%'
        OR LOWER(logs.action) LIKE '%started%'
        OR LOWER(logs.action) LIKE '%assigned%'
        OR LOWER(logs.action) LIKE '%uploaded%'
        OR LOWER(logs.action) LIKE '%sent%'
        OR LOWER(logs.action) LIKE '%export%'
      THEN 'notice'
      ELSE 'info'
    END
  `;
}

function buildWhereSql(filters: AdminLogFilters) {
  const conditions: unknown[] = [];

  if (filters.source !== "all") {
    conditions.push(Prisma.sql`logs.source = ${filters.source}`);
  }

  if (filters.actions.length) {
    conditions.push(Prisma.sql`logs.action IN (${Prisma.join(filters.actions)})`);
  }

  if (filters.entityTypes.length) {
    conditions.push(
      Prisma.sql`logs.entity_type IN (${Prisma.join(filters.entityTypes)})`,
    );
  }

  if (filters.roles.length) {
    conditions.push(
      Prisma.sql`logs.actor_role IN (${Prisma.join(filters.roles)})`,
    );
  }

  if (filters.severities.length) {
    conditions.push(
      Prisma.sql`${buildSeverityCaseSql()} IN (${Prisma.join(filters.severities)})`,
    );
  }

  if (filters.from) {
    conditions.push(Prisma.sql`logs.created_at >= ${filters.from}`);
  }

  if (filters.to) {
    conditions.push(Prisma.sql`logs.created_at <= ${filters.to}`);
  }

  if (filters.ip) {
    conditions.push(Prisma.sql`logs.ip_address = ${filters.ip}`);
  }

  if (filters.q) {
    const search = `%${filters.q}%`;
    conditions.push(
      Prisma.sql`(
        logs.action ILIKE ${search}
        OR COALESCE(logs.entity_type, '') ILIKE ${search}
        OR COALESCE(logs.actor_name, '') ILIKE ${search}
        OR COALESCE(logs.actor_email, '') ILIKE ${search}
        OR CAST(logs.details AS TEXT) ILIKE ${search}
      )`,
    );
  }

  if (!conditions.length) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

function buildBaseSql(filters: AdminLogFilters) {
  const whereSql = buildWhereSql(filters);
  return Prisma.sql`${buildUnionSql()} ${whereSql}`;
}

export function buildLogsListQuery(filters: AdminLogFilters) {
  return Prisma.sql`
    SELECT logs.*
    ${buildBaseSql(filters)}
    ORDER BY logs.created_at DESC, logs.source DESC, logs.id DESC
    LIMIT ${filters.limit}
    OFFSET ${filters.offset}
  `;
}

export function buildLogsExportQuery(filters: AdminLogFilters, limit: number) {
  return Prisma.sql`
    SELECT logs.*
    ${buildBaseSql(filters)}
    ORDER BY logs.created_at DESC, logs.source DESC, logs.id DESC
    LIMIT ${limit}
  `;
}

export function buildLogsCountQuery(filters: AdminLogFilters) {
  return Prisma.sql`
    SELECT COUNT(*)::bigint AS total
    ${buildBaseSql(filters)}
  `;
}

export function buildActionFacetQuery(filters: AdminLogFilters) {
  return Prisma.sql`
    SELECT logs.action AS key, COUNT(*)::bigint AS count
    ${buildBaseSql({
      ...filters,
      actions: [],
    })}
    GROUP BY logs.action
    ORDER BY count DESC, logs.action ASC
  `;
}

export function buildEntityTypeFacetQuery(filters: AdminLogFilters) {
  return Prisma.sql`
    SELECT logs.entity_type AS key, COUNT(*)::bigint AS count
    ${buildBaseSql({
      ...filters,
      entityTypes: [],
    })}
    GROUP BY logs.entity_type
    HAVING logs.entity_type IS NOT NULL
    ORDER BY count DESC, logs.entity_type ASC
  `;
}

export function buildActorRoleFacetQuery(filters: AdminLogFilters) {
  return Prisma.sql`
    SELECT logs.actor_role AS key, COUNT(*)::bigint AS count
    ${buildBaseSql({
      ...filters,
      roles: [],
    })}
    GROUP BY logs.actor_role
    HAVING logs.actor_role IS NOT NULL
    ORDER BY count DESC, logs.actor_role ASC
  `;
}

export function buildLogDetailQuery(source: "admin" | "user", id: number) {
  return Prisma.sql`
    SELECT logs.*
    ${buildUnionSql()}
    WHERE logs.source = ${source}
      AND logs.id = ${id}
    ORDER BY logs.created_at DESC, logs.source DESC, logs.id DESC
    LIMIT 1
  `;
}
