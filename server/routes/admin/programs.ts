import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import {
  adminOnly,
  adminOrObserverOnly,
  OBSERVER_ROLE,
  requireAdmin,
  requireAdminOrObserver,
} from "./shared/guards.ts";

export const observerRoutes = new Hono();
export const adminRoutes = new Hono();

observerRoutes.use("/programs", adminOrObserverOnly);

adminRoutes.use("/programs/:id", adminOnly);
adminRoutes.use("/programs/:id/personnel", adminOnly);
adminRoutes.use("/division-programs", adminOnly);
adminRoutes.use("/division-programs/:id", adminOnly);

observerRoutes.get("/programs", async (c) => {
  const actor = requireAdminOrObserver(c);
  if (!actor) return c.json({ error: "Unauthorized" }, 401);

  if (actor.role === OBSERVER_ROLE) {
    const programs = await prisma.program.findMany({
      select: {
        id: true,
        title: true,
        abbreviation: true,
        division: true,
        school_level_requirement: true,
      },
      orderBy: { title: "asc" },
    });
    return c.json(programs);
  }

  const programs = await prisma.program.findMany({
    include: {
      personnel: {
        select: {
          id: true,
          name: true,
          email: true,
          first_name: true,
          last_name: true,
          middle_initial: true,
        },
      },
      restricted_schools: { select: { id: true, name: true } },
      _count: { select: { aips: true } },
    },
    orderBy: { title: "asc" },
  });
  return c.json(programs);
});

adminRoutes.post("/programs", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { title, abbreviation, division, school_level_requirement } =
    sanitizeObject(await c.req.json());
  try {
    const program = await prisma.program.create({
      data: {
        title,
        abbreviation: abbreviation || null,
        division: division || null,
        school_level_requirement,
      },
    });
    await writeAuditLog(admin.id, "created_program", "Program", program.id, {
      title,
    });
    return c.json(program);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return c.json({
        error:
          "A program with that title already exists for that applicability level.",
      }, 409);
    }
    throw error;
  }
});

adminRoutes.patch("/programs/:id", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { title, abbreviation, division, school_level_requirement } =
    sanitizeObject(await c.req.json());
  try {
    const program = await prisma.program.update({
      where: { id },
      data: {
        title,
        abbreviation: abbreviation || null,
        division: division || null,
        school_level_requirement,
      },
    });
    await writeAuditLog(admin.id, "updated_program", "Program", id, {
      title,
      abbreviation,
      division,
      school_level_requirement,
    });
    return c.json(program);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return c.json({
        error:
          "A program with that title already exists for that applicability level.",
      }, 409);
    }
    throw error;
  }
});

adminRoutes.delete("/programs/:id", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.program.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_program", "Program", id, {});
  return c.json({ success: true });
});

adminRoutes.patch("/programs/:id/personnel", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { user_ids } = await c.req.json();
  await prisma.program.update({
    where: { id },
    data: {
      personnel: { set: user_ids.map((userId: number) => ({ id: userId })) },
    },
  });
  await writeAuditLog(admin.id, "updated_program_personnel", "Program", id, {
    user_ids,
  });
  return c.json({ success: true });
});

adminRoutes.get("/division-programs", async (c) => {
  const admin = getUserFromToken(c)!;
  const programs = await prisma.divisionProgram.findMany({
    orderBy: [{ division: "asc" }, { title: "asc" }],
  });
  return c.json(programs);
});

adminRoutes.post("/division-programs", async (c) => {
  const admin = getUserFromToken(c)!;
  const { title, abbreviation, division } = sanitizeObject(await c.req.json());
  try {
    const program = await prisma.divisionProgram.create({
      data: { title, abbreviation: abbreviation || null, division },
    });
    await writeAuditLog(
      admin.id,
      "created_division_program",
      "DivisionProgram",
      program.id,
      { title, division },
    );
    return c.json(program);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return c.json({
        error: "A program with that title already exists in that division.",
      }, 409);
    }
    throw error;
  }
});

adminRoutes.patch("/division-programs/:id", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { title, abbreviation, division } = sanitizeObject(await c.req.json());
  try {
    const program = await prisma.divisionProgram.update({
      where: { id },
      data: { title, abbreviation: abbreviation || null, division },
    });
    await writeAuditLog(
      admin.id,
      "updated_division_program",
      "DivisionProgram",
      id,
      { title, division },
    );
    return c.json(program);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return c.json({
        error: "A program with that title already exists in that division.",
      }, 409);
    }
    throw error;
  }
});

adminRoutes.delete("/division-programs/:id", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.divisionProgram.delete({ where: { id } });
  await writeAuditLog(
    admin.id,
    "deleted_division_program",
    "DivisionProgram",
    id,
    {},
  );
  return c.json({ success: true });
});
