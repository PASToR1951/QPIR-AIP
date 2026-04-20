import { buildSubmittedBy } from "../shared/display.ts";
import { getActionMeta } from "./actionCatalog.ts";
import { redactDetails } from "./redact.ts";

export interface RawAdminLogRow {
  id: bigint | number | string;
  source: string;
  action: string;
  entity_type: string | null;
  entity_id: bigint | number | string | null;
  details: unknown;
  ip_address: string | null;
  created_at: Date | string;
  actor_id: bigint | number | string | null;
  actor_role: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_first_name: string | null;
  actor_middle_initial: string | null;
  actor_last_name: string | null;
}

export interface AdminLogActor {
  id: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
}

export interface AdminLogListRow {
  id: number;
  source: "admin" | "user";
  action: string;
  action_label: string;
  category: string;
  severity: string;
  actor: AdminLogActor | null;
  entity_type: string | null;
  entity_id: number | null;
  entity_label: string | null;
  details_preview: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AdminLogDetailRow extends AdminLogListRow {
  details: Record<string, unknown>;
}

export function toNullableNumber(
  value: bigint | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return Number(value);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function getEntityLookupKey(
  entityType: string | null,
  entityId: number | null,
): string | null {
  if (!entityType || entityId === null) return null;
  return `${entityType}:${entityId}`;
}

export function parseLogDetails(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return redactDetails(parsed);
    } catch {
      return {};
    }
  }
  return redactDetails(value);
}

function summarizeValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (typeof value === "object") {
    const size = Object.keys(value).length;
    return `${size} field${size === 1 ? "" : "s"}`;
  }
  return null;
}

export function buildDetailsPreview(details: Record<string, unknown>): string | null {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    const summary = summarizeValue(value);
    if (!summary) continue;
    parts.push(`${key}: ${summary}`);
    if (parts.length === 2) break;
  }
  return parts.length ? parts.join(" · ") : null;
}

function buildActor(raw: RawAdminLogRow): AdminLogActor | null {
  const actorId = toNullableNumber(raw.actor_id);
  const actor = {
    role: raw.actor_role,
    name: raw.actor_name,
    email: raw.actor_email,
    first_name: raw.actor_first_name,
    middle_initial: raw.actor_middle_initial,
    last_name: raw.actor_last_name,
  };

  const displayName = buildSubmittedBy(actor);
  const hasActorData = actorId !== null || Boolean(raw.actor_email) ||
    Boolean(raw.actor_name) || displayName !== "—";

  if (!hasActorData) return null;

  return {
    id: actorId,
    name: displayName === "—" ? null : displayName,
    email: raw.actor_email,
    role: raw.actor_role,
  };
}

function fallbackEntityLabel(
  entityType: string | null,
  entityId: number | null,
): string | null {
  if (!entityType && entityId === null) return null;
  if (!entityType) return entityId === null ? null : `#${entityId}`;
  if (entityId === null || entityId === 0) return entityType;
  return `${entityType} #${entityId}`;
}

export function buildAdminLogRow(
  raw: RawAdminLogRow,
  {
    entityLabels,
    includeDetails = false,
  }: {
    entityLabels?: Map<string, string>;
    includeDetails?: boolean;
  } = {},
): AdminLogListRow | AdminLogDetailRow {
  const meta = getActionMeta(raw.action);
  const entityId = toNullableNumber(raw.entity_id);
  const lookupKey = getEntityLookupKey(raw.entity_type, entityId);
  const details = parseLogDetails(raw.details);

  const base: AdminLogListRow = {
    id: toNullableNumber(raw.id) ?? 0,
    source: raw.source === "user" ? "user" : "admin",
    action: raw.action,
    action_label: meta.label,
    category: meta.category,
    severity: meta.severity,
    actor: buildActor(raw),
    entity_type: raw.entity_type,
    entity_id: entityId,
    entity_label: lookupKey
      ? entityLabels?.get(lookupKey) ??
        fallbackEntityLabel(raw.entity_type, entityId)
      : fallbackEntityLabel(raw.entity_type, entityId),
    details_preview: buildDetailsPreview(details),
    ip_address: raw.ip_address,
    created_at: new Date(raw.created_at).toISOString(),
  };

  if (!includeDetails) return base;
  return { ...base, details };
}
