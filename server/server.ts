import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import authRoutes from "./routes/auth.ts";
import dataRoutes from "./routes/data.ts";
import adminRoutes from "./routes/admin.ts";
import { prisma as _prisma } from "./db/client.ts";
import { getUserFromToken } from "./lib/auth.ts";
import { logger } from "./lib/logger.ts";

const app = new Hono();

// HTTP security headers — prevents clickjacking, MIME sniffing, XSS, and enforces HTTPS.
app.use('*', secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: 'max-age=63072000; includeSubDomains',
  xXssProtection: '1; mode=block',
}));

app.use('*', cors({
  origin: Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// NEW-01: Request body size limit (2MB) to prevent memory exhaustion DoS
app.use('*', bodyLimit({
  maxSize: 2 * 1024 * 1024, // 2MB
  onError: (c) => c.json({ error: 'Request body too large (max 2MB)' }, 413),
}));

// L-2: Structured request/response logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.info(`${c.req.method} ${new URL(c.req.url).pathname}`, {
    status: c.res.status,
    ms: duration,
  });
});

// Root route
app.get('/', (c) => {
  return c.text('AIP-PIR API is running!');
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

// Public: division config (supervisor name/title for PIR documents)
app.get('/api/config', async (c) => {
  const config = await _prisma.divisionConfig.findFirst();
  return c.json({
    supervisor_name:  config?.supervisor_name  ?? "",
    supervisor_title: config?.supervisor_title ?? "",
  });
});

app.get('/api/announcement', async (c) => {
  const now = new Date();
  const a = await _prisma.announcement.findFirst({
    where: {
      is_active: true,
      OR: [{ expires_at: null }, { expires_at: { gt: now } }],
    },
    include: {
      mentioned_schools: { select: { school_id: true } },
      mentioned_users:   { select: { user_id: true } },
    },
    orderBy: { updated_at: 'desc' },
  });

  if (!a) return c.json(null);

  const hasSchoolMentions = a.mentioned_schools.length > 0;
  const hasUserMentions   = a.mentioned_users.length > 0;

  // No mentions → broadcast to everyone
  if (!hasSchoolMentions && !hasUserMentions) return c.json(a);

  // Targeted announcement — check if requesting user qualifies
  const caller = getUserFromToken(c);
  if (!caller) return c.json({ error: 'Unauthorized' }, 401);

  const schoolMatch = hasSchoolMentions && caller.school_id != null &&
    a.mentioned_schools.some(ms => ms.school_id === caller.school_id);
  const userMatch = hasUserMentions &&
    a.mentioned_users.some(mu => mu.user_id === caller.id);

  return c.json(schoolMatch || userMatch ? a : null);
});

// Mount modular routes
app.route('/api/auth', authRoutes);
app.route('/api', dataRoutes);
app.route('/api/admin', adminRoutes);

const PORT = parseInt(Deno.env.get("PORT") || "3001");
logger.info(`AIP-PIR backend running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, app.fetch);
