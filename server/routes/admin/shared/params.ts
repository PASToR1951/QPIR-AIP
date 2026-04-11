import type { Context } from "hono";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { isValidQuarter } from "./dates.ts";

export function parsePositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseOptionalPositiveInt(value: string | undefined) {
  if (!value) return undefined;
  const parsed = safeParseInt(value, 0);
  return !Number.isNaN(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseYear(
  value: string | undefined,
  fallback = new Date().getFullYear(),
) {
  return safeParseInt(value, fallback);
}

export function parseQuarter(
  value: string | undefined,
  fallback = 1,
) {
  return safeParseInt(value, fallback);
}

export function parseExportFormat(value: string | undefined) {
  return value || "csv";
}

export function buildSchoolScopeFilter(
  clusterId?: number,
  schoolId?: number,
) {
  return schoolId
    ? { id: schoolId }
    : clusterId
    ? { cluster_id: clusterId }
    : undefined;
}

export function buildSubmissionFilters(c: Context) {
  const query = (key: string) => c.req.query(key);
  const type = query("type");
  const clusterId = parseOptionalPositiveInt(query("cluster"));
  const schoolId = parseOptionalPositiveInt(query("school"));
  const programId = parseOptionalPositiveInt(query("program"));
  const quarter = query("quarter");
  const year = query("year") ? safeParseInt(query("year"), 0) : undefined;
  const status = query("status");
  const page = safeParseInt(query("page"), 1);
  const limit = Math.min(100, safeParseInt(query("limit"), 25));
  const skip = (page - 1) * limit;
  const schoolFilter = buildSchoolScopeFilter(clusterId, schoolId);

  return {
    type,
    clusterId,
    schoolId,
    programId,
    quarter,
    year,
    status,
    page,
    limit,
    skip,
    schoolFilter,
    aipWhere: {
      status: { not: "Draft" as const },
      ...(year && { year }),
      ...(programId && { program_id: programId }),
      ...(status && { status }),
      ...(schoolFilter && { school: schoolFilter }),
    },
    pirWhere: {
      status: { not: "Draft" as const },
      ...(quarter && { quarter: { contains: `${quarter}` } }),
      ...(status && { status }),
      aip: {
        ...(year && { year }),
        ...(programId && { program_id: programId }),
        ...(schoolFilter && { school: schoolFilter }),
      },
    },
  };
}

export function parseReportQuery(
  c: Context,
  {
    defaultQuarter = 1,
    requireCluster = false,
  }: {
    defaultQuarter?: number;
    requireCluster?: boolean;
  } = {},
) {
  const year = parseYear(c.req.query("year"));
  const quarter = parseQuarter(c.req.query("quarter"), defaultQuarter);
  const clusterId = parseOptionalPositiveInt(c.req.query("cluster"));
  const schoolId = parseOptionalPositiveInt(c.req.query("school"));
  const programId = parseOptionalPositiveInt(c.req.query("program"));
  const status = c.req.query("status");
  const format = parseExportFormat(c.req.query("format"));

  return {
    year,
    quarter,
    clusterId,
    schoolId,
    programId,
    status,
    format,
    isValidYear: !Number.isNaN(year) && year >= 2020 && year <= 2100,
    isValidQuarter: isValidQuarter(quarter),
    hasRequiredCluster: !requireCluster || !!clusterId,
  };
}
