import type { Context, MiddlewareHandler } from "hono";
import { getUserFromToken, type TokenPayload } from "../../../lib/auth.ts";
import { CES_ROLES } from "../../../lib/routing.ts";

export const OBSERVER_ROLE = "Observer";
export const SUPERINTENDENT_ROLE = "Superintendent";

export const ADMIN_PANEL_ROLES = [
  "Admin",
  OBSERVER_ROLE,
  SUPERINTENDENT_ROLE,
];

export const ADMIN_ANALYTICS_ROLES = [
  "Admin",
  OBSERVER_ROLE,
  SUPERINTENDENT_ROLE,
];

export const SYSTEM_ADMIN_ROLES = [
  "Admin",
];

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

export async function requireAdminObserverOrSuperintendent(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || !ADMIN_PANEL_ROLES.includes(user.role)) {
    return null;
  }
  return user;
}

export async function requireSuperintendent(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || user.role !== SUPERINTENDENT_ROLE) {
    return null;
  }
  return user;
}

export async function requireAdminObserverOrDivisionPersonnel(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || (user.role !== "Admin" && user.role !== OBSERVER_ROLE && user.role !== "Division Personnel" && user.role !== SUPERINTENDENT_ROLE)) {
    return null;
  }
  return user;
}

export async function requireAdminObserverDivisionPersonnelOrCES(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (
    !user ||
    (
      user.role !== "Admin" &&
      user.role !== OBSERVER_ROLE &&
      user.role !== "Division Personnel" &&
      user.role !== SUPERINTENDENT_ROLE &&
      !(CES_ROLES as readonly string[]).includes(user.role)
    )
  ) {
    return null;
  }
  return user;
}

export async function requireCES(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || (!(CES_ROLES as readonly string[]).includes(user.role) && user.role !== "Superintendent")) {
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

export const adminAnalyticsOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (!user || !ADMIN_ANALYTICS_ROLES.includes(user.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};

export const adminObserverOrDivisionPersonnelOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (!user || (user.role !== "Admin" && user.role !== OBSERVER_ROLE && user.role !== "Division Personnel" && user.role !== SUPERINTENDENT_ROLE)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};

export const adminObserverDivisionPersonnelOrCESOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (
    !user ||
    (
      user.role !== "Admin" &&
      user.role !== OBSERVER_ROLE &&
      user.role !== "Division Personnel" &&
      user.role !== SUPERINTENDENT_ROLE &&
      !(CES_ROLES as readonly string[]).includes(user.role)
    )
  ) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};
