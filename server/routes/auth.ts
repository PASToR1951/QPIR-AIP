import { Hono } from "hono";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";

const authRoutes = new Hono();
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "super-secret-default-key-change-me-in-production";

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const { email, password, name, school_id } = body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'School Head',
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

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: true }
    });
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, school_id: user.school_id, school_name: user.school?.name, name: user.name },
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
        name: user.name
      }
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Login failed' }, 500);
  }
});


export default authRoutes;
