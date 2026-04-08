// server/lib/auth.ts
// Shared JWT auth helper — import from here instead of duplicating in each route file.

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.ts";

export interface TokenPayload {
  id: number;
  role: string;
  school_id: number | null;
  cluster_id?: number | null;
}

const VALID_ROLES = ['School', 'Division Personnel', 'Admin', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Pending', 'Observer'] as const;

import type { Context } from "hono";
import { getCookie } from "hono/cookie";

export function getUserFromToken(cOrHeader: Context | string | undefined): TokenPayload | null {
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

  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!VALID_ROLES.includes(payload.role as any)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
