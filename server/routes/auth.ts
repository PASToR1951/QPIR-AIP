import { Hono } from "hono";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";
import { JWT_SECRET } from "../lib/config.ts";

const authRoutes = new Hono();

// Self-registration is disabled. All accounts are created by an Admin via /api/admin/users.
authRoutes.post('/register', (c) => c.json({ error: 'Registration is disabled. Contact your administrator.' }, 403));

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: true }
    });
    if (!user || !user.is_active) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

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
