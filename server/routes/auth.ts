import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";
import { RECAPTCHA_SECRET_KEY } from "../lib/config.ts";
import { logger } from "../lib/logger.ts";
import { getUserFromToken } from "../lib/auth.ts";
import { clearTokenCookieOptions } from "../lib/sessionCookie.ts";
import { consumeMagicLink } from "../lib/magicLink.ts";
import { writeUserLog, getClientIp } from "../lib/userActivityLog.ts";
import {
  createSessionCookie,
  hashSessionToken,
  revokeAllUserSessions,
  revokeSessionById,
  revokeSessionBySid,
} from "../lib/userSessions.ts";
import { safeParseInt } from "../lib/safeParseInt.ts";

const authRoutes = new Hono();
const DEFAULT_CHECKLIST_PROGRESS = {
  completed_task_ids: [],
  hint_ids_seen: [],
  panel_hidden: false,
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0
  );
}

function normalizeChecklistProgress(value: unknown) {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    completed_task_ids: normalizeStringArray(raw.completed_task_ids),
    hint_ids_seen: normalizeStringArray(raw.hint_ids_seen),
    panel_hidden: Boolean(raw.panel_hidden),
  };
}

function buildOnboardingPayload(user: Record<string, unknown>) {
  return {
    onboarding_version_seen: Number.isInteger(user.onboarding_version_seen)
      ? user.onboarding_version_seen
      : 0,
    onboarding_show_on_login: user.onboarding_show_on_login !== false,
    onboarding_dismissed_at: user.onboarding_dismissed_at instanceof Date
      ? user.onboarding_dismissed_at.toISOString()
      : null,
    onboarding_completed_at: user.onboarding_completed_at instanceof Date
      ? user.onboarding_completed_at.toISOString()
      : null,
    checklist_progress: normalizeChecklistProgress(
      user.checklist_progress ?? DEFAULT_CHECKLIST_PROGRESS,
    ),
  };
}

function buildSessionUserPayload(user: Record<string, unknown>) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    school_id: user.school_id,
    school_name: (user.school as { name?: string } | null)?.name,
    cluster_id: user.cluster_id ?? (user.school as { cluster_id?: number | null } | null)?.cluster_id ?? null,
    cluster_number:
      (user.cluster as { cluster_number?: number | null } | null)?.cluster_number ??
      ((user.school as { cluster?: { cluster_number?: number | null } } | null)?.cluster?.cluster_number ?? null),
    cluster_logo:
      (user.cluster as { logo?: string | null } | null)?.logo ??
      ((user.school as { cluster?: { logo?: string | null } } | null)?.cluster?.logo ?? null),
    school_logo: (user.school as { logo?: string | null } | null)?.logo ?? null,
    salutation: user.salutation,
    name: user.name,
    first_name: user.first_name,
    middle_initial: user.middle_initial,
    last_name: user.last_name,
    position: user.position,
    must_change_password: user.must_change_password,
    ...buildOnboardingPayload(user),
  };
}

function mapOwnSession(
  session: {
    id: number;
    device_label: string | null;
    created_at: Date;
    last_seen_at: Date;
    expires_at: Date;
    revoked_at: Date | null;
    session_token: string;
  },
  currentSessionToken: string | null,
) {
  return {
    id: session.id,
    device_label: session.device_label ?? 'Unknown device',
    created_at: session.created_at.toISOString(),
    last_seen_at: session.last_seen_at.toISOString(),
    expires_at: session.expires_at.toISOString(),
    revoked_at: session.revoked_at?.toISOString() ?? null,
    is_current: currentSessionToken === session.session_token,
  };
}

async function completeSessionLogin(
  c: Context,
  user: Record<string, unknown>,
  message = "Login successful",
) {
  const { expiresAt } = await createSessionCookie(c, {
    id: Number(user.id),
    role: String(user.role),
    school_id: (user.school_id as number | null | undefined) ?? null,
    cluster_id: (user.cluster_id as number | null | undefined) ?? null,
    school: user.school as { cluster_id?: number | null } | null | undefined,
  });
  return c.json({
    message,
    expiresAt,
    user: buildSessionUserPayload(user),
  });
}

// ── In-memory login rate limiter ─────────────────────────────────────────────
// Limits each email to MAX_ATTEMPTS failed login attempts within WINDOW_MS.
// Successful logins reset the counter. Stale entries are lazily garbage-collected.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

// Garbage-collect expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (now - entry.firstAttempt > WINDOW_MS) loginAttempts.delete(key);
  }
}, 10 * 60 * 1000);

// Self-registration is disabled. All accounts are created by an Admin via /api/admin/users.
authRoutes.post('/register', (c) => c.json({ error: 'Registration is disabled. Contact your administrator.' }, 403));

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password, recaptchaToken } = body;

  if (RECAPTCHA_SECRET_KEY) {
    const clientIp = getClientIp(c) ?? '';
    const isPrivateIp =
      clientIp === '' ||
      clientIp === '::1' ||
      /^127\./.test(clientIp) ||
      /^10\./.test(clientIp) ||
      /^192\.168\./.test(clientIp) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(clientIp) ||
      /^::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(clientIp);

    if (!isPrivateIp) {
      if (!recaptchaToken) {
        return c.json({ error: 'Please complete the reCAPTCHA challenge.' }, 400);
      }
      try {
        const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY,
            response: recaptchaToken,
          }),
        });
        const data = await response.json();
        if (!data.success || (data.score !== undefined && data.score < 0.5)) {
          return c.json({ error: 'reCAPTCHA verification failed. Please try again.' }, 400);
        }
      } catch (error) {
        logger.error('reCAPTCHA verification error', error);
        return c.json({ error: 'Service temporarily unavailable. Please try again later.' }, 500);
      }
    }
  }

  // ── Rate-limit check ─────────────────────────────────────────────────
  const key = (email ?? '').toLowerCase().trim();
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (entry) {
    if (now - entry.firstAttempt > WINDOW_MS) {
      // Window expired — reset
      loginAttempts.delete(key);
    } else if (entry.count >= MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 1000);
      return c.json(
        { error: 'Too many login attempts. Please try again later.' },
        429,
        // deno-lint-ignore no-explicit-any
        { 'Retry-After': String(retryAfterSec) } as any,
      );
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: { include: { cluster: true } }, cluster: true },
    });
    if (!user || !user.is_active || !user.password) {
      // Also reject OAuth-only accounts (no password set) — they must use SSO
      const prev = loginAttempts.get(key);
      loginAttempts.set(key, { count: (prev?.count ?? 0) + 1, firstAttempt: prev?.firstAttempt ?? now });
      writeUserLog({
        userId: user?.id ?? null,
        action: "failed_login",
        details: {
          email_attempted: email ?? null,
          method: "password",
          reason: !user
            ? "user_not_found"
            : !user.is_active
            ? "user_inactive"
            : "password_unavailable",
        },
        ipAddress: getClientIp(c),
      });
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Record failed attempt
      const prev = loginAttempts.get(key);
      loginAttempts.set(key, { count: (prev?.count ?? 0) + 1, firstAttempt: prev?.firstAttempt ?? now });
      writeUserLog({
        userId: user.id,
        action: "failed_login",
        details: {
          email_attempted: email ?? null,
          method: "password",
          reason: "password_mismatch",
        },
        ipAddress: getClientIp(c),
      });
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Successful login — clear rate-limit counter
    loginAttempts.delete(key);

    writeUserLog({ userId: user.id, action: "login", details: { method: "password" }, ipAddress: getClientIp(c) });
    return completeSessionLogin(c, user as Record<string, unknown>);
  } catch (error) {
    logger.error('Login failed', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

authRoutes.post('/magic-link/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = typeof body?.token === 'string' ? body.token.trim() : '';

  if (!token) {
    return c.json({ error: 'Magic link token is required.' }, 400);
  }

  try {
    const result = await consumeMagicLink(token);
    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    writeUserLog({ userId: (result.user as { id: number }).id, action: "login", details: { method: "magic_link" }, ipAddress: getClientIp(c) });
    return completeSessionLogin(
      c,
      result.user as Record<string, unknown>,
      'Magic link verified',
    );
  } catch (error) {
    logger.error('Magic link verification failed', error);
    return c.json({ error: 'Magic link verification failed.' }, 500);
  }
});

authRoutes.post('/logout', async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (tokenUser?.sid) {
    await revokeSessionBySid(tokenUser.sid).catch(() => {});
  }
  deleteCookie(c, 'token', clearTokenCookieOptions(c));
  if (tokenUser) {
    writeUserLog({ userId: tokenUser.id, action: "logout", ipAddress: getClientIp(c) });
  }
  return c.json({ message: 'Logged out' });
});

// Returns the current user's profile — used by OAuthCallback and any future "refresh session" flow.
// The JWT lives in the HttpOnly cookie; this endpoint lets the frontend read user metadata without
// ever touching the raw token.
authRoutes.get('/me', async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      include: { school: { include: { cluster: true } }, cluster: true },
    });
    if (!user || !user.is_active) return c.json({ error: 'Unauthorized' }, 401);

    // Extract the actual token expiry from the cookie so the frontend
    // can sync its sessionStorage.tokenExpiry with the real JWT exp.
    let expiresAt = Math.floor(Date.now() / 1000) + 86400; // fallback
    const rawToken = getCookie(c, 'token');
    if (rawToken) {
      const decoded = jwt.decode(rawToken) as { exp?: number } | null;
      if (decoded?.exp) expiresAt = decoded.exp;
    }

    return c.json({
      id: user.id,
      email: user.email,
      role: user.role,
      salutation: user.salutation,
      name: user.name,
      first_name: user.first_name,
      middle_initial: user.middle_initial,
      last_name: user.last_name,
      position: user.position,
      school_id: user.school_id,
      school_name: user.school?.name ?? null,
      cluster_id: user.cluster_id ?? user.school?.cluster_id ?? null,
      cluster_number: user.cluster?.cluster_number ?? user.school?.cluster?.cluster_number ?? null,
      cluster_logo: user.cluster?.logo ?? user.school?.cluster?.logo ?? null,
      school_logo: user.school?.logo ?? null,
      must_change_password: user.must_change_password,
      ...buildOnboardingPayload(user as Record<string, unknown>),
      expiresAt,
    });
  } catch (error) {
    logger.error('GET /me failed', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRoutes.patch('/me/onboarding', async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json().catch(() => ({}));
    const {
      show_on_login,
      version_seen,
      dismissed_at,
      completed_at,
      checklist_progress,
      reset,
    } = body ?? {};

    if (typeof reset === 'boolean' && reset) {
      const user = await prisma.user.update({
        where: { id: tokenUser.id },
        data: {
          onboarding_version_seen: 0,
          onboarding_show_on_login: true,
          onboarding_dismissed_at: null,
          onboarding_completed_at: null,
          checklist_progress: DEFAULT_CHECKLIST_PROGRESS,
        } as any,
      } as any);

      return c.json(buildOnboardingPayload(user as Record<string, unknown>));
    }

    const data: Record<string, unknown> = {};

    if (typeof show_on_login === 'boolean') {
      data.onboarding_show_on_login = show_on_login;
    }

    if (version_seen !== undefined) {
      if (!Number.isInteger(version_seen) || version_seen < 0) {
        return c.json({ error: 'version_seen must be a non-negative integer' }, 400);
      }
      data.onboarding_version_seen = version_seen;
    }

    if (dismissed_at !== undefined) {
      if (dismissed_at !== null && Number.isNaN(new Date(dismissed_at).getTime())) {
        return c.json({ error: 'dismissed_at must be a valid ISO date or null' }, 400);
      }
      data.onboarding_dismissed_at = dismissed_at ? new Date(dismissed_at) : null;
    }

    if (completed_at !== undefined) {
      if (completed_at !== null && Number.isNaN(new Date(completed_at).getTime())) {
        return c.json({ error: 'completed_at must be a valid ISO date or null' }, 400);
      }
      data.onboarding_completed_at = completed_at ? new Date(completed_at) : null;
    }

    if (checklist_progress !== undefined) {
      data.checklist_progress = normalizeChecklistProgress(checklist_progress);
    }

    if (Object.keys(data).length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: tokenUser.id },
        select: {
          onboarding_version_seen: true,
          onboarding_show_on_login: true,
          onboarding_dismissed_at: true,
          onboarding_completed_at: true,
          checklist_progress: true,
        } as any,
      } as any);

      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      return c.json(buildOnboardingPayload(user as Record<string, unknown>));
    }

    const user = await prisma.user.update({
      where: { id: tokenUser.id },
      data: data as any,
      select: {
        onboarding_version_seen: true,
        onboarding_show_on_login: true,
        onboarding_dismissed_at: true,
        onboarding_completed_at: true,
        checklist_progress: true,
      } as any,
    } as any);

    return c.json(buildOnboardingPayload(user as Record<string, unknown>));
  } catch (error) {
    logger.error('PATCH /me/onboarding failed', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRoutes.post('/change-password', async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const { currentPassword, newPassword, skipCurrentPasswordCheck } = body ?? {};

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters' }, 400);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: { id: true, password: true, is_active: true, must_change_password: true },
    });
    if (!user || !user.is_active || !user.password) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Allow skipping the current-password check only when the account is flagged
    // as must_change_password — the valid JWT already proves the user authenticated.
    const needsCurrentPassword = !skipCurrentPasswordCheck || !user.must_change_password;
    if (needsCurrentPassword) {
      if (!currentPassword) {
        return c.json({ error: 'currentPassword is required' }, 400);
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return c.json({ error: 'Current password is incorrect' }, 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, must_change_password: false },
    });

    writeUserLog({ userId: user.id, action: "password_change", ipAddress: getClientIp(c) });
    return c.json({ success: true });
  } catch (error) {
    logger.error('POST /change-password failed', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRoutes.get('/sessions', async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);

  const currentSessionToken = tokenUser.sid
    ? await hashSessionToken(tokenUser.sid)
    : null;

  const sessions = await prisma.userSession.findMany({
    where: { user_id: tokenUser.id },
    orderBy: [{ last_seen_at: 'desc' }, { created_at: 'desc' }],
    select: {
      id: true,
      device_label: true,
      created_at: true,
      last_seen_at: true,
      expires_at: true,
      revoked_at: true,
      session_token: true,
    },
  });

  return c.json(
    sessions.map((session) => mapOwnSession(session, currentSessionToken)),
  );
});

authRoutes.delete('/sessions/:id', async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);

  const id = safeParseInt(c.req.param('id'), 0);
  if (!id) return c.json({ error: 'Invalid session id' }, 400);

  const session = await prisma.userSession.findUnique({
    where: { id },
    select: {
      id: true,
      user_id: true,
      revoked_at: true,
      session_token: true,
    },
  });

  if (!session || session.user_id !== tokenUser.id) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (tokenUser.sid) {
    const currentSessionToken = await hashSessionToken(tokenUser.sid);
    if (session.session_token === currentSessionToken) {
      return c.json({ error: 'Use logout to end the current device session.' }, 400);
    }
  }

  if (!session.revoked_at) {
    await revokeSessionById(session.id);
  }

  return c.json({ success: true });
});

authRoutes.delete('/sessions', async (c) => {
  const tokenUser = await getUserFromToken(c);
  if (!tokenUser) return c.json({ error: 'Unauthorized' }, 401);

  const revoked = await revokeAllUserSessions(tokenUser.id, {
    exceptSid: tokenUser.sid,
  });

  return c.json({ revoked });
});

export default authRoutes;
