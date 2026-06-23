import type { Context, MiddlewareHandler } from "hono";
import { getUserFromToken, type TokenPayload } from "../../../lib/auth.ts";
import { CES_ROLES } from "../../../lib/routing.ts";

export const SUPERINTENDENT_ROLE = "Superintendent";

export const ADMIN_PANEL_ROLES = [
  "Admin",
  SUPERINTENDENT_ROLE,
];

export const ADMIN_ANALYTICS_ROLES = [
  "Admin",
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

export async function requireAdminOnlyRead(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || user.role !== "Admin") {
    return null;
  }
  return user;
}

export async function requireAdminOrSuperintendent(
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

export async function requireAdminDivisionPersonnelOrSuperintendent(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (!user || (user.role !== "Admin" && user.role !== "Division Personnel" && user.role !== SUPERINTENDENT_ROLE)) {
    return null;
  }
  return user;
}

export async function requireAdminDivisionPersonnelOrCES(
  c: Context | string | undefined,
): Promise<TokenPayload | null> {
  const user = await getUserFromToken(c);
  if (
    !user ||
    (
      user.role !== "Admin" &&
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

export const adminReadOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== "Admin") {
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

export const adminDivisionPersonnelOrSuperintendentOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (!user || (user.role !== "Admin" && user.role !== "Division Personnel" && user.role !== SUPERINTENDENT_ROLE)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};

export const adminDivisionPersonnelOrCESOnly: MiddlewareHandler = async (c, next) => {
  const user = await getUserFromToken(c);
  if (
    !user ||
    (
      user.role !== "Admin" &&
      user.role !== "Division Personnel" &&
      user.role !== SUPERINTENDENT_ROLE &&
      !(CES_ROLES as readonly string[]).includes(user.role)
    )
  ) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};
