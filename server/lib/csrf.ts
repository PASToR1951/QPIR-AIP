import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import {
  DEFAULT_ALLOWED_ORIGIN,
  getAllowedOrigins,
  normalizeOrigin,
} from "./origins.ts";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isAllowedCookieOrigin(
  origin: string | null | undefined,
  referer: string | null | undefined,
  allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? DEFAULT_ALLOWED_ORIGIN,
): boolean {
  const allowedOrigins = getAllowedOrigins(allowedOrigin);
  if (allowedOrigins.length === 0) return false;

  const requestOrigin = normalizeOrigin(origin);
  if (requestOrigin) return allowedOrigins.includes(requestOrigin);

  const refererOrigin = normalizeOrigin(referer);
  return Boolean(refererOrigin && allowedOrigins.includes(refererOrigin));
}

export function csrfProtection(): MiddlewareHandler {
  return async (c, next) => {
    if (!UNSAFE_METHODS.has(c.req.method.toUpperCase())) {
      await next();
      return;
    }

    if (!getCookie(c, "token")) {
      await next();
      return;
    }

    if (
      isAllowedCookieOrigin(c.req.header("origin"), c.req.header("referer"))
    ) {
      await next();
      return;
    }

    return c.json({ error: "Invalid request origin." }, 403);
  };
}
