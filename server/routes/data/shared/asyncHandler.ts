import type { Context, Handler } from "hono";
import { HttpError } from "../../../lib/errors.ts";
import { logger } from "../../../lib/logger.ts";
import { isKnownUniqueConflict } from "../../../lib/prismaErrors.ts";
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
      if (error instanceof HttpError) {
        return c.json(
          { error: error.message, code: error.code },
          error.status as any,
        );
      }
      if (isKnownUniqueConflict(error)) {
        return c.json(
          { error: "A record already exists for this request" },
          409,
        );
      }
      logger.error(logLabel, error);
      return c.json({ error: clientMessage }, 500);
    }
  };
}
