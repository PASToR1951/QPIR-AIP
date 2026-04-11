import type { Context, Handler } from "hono";
import { logger } from "../../../lib/logger.ts";
import type { DataRouteEnv } from "./types.ts";

export function asyncHandler(
  logLabel: string,
  clientMessage: string,
  handler: (c: Context<{ Variables: DataRouteEnv }>) => Promise<Response>,
): Handler<{ Variables: DataRouteEnv }> {
  return async (c) => {
    try {
      return await handler(c);
    } catch (error) {
      logger.error(logLabel, error);
      return c.json({ error: clientMessage }, 500);
    }
  };
}
