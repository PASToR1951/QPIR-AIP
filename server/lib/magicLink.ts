import { prisma } from "../db/client.ts";
import { ALLOWED_ORIGIN } from "./config.ts";
import {
  getMagicLinkTtlMinutes,
  getOrCreateEmailConfig,
  type MagicLinkPurpose,
} from "./emailConfig.ts";
import { logger } from "./logger.ts";
import { base64url } from "./oauth.ts";

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const RETENTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createRawToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64url(bytes);
}

function normalizeRedirectPath(redirectPath?: string) {
  if (!redirectPath) return "";
  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) return "";
  return redirectPath;
}

export async function generateMagicLink(
  userId: number,
  purpose: MagicLinkPurpose,
  options?: { redirectPath?: string },
) {
  const config = await getOrCreateEmailConfig();
  const ttlMinutes = getMagicLinkTtlMinutes(config, purpose);
  const rawToken = createRawToken();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.magicLinkToken.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      purpose,
      expires_at: expiresAt,
    },
  });

  const url = new URL(`${ALLOWED_ORIGIN}/auth/magic-link`);
  url.searchParams.set("token", rawToken);
  const redirectPath = normalizeRedirectPath(options?.redirectPath);
  if (redirectPath) {
    url.searchParams.set("redirect", redirectPath);
  }
  return url.toString();
}

export async function consumeMagicLink(token: string) {
  if (!token) {
    return { ok: false as const, error: "Magic link is missing." };
  }

  const tokenHash = await hashToken(token);
  const now = new Date();
  const record = await prisma.magicLinkToken.findUnique({
    where: { token_hash: tokenHash },
    include: {
      user: {
        include: {
          school: { include: { cluster: true } },
        },
      },
    },
  });

  if (!record || record.used_at || record.expires_at <= now) {
    return { ok: false as const, error: "Magic link is invalid or has expired." };
  }

  if (
    !record.user ||
    !record.user.is_active ||
    record.user.deleted_at ||
    record.user.role === "Pending"
  ) {
    return { ok: false as const, error: "This account cannot sign in with a magic link." };
  }

  const updateResult = await prisma.magicLinkToken.updateMany({
    where: {
      id: record.id,
      used_at: null,
      expires_at: { gt: now },
    },
    data: { used_at: now },
  });

  if (updateResult.count !== 1) {
    return { ok: false as const, error: "Magic link is invalid or has expired." };
  }

  return {
    ok: true as const,
    user: record.user,
    purpose: record.purpose,
  };
}

export async function cleanupMagicLinks() {
  const cutoff = new Date(Date.now() - RETENTION_WINDOW_MS);
  const result = await prisma.magicLinkToken.deleteMany({
    where: {
      OR: [
        { expires_at: { lt: cutoff } },
        { used_at: { lt: cutoff } },
      ],
    },
  });

  if (result.count > 0) {
    logger.info("Cleaned up old magic links", { deleted: result.count });
  }
}

export function startMagicLinkCleanupScheduler() {
  if (cleanupIntervalId !== null) return;

  const runSafely = async () => {
    try {
      await cleanupMagicLinks();
    } catch (error) {
      logger.error("Magic link cleanup failed", error);
    }
  };

  void runSafely();
  cleanupIntervalId = setInterval(() => {
    void runSafely();
  }, CLEANUP_INTERVAL_MS);
}
