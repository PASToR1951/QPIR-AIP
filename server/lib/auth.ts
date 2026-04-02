// server/lib/auth.ts
// Shared JWT auth helper — import from here instead of duplicating in each route file.

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.ts";

export interface TokenPayload {
  id: number;
  role: string;
  school_id: number | null;
  cluster_id?: number | null;
  email: string;
  name: string | null;
}

export function getUserFromToken(authHeader: string | undefined): TokenPayload | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
