import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizedOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isAllowedCookieOrigin(
  origin: string | null | undefined,
  referer: string | null | undefined,
  allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:5173",
): boolean {
  const allowed = normalizedOrigin(allowedOrigin);
  if (!allowed) return false;

  const requestOrigin = normalizedOrigin(origin);
  if (requestOrigin) return requestOrigin === allowed;

  const refererOrigin = normalizedOrigin(referer);
  return refererOrigin === allowed;
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
