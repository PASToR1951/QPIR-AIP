import { prisma } from "../db/client.ts";
import { logger } from "./logger.ts";

export interface UserLogParams {
  userId: number | null;
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Write a user activity log entry. Non-blocking: errors are logged but never
 * propagated to the caller so the main request is not affected.
 */
export function writeUserLog(params: UserLogParams): void {
  prisma.userActivityLog
    .create({
      data: {
        user_id: params.userId ?? null,
        action: params.action,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
        // deno-lint-ignore no-explicit-any
        details: (params.details ?? {}) as any,
        ip_address: params.ipAddress ?? null,
      },
    })
    .catch((err) => {
      logger.error("Failed to write user activity log", {
        error: err,
        userId: params.userId,
        action: params.action,
      });
    });
}
