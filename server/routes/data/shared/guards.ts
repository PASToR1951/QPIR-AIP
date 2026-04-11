import type { Context, MiddlewareHandler } from "hono";
import { prisma } from "../../../db/client.ts";
import { getUserFromToken, type TokenPayload } from "../../../lib/auth.ts";
import type { DataRouteEnv } from "./types.ts";

export function requireAuth(
  message = "Authentication required",
): MiddlewareHandler<{ Variables: DataRouteEnv }> {
  return async (c, next) => {
    const user = getUserFromToken(c);
    if (!user) return c.json({ error: message }, 401);
    c.set("user", user);
    await next();
  };
}

export function getAuthedUser(
  c: Context<{ Variables: DataRouteEnv }>,
): TokenPayload {
  return c.get("user");
}

export async function verifySchoolCluster(
  tokenUser: TokenPayload,
): Promise<string | null> {
  if (
    tokenUser.role === "School" &&
    tokenUser.school_id &&
    tokenUser.cluster_id !== undefined
  ) {
    const school = await prisma.school.findUnique({
      where: { id: tokenUser.school_id },
    });
    if (school && school.cluster_id !== tokenUser.cluster_id) {
      return "Cluster assignment mismatch. Please re-authenticate or contact administrator.";
    }
  }
  return null;
}
