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

function serializeTemplateIndicators(
  indicators: Array<{ description?: unknown }> | null | undefined,
) {
  const source = Array.isArray(indicators) ? indicators : [];
  return source
    .map((indicator) => ({
      description: typeof indicator?.description === "string"
        ? indicator.description.trim()
        : "",
    }))
    .filter((indicator) => indicator.description.length > 0);
}

function serializeProgramTemplate(
  template: {
    program_id: number;
    outcome: string;
    target_code: string;
    target_description: string;
    indicators: unknown;
  },
) {
  return {
    program_id: template.program_id,
    outcome: template.outcome,
    target_code: template.target_code,
    target_description: template.target_description,
    indicators: serializeTemplateIndicators(template.indicators as any[] ?? []),
  };
}

observerRoutes.use("/programs", adminOrObserverOnly);

adminRoutes.use("/programs/:id", adminOnly);
adminRoutes.use("/programs/:id/template", adminOnly);
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

adminRoutes.get("/programs/:id/template", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);

  const id = safeParseInt(c.req.param("id"), 0);
  if (id === 0) return c.json({ error: "Invalid program id" }, 400);

  const program = await prisma.program.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!program) return c.json({ error: "Program not found" }, 404);

  const template = await prisma.programTemplate.findUnique({
    where: { program_id: id },
  });
  return c.json(template ? serializeProgramTemplate(template) : null);
});

adminRoutes.put("/programs/:id/template", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);

  const id = safeParseInt(c.req.param("id"), 0);
  if (id === 0) return c.json({ error: "Invalid program id" }, 400);

  const program = await prisma.program.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!program) return c.json({ error: "Program not found" }, 404);

  const body = sanitizeObject(await c.req.json()) as Record<string, unknown>;
  const outcome = String(body.outcome ?? "").trim();
  const targetCode = String(body.target_code ?? "").trim();
  const targetDescription = String(body.target_description ?? "").trim();
  const indicators = serializeTemplateIndicators(
    Array.isArray(body.indicators) ? body.indicators as any[] : [],
  );

  if (!outcome || !targetCode || !targetDescription) {
    return c.json({
      error: "outcome, target_code, and target_description are required",
    }, 400);
  }

  const existing = await prisma.programTemplate.findUnique({
    where: { program_id: id },
  });

  const saved = existing
    ? await prisma.programTemplate.update({
      where: { program_id: id },
      data: {
        outcome,
        target_code: targetCode,
        target_description: targetDescription,
        indicators,
      },
    })
    : await prisma.programTemplate.create({
      data: {
        program_id: id,
        outcome,
        target_code: targetCode,
        target_description: targetDescription,
        indicators,
      },
    });

  await writeAuditLog(
    admin.id,
    existing ? "updated_program_template" : "created_program_template",
    "ProgramTemplate",
    saved.id,
    {
      program_id: id,
      program_title: program.title,
      outcome,
      target_code: targetCode,
      indicator_count: indicators.length,
    },
  );

  return c.json(serializeProgramTemplate(saved));
});

adminRoutes.delete("/programs/:id/template", async (c) => {
  const admin = requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);

  const id = safeParseInt(c.req.param("id"), 0);
  if (id === 0) return c.json({ error: "Invalid program id" }, 400);

  const existing = await prisma.programTemplate.findUnique({
    where: { program_id: id },
  });
  if (!existing) return c.json({ error: "Template not found" }, 404);

  await prisma.programTemplate.delete({
    where: { program_id: id },
  });
  await writeAuditLog(
    admin.id,
    "deleted_program_template",
    "ProgramTemplate",
    existing.id,
    {
      program_id: id,
      target_code: existing.target_code,
    },
  );
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
