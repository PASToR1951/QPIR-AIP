import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";
import { JWT_SECRET } from "./config.ts";
import { tokenCookieOptions } from "./sessionCookie.ts";
import { getClientIp } from "./clientIp.ts";

export const SESSION_MAX_AGE_SECONDS = 86400;
export const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

interface SessionUser {
  id: number;
  role: string;
  school_id: number | null;
  school?: { cluster_id?: number | null } | null;
}

interface SessionTokenClaim {
  id: number;
  role: string;
}

export type SessionValidationFailure =
  | "missing"
  | "revoked"
  | "expired"
  | "user_mismatch"
  | "inactive_user"
  | "role_mismatch";

export interface ValidatableSession {
  user_id: number;
  last_seen_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  user: {
    is_active: boolean;
    role: string;
  };
}

export function getSessionValidationFailure(
  session: ValidatableSession | null,
  claim: SessionTokenClaim,
  now = new Date(),
): SessionValidationFailure | null {
  if (!session) return "missing";
  if (session.revoked_at) return "revoked";
  if (session.expires_at <= now) return "expired";
  if (session.user_id !== claim.id) return "user_mismatch";
  if (!session.user.is_active) return "inactive_user";
  if (session.user.role !== claim.role) return "role_mismatch";
  return null;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return bytesToHex(new Uint8Array(digest));
}

function detectBrowser(userAgent: string): string | null {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) return "Opera";
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return "Safari";
  }
  if (/trident\/|msie/i.test(userAgent)) return "Internet Explorer";
  return null;
}

function detectPlatform(userAgent: string): string | null {
  if (/iphone/i.test(userAgent)) return "iPhone";
  if (/ipad/i.test(userAgent)) return "iPad";
  if (/android/i.test(userAgent)) {
    return /mobile/i.test(userAgent) ? "Android phone" : "Android tablet";
  }
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac os x|macintosh/i.test(userAgent)) return "Mac";
  if (/cros/i.test(userAgent)) return "ChromeOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return null;
}

export function deriveDeviceLabel(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = detectBrowser(userAgent);
  const platform = detectPlatform(userAgent);
  if (!browser || !platform) return "Unknown device";
  return `${browser} on ${platform}`;
}

function resolveClusterId(user: SessionUser): number | null {
  return user.school?.cluster_id ?? null;
}

export async function createSessionCookie(
  c: Context,
  user: SessionUser,
): Promise<{
  expiresAt: number;
  sessionId: number;
  sid: string;
  token: string;
}> {
  const sid = randomHex(32);
  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const expiresAt = nowSeconds + SESSION_MAX_AGE_SECONDS;
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      cluster_id: resolveClusterId(user),
      sid,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  );

  const session = await prisma.userSession.create({
    data: {
      user_id: user.id,
      session_token: await hashSessionToken(sid),
      user_agent: c.req.header("user-agent") ?? null,
      ip_address: getClientIp(c),
      device_label: deriveDeviceLabel(c.req.header("user-agent")),
      last_seen_at: now,
      expires_at: new Date(expiresAt * 1000),
    },
    select: { id: true },
  });

  setCookie(c, "token", token, tokenCookieOptions(c));
  return {
    expiresAt,
    sessionId: session.id,
    sid,
    token,
  };
}

export async function revokeSessionBySid(
  sid: string,
  revokedBy?: number | null,
): Promise<number | null> {
  const sessionToken = await hashSessionToken(sid);
  const session = await prisma.userSession.findUnique({
    where: { session_token: sessionToken },
    select: { id: true, revoked_at: true },
  });

  if (!session) return null;
  if (!session.revoked_at) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        revoked_at: new Date(),
        ...(revokedBy !== undefined ? { revoked_by: revokedBy } : {}),
      },
    });
  }

  return session.id;
}

export async function revokeSessionById(
  sessionId: number,
  revokedBy?: number | null,
): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: {
      revoked_at: new Date(),
      ...(revokedBy !== undefined ? { revoked_by: revokedBy } : {}),
    },
  });
}

export async function revokeAllUserSessions(
  userId: number,
  {
    exceptSid,
    revokedBy,
  }: {
    exceptSid?: string | null;
    revokedBy?: number | null;
  } = {},
): Promise<number> {
  const now = new Date();
  const exceptHash = exceptSid ? await hashSessionToken(exceptSid) : null;
  const result = await prisma.userSession.updateMany({
    where: {
      user_id: userId,
      revoked_at: null,
      expires_at: { gt: now },
      ...(exceptHash ? { session_token: { not: exceptHash } } : {}),
    },
    data: {
      revoked_at: now,
      ...(revokedBy !== undefined ? { revoked_by: revokedBy } : {}),
    },
  });

  return result.count;
}
