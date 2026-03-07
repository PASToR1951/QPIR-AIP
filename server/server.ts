import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth.ts";
import dataRoutes from "./routes/data.ts";

const app = new Hono();

app.use('*', cors());

// Root route
app.get('/', (c) => {
  return c.text('QPIR-AIP API is running!');
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount modular routes
app.route('/api/auth', authRoutes);
app.route('/api', dataRoutes);

const PORT = parseInt(Deno.env.get("PORT") || "3001");
console.log(`✅ Backend server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, app.fetch);
