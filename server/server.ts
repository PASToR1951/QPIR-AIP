import { Hono } from "hono";
import { cors } from "hono/cors";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const connectionString = Deno.env.get("DATABASE_URL");
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = new Hono();

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "super-secret-default-key-change-me-in-production";

app.use('*', cors());

// Root route
app.get('/', (c) => {
  return c.text('QPIR-AIP API is running!');
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

// Auth Routes Structure
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json();
  const { email, password, role, name, school_id } = body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        name,
        school_id
      }
    });

    return c.json({ message: 'User created successfully', user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, school_id: user.school_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return c.json({ 
      message: 'Login successful', 
      token,
      user: { id: user.id, email: user.email, role: user.role, school_id: user.school_id } 
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Login failed' }, 500);
  }
});


// GET all Clusters
app.get('/api/clusters', async (c) => {
  try {
    const clusters = await prisma.cluster.findMany({
      include: { schools: true }
    });
    return c.json(clusters);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch clusters' }, 500);
  }
});

// GET all Schools
app.get('/api/schools', async (c) => {
  try {
    const schools = await prisma.school.findMany({
      include: { cluster: true }
    });
    return c.json(schools);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch schools' }, 500);
  }
});

// GET all Programs
app.get('/api/programs', async (c) => {
  try {
    const programs = await prisma.program.findMany();
    return c.json(programs);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch programs' }, 500);
  }
});

const PORT = parseInt(Deno.env.get("PORT") || "3001");
console.log(`✅ Backend server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, app.fetch);
