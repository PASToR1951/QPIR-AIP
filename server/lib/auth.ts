// server/lib/auth.ts
// Shared JWT auth helper — import from here instead of duplicating in each route file.

import jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";
import { JWT_SECRET } from "./config.ts";
import {
  hashSessionToken,
  SESSION_TOUCH_INTERVAL_MS,
} from "./userSessions.ts";

export interface TokenPayload {
  id: number;
  role: string;
  school_id: number | null;
  cluster_id?: number | null;
  sid?: string;
}

const VALID_ROLES = ['School', 'Division Personnel', 'Admin', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Pending', 'Observer'] as const;

import type { Context } from "hono";
import { getCookie } from "hono/cookie";

function extractToken(
  cOrHeader: Context | string | undefined,
): string | undefined {
  let token: string | undefined;

  if (typeof cOrHeader === 'string') {
    if (cOrHeader.startsWith("Bearer ")) {
      token = cOrHeader.slice(7);
    } else {
      token = cOrHeader;
    }
  } else if (cOrHeader && typeof cOrHeader.req === 'object') {
    // It's a Hono context
    const authHeader = cOrHeader.req.header('Authorization');
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      token = getCookie(cOrHeader, 'token');
    }
  }

  return token;
}

export async function getUserFromToken(
  cOrHeader: Context | string | undefined,
): Promise<TokenPayload | null> {
  const token = extractToken(cOrHeader);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    if (!Number.isInteger(payload.id) || typeof payload.role !== "string") {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!VALID_ROLES.includes(payload.role as any)) {
      return null;
    }

    if (payload.sid !== undefined && typeof payload.sid !== "string") {
      return null;
    }

    if (!payload.sid) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { is_active: true },
      });
      return user?.is_active ? payload : null;
    }

    const session = await prisma.userSession.findUnique({
      where: { session_token: await hashSessionToken(payload.sid) },
      select: {
        id: true,
        last_seen_at: true,
        expires_at: true,
        revoked_at: true,
        user: { select: { is_active: true } },
      },
    });

    if (!session || session.revoked_at || session.expires_at <= new Date() || !session.user.is_active) {
      return null;
    }

    if (
      Date.now() - session.last_seen_at.getTime() >= SESSION_TOUCH_INTERVAL_MS
    ) {
      prisma.userSession.update({
        where: { id: session.id },
        data: { last_seen_at: new Date() },
      }).catch(() => {});
    }

    return payload;
  } catch {
    return null;
  }
}
