import type { Context } from "hono";
import { prisma } from "../../../db/client.ts";
import { getClientIp } from "../../../lib/userActivityLog.ts";

export async function writeAuditLog(
  adminId: number,
  action: string,
  entityType: string,
  entityId: number,
  details: Record<string, unknown>,
  opts: { ipAddress?: string | null; ctx?: Context } = {},
) {
  const ipAddress = opts.ipAddress ?? (opts.ctx ? getClientIp(opts.ctx) : null);
  await prisma.auditLog.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details as any,
      ip_address: ipAddress,
    },
  });
}

interface AuditPayload {
  adminId: number;
  action: string;
  entityType: string;
  entityId: number;
  details: Record<string, unknown>;
  opts?: { ipAddress?: string | null };
}

export function withAudit(
  handler: (
    c: Context,
  ) => Promise<Response | { response: Response; audit?: AuditPayload }>,
) {
  return async (c: Context) => {
    const result = await handler(c);
    if (result instanceof Response) {
      return result;
    }
    if (result.audit) {
      await writeAuditLog(
        result.audit.adminId,
        result.audit.action,
        result.audit.entityType,
        result.audit.entityId,
        result.audit.details,
        { ...result.audit.opts, ctx: c },
      );
    }
    return result.response;
  };
}
