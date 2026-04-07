import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";
import { JWT_SECRET } from "../lib/config.ts";
import { logger } from "../lib/logger.ts";
import { getUserFromToken } from "../lib/auth.ts";
import { clearTokenCookieOptions, tokenCookieOptions } from "../lib/sessionCookie.ts";

const authRoutes = new Hono();

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
  const { email, password } = body;

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
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Record failed attempt
      const prev = loginAttempts.get(key);
      loginAttempts.set(key, { count: (prev?.count ?? 0) + 1, firstAttempt: prev?.firstAttempt ?? now });
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Successful login — clear rate-limit counter
    loginAttempts.delete(key);

    // Issue JWT — payload contains only non-PII identifiers needed for authorization.
    // Names, email, and school_name are NOT embedded; fetch from DB when needed.
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        school_id: user.school_id,
        cluster_id: user.cluster_id ?? user.school?.cluster_id ?? null,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HttpOnly cookie
    setCookie(c, 'token', token, tokenCookieOptions(c));

    return c.json({
      message: 'Login successful',
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        school_name: user.school?.name,
        cluster_id: user.cluster_id ?? user.school?.cluster_id ?? null,
        cluster_number: user.cluster?.cluster_number ?? user.school?.cluster?.cluster_number ?? null,
        cluster_logo: user.cluster?.logo ?? user.school?.cluster?.logo ?? null,
        school_logo: user.school?.logo ?? null,
        name: user.name,
        first_name: user.first_name,
        middle_initial: user.middle_initial,
        last_name: user.last_name,
      }
    });
  } catch (error) {
    logger.error('Login failed', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

authRoutes.post('/logout', (c) => {
  deleteCookie(c, 'token', clearTokenCookieOptions(c));
  return c.json({ message: 'Logged out' });
});

// Returns the current user's profile — used by OAuthCallback and any future "refresh session" flow.
// The JWT lives in the HttpOnly cookie; this endpoint lets the frontend read user metadata without
// ever touching the raw token.
authRoutes.get('/me', async (c) => {
  const tokenUser = getUserFromToken(c);
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
      name: user.name,
      first_name: user.first_name,
      middle_initial: user.middle_initial,
      last_name: user.last_name,
      school_id: user.school_id,
      school_name: user.school?.name ?? null,
      cluster_id: user.cluster_id ?? user.school?.cluster_id ?? null,
      cluster_number: user.cluster?.cluster_number ?? user.school?.cluster?.cluster_number ?? null,
      cluster_logo: user.cluster?.logo ?? user.school?.cluster?.logo ?? null,
      school_logo: user.school?.logo ?? null,
      expiresAt,
    });
  } catch (error) {
    logger.error('GET /me failed', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default authRoutes;
