const KNOWN_UNIQUE_CONSTRAINTS = new Set([
  "AIP_school_id_program_id_year_key",
  "AIP_div_personnel_unique_idx",
  "PIR_aip_id_quarter_key",
]);

const KNOWN_UNIQUE_FIELD_TARGETS = new Set([
  "school_id,program_id,year",
  "created_by_user_id,program_id,year",
  "aip_id,quarter",
]);

function getErrorRecord(
  error: unknown,
): { code?: unknown; meta?: unknown } | null {
  return typeof error === "object" && error !== null
    ? error as { code?: unknown; meta?: unknown }
    : null;
}

export function getPrismaUniqueTarget(error: unknown): string {
  const record = getErrorRecord(error);
  const meta = typeof record?.meta === "object" && record.meta !== null
    ? record.meta as { target?: unknown }
    : null;
  const target = meta?.target;
  if (Array.isArray(target)) {
    return target.map(String).join(",");
  }
  return String(target ?? "");
}

export function isPrismaUniqueConflict(error: unknown): boolean {
  return getErrorRecord(error)?.code === "P2002";
}

export function isPrismaUniqueConflictWithoutTarget(error: unknown): boolean {
  return isPrismaUniqueConflict(error) &&
    getPrismaUniqueTarget(error).trim() === "";
}

export function isKnownUniqueConflict(error: unknown): boolean {
  if (!isPrismaUniqueConflict(error)) return false;
  const target = getPrismaUniqueTarget(error);
  return KNOWN_UNIQUE_CONSTRAINTS.has(target) ||
    KNOWN_UNIQUE_FIELD_TARGETS.has(target);
}
