import type { Context, Handler } from "hono";
import { HttpError } from "../../../lib/errors.ts";
import { logger } from "../../../lib/logger.ts";
import { isKnownUniqueConflict } from "../../../lib/prismaErrors.ts";

export function adminAsyncHandler(
  logLabel: string,
  clientMessage: string,
  handler: (c: Context) => Promise<Response>,
): Handler {
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
