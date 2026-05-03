import type { Context, MiddlewareHandler } from "hono";
import { getUserFromToken, type TokenPayload } from "../../../lib/auth.ts";
import { CES_ROLES } from "../../../lib/routing.ts";

export const OBSERVER_ROLE = "Observer";

export async function requireAdmin(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || user.role !== "Admin") return null;
  return user;
}

export async function requireAdminOrObserver(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || (user.role !== "Admin" && user.role !== OBSERVER_ROLE)) {
    return null;
  }
  return user;
}

export async function requireCES(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || !(CES_ROLES as readonly string[]).includes(user.role)) {
    return null;
  }
  return user;
}

export const adminOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== "Admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};

export const adminOrObserverOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (!user || (user.role !== "Admin" && user.role !== OBSERVER_ROLE)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};
