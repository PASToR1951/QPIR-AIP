import { Hono } from "hono";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";
import { JWT_SECRET } from "../lib/config.ts";

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
      include: { school: true }
    });
    if (!user || !user.is_active) {
      // Record failed attempt
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

    // Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        school_name: user.school?.name,
        name: user.name,
        first_name: user.first_name,
        middle_initial: user.middle_initial,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        school_name: user.school?.name,
        name: user.name,
        first_name: user.first_name,
        middle_initial: user.middle_initial,
        last_name: user.last_name,
      }
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Login failed' }, 500);
  }
});


export default authRoutes;
