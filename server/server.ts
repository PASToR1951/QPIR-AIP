import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth.ts";
import dataRoutes from "./routes/data.ts";
import adminRoutes from "./routes/admin.ts";

const app = new Hono();

app.use('*', cors());

// Root route
app.get('/', (c) => {
  return c.text('AIP-PIR API is running!');
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

// Public: active announcement for user dashboard banner
import { prisma as _prisma } from "./db/client.ts";
import { getTermConfig, toTermConfigResponse, type TermType } from "./lib/termConfig.ts";

app.get('/api/announcement', async (c) => {
  const now = new Date();
  const a = await _prisma.announcement.findFirst({
    where: {
      is_active: true,
      OR: [
        { expires_at: null },
        { expires_at: { gt: now } },
      ],
    },
    orderBy: { updated_at: 'desc' },
  });
  return c.json(a ?? null);
});

// Public: active term structure config (used by PIRForm and dashboard)
app.get('/api/term-config', async (c) => {
  const [termRow, supervisorNameRow, supervisorTitleRow] = await Promise.all([
    _prisma.systemConfig.findUnique({ where: { key: 'term_type' } }),
    _prisma.systemConfig.findUnique({ where: { key: 'supervisor_name' } }),
    _prisma.systemConfig.findUnique({ where: { key: 'supervisor_title' } }),
  ]);
  const type = (termRow?.value ?? 'Trimester') as TermType;
  return c.json({
    ...toTermConfigResponse(getTermConfig(type)),
    supervisorName:  supervisorNameRow?.value  ?? 'DR. ENRIQUE Q. RETES, EdD',
    supervisorTitle: supervisorTitleRow?.value ?? 'Chief Education Supervisor',
  });
});

// Mount modular routes
app.route('/api/auth', authRoutes);
app.route('/api', dataRoutes);
app.route('/api/admin', adminRoutes);

const PORT = parseInt(Deno.env.get("PORT") || "3001");
console.log(`✅ Backend server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, app.fetch);
