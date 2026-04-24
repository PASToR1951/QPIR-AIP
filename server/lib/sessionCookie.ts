import type { Context } from "hono";

function isHttpsRequest(c: Context): boolean {
  const forwardedProto = c.req.header("x-forwarded-proto")?.split(",")[0]
    ?.trim().toLowerCase();
  if (forwardedProto === "https") return true;
  if (forwardedProto === "http") return false;

  const cfVisitor = c.req.header("cf-visitor");
  if (cfVisitor?.includes('"scheme":"https"')) return true;

  const host = c.req.header("host")?.toLowerCase() ?? "";
  if (host.endsWith(".trycloudflare.com")) return true;

  try {
    if (new URL(c.req.url).protocol === "https:") return true;
  } catch {
    // Fall through to env-based hints.
  }

  return [
    Deno.env.get("OAUTH_REDIRECT_BASE_URL"),
    Deno.env.get("ALLOWED_ORIGIN"),
  ]
    .some((url) => url?.startsWith("https://"));
}

export function tokenCookieOptions(c: Context) {
  const secure = isHttpsRequest(c);
  return {
    path: "/",
    secure,
    httpOnly: true,
    maxAge: 86400,
    sameSite: secure ? "None" : "Lax",
  } as const;
}

export function clearTokenCookieOptions(c: Context) {
  const secure = isHttpsRequest(c);
  return {
    path: "/",
    secure,
    httpOnly: true,
    sameSite: secure ? "None" : "Lax",
  } as const;
}
