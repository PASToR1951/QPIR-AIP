import type { MiddlewareHandler } from "hono";
import { getClientIp } from "./clientIp.ts";

const rateLimitWindows = new Map<string, number[]>();

export function makeRateLimiter(
  limit: number,
  windowMs: number,
  { keyPrefix }: { keyPrefix?: string } = {},
): MiddlewareHandler {
  return async (c, next) => {
    const ip = getClientIp(c);
    // Without a proxy providing the real IP, all requests would share one bucket.
    if (!ip) {
      await next();
      return;
    }

    const key = `${keyPrefix ?? c.req.path}|${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (rateLimitWindows.get(key) ?? []).filter((value) =>
      value > windowStart
    );

    if (timestamps.length >= limit) {
      return c.json(
        { error: "Too many requests, please try again later." },
        429,
      );
    }

    timestamps.push(now);
    rateLimitWindows.set(key, timestamps);
    await next();
  };
}
