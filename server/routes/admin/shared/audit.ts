import type { Context } from "hono";
import { prisma } from "../../../db/client.ts";

export async function writeAuditLog(
  adminId: number,
  action: string,
  entityType: string,
  entityId: number,
  details: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details as any,
    },
  });
}

interface AuditPayload {
  adminId: number;
  action: string;
  entityType: string;
  entityId: number;
  details: Record<string, unknown>;
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
      );
    }
    return result.response;
  };
}
