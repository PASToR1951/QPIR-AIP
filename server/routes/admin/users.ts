import { Hono } from "hono";
import bcrypt from "bcrypt";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { logger } from "../../lib/logger.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { sendWelcomeEmail } from "../../lib/accountEmails.ts";
import { revokeAllUserSessions } from "../../lib/userSessions.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { adminOnly, OBSERVER_ROLE } from "./shared/guards.ts";
import { parsePositiveInt } from "./shared/params.ts";

const usersRoutes = new Hono();

usersRoutes.use("/users", adminOnly);
usersRoutes.use("/users/*", adminOnly);

usersRoutes.get("/users", async (c) => {
  const search = c.req.query("search");
  const role = c.req.query("role");
  const status = c.req.query("status");

  const [users, allPrograms] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...(role && role !== "All" && { role }),
        ...(status === "active" && { is_active: true }),
        ...(status === "disabled" && { is_active: false }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { school: { include: { cluster: true } }, programs: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.program.findMany({
      where: { school_level_requirement: { not: "Division" } },
      select: {
        id: true,
        title: true,
        school_level_requirement: true,
        division: true,
        restricted_schools: { select: { id: true } },
      },
      orderBy: { title: "asc" },
    }),
  ]);

  return c.json(users.map((user) => {
    let programs;
    if (user.role === "School" && user.school) {
      const schoolLevel = user.school.level;
      const schoolId = user.school.id;
      programs = allPrograms
        .filter((program) => {
          const restricted = program.restricted_schools;
          if (program.school_level_requirement === "Select Schools") {
            return restricted.some((school) => school.id === schoolId);
          }
          const levelMatch = program.school_level_requirement === "Both" ||
            program.school_level_requirement === schoolLevel ||
            (schoolLevel === "Both" &&
              ["Elementary", "Secondary"].includes(
                program.school_level_requirement,
              ));
          if (!levelMatch) return false;
          if (restricted.length > 0) {
            return restricted.some((school) => school.id === schoolId);
          }
          return true;
        })
        .map((program) => ({ id: program.id, title: program.title, division: program.division }));
    } else {
      programs = user.programs.map((program) => ({
        id: program.id,
        title: program.title,
        division: program.division,
      }));
    }

    return {
      id: user.id,
      salutation: user.salutation,
      name: user.name,
      first_name: user.first_name,
      middle_initial: user.middle_initial,
      last_name: user.last_name,
      position: user.position,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      school: user.school ? { id: user.school.id, name: user.school.name } : null,
      programs,
      created_at: user.created_at,
    };
  }));
});

usersRoutes.post("/users", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const {
    salutation,
    name,
    first_name,
    middle_initial,
    last_name,
    position,
    email,
    password,
    role,
    school_id,
    cluster_id,
    program_ids,
  } = sanitizeObject(await c.req.json());

  const systemRoles = [
    "Admin",
    "CES-SGOD",
    "CES-ASDS",
    "CES-CID",
    "Cluster Coordinator",
    OBSERVER_ROLE,
  ];
  if (systemRoles.includes(role) && !name) {
    return c.json({ error: "name is required for this role" }, 400);
  }
  if (role === "Division Personnel" && (!first_name || !last_name)) {
    return c.json({
      error: "first_name and last_name are required for Division Personnel",
    }, 400);
  }
  if (!email || !password || !role) {
    return c.json({ error: "email, password, role are required" }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: "Minimum 6 characters required" }, 400);
  }

  const cesRoles = ["CES-SGOD", "CES-ASDS", "CES-CID"];
  if (cesRoles.includes(role)) {
    const existing = await prisma.user.findFirst({ where: { role } });
    if (existing) {
      return c.json({
        error:
          `A ${role} account already exists. Only one account per CES role is allowed.`,
      }, 409);
    }
  }

  if (role === "Cluster Coordinator") {
    const count = await prisma.user.count({
      where: { role: "Cluster Coordinator" },
    });
    if (count >= 10) {
      return c.json({
        error: "Maximum of 10 Cluster Coordinator accounts allowed.",
      }, 409);
    }
  }

  if (role === "School" && school_id) {
    const existing = await prisma.user.findFirst({
      where: { role: "School", school_id },
    });
    if (existing) {
      return c.json({
        error:
          "This school already has a user account. Only one account per school is allowed.",
      }, 409);
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          ...(salutation !== undefined && { salutation }),
          ...(name !== undefined && { name }),
          ...(first_name !== undefined && { first_name }),
          ...(middle_initial !== undefined && { middle_initial }),
          ...(last_name !== undefined && { last_name }),
          ...(position !== undefined && { position }),
          email,
          password: hashed,
          role,
          ...(school_id && { school_id }),
          ...(cluster_id && { cluster_id }),
          ...(program_ids?.length && {
            programs: { connect: program_ids.map((id: number) => ({ id })) },
          }),
        },
      });
      await tx.auditLog.create({
        data: {
          admin_id: admin.id,
          action: "created_user",
          entity_type: "User",
          entity_id: created.id,
          details: {
            role,
            school_id: school_id ?? null,
            cluster_id: cluster_id ?? null,
          },
        },
      });
      return created;
    });

    void sendWelcomeEmail(user.id).catch((error) => {
      logger.error("Welcome email failed after user creation", {
        user_id: user.id,
        error,
      });
    });

    return c.json({ id: user.id, email: user.email, role: user.role });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return c.json({ error: "Email already exists" }, 409);
    }
    logger.error("Unexpected error creating user", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

usersRoutes.post("/users/import", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = sanitizeObject(await c.req.json());
  const rows: unknown[] = Array.isArray(body.users) ? body.users : [];

  if (rows.length === 0) return c.json({ error: "No users provided" }, 400);
  if (rows.length > 500) {
    return c.json({ error: "Maximum 500 rows per import" }, 400);
  }

  const VALID_ROLES = new Set([
    "Admin",
    "CES-SGOD",
    "CES-ASDS",
    "CES-CID",
    "Cluster Coordinator",
    "Division Personnel",
    "School",
    OBSERVER_ROLE,
  ]);
  const SYSTEM_ROLES = new Set([
    "Admin",
    "CES-SGOD",
    "CES-ASDS",
    "CES-CID",
    "Cluster Coordinator",
    OBSERVER_ROLE,
  ]);

  interface ImportRow {
    email: string;
    role: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    middle_initial?: string;
    school_id_int?: number;
    cluster_id_int?: number;
    program_ids?: number[];
  }

  const errors: { email: string; reason: string }[] = [];
  const validRows: ImportRow[] = [];

  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const email = (typeof row.email === "string" ? row.email : "").trim()
      .toLowerCase();

    if (!email || !email.endsWith("@deped.gov.ph")) {
      errors.push({
        email: email || "(empty)",
        reason: "Invalid or missing email (must be @deped.gov.ph)",
      });
      continue;
    }
    if (!VALID_ROLES.has(row.role as string)) {
      errors.push({ email, reason: `Unknown role: "${row.role}"` });
      continue;
    }

    const role = row.role as string;
    if (SYSTEM_ROLES.has(role) && !(row.name as string)?.trim()) {
      errors.push({ email, reason: `"name" is required for role "${role}"` });
      continue;
    }
    if (
      role === "Division Personnel" &&
      (!(row.first_name as string)?.trim() || !(row.last_name as string)?.trim())
    ) {
      errors.push({
        email,
        reason: "first_name and last_name are required for Division Personnel",
      });
      continue;
    }

    const schoolId = parsePositiveInt(row.school_id) ?? undefined;
    if (role === "School" && !schoolId) {
      errors.push({
        email,
        reason: "Valid school_id is required for School role",
      });
      continue;
    }

    const clusterId = parsePositiveInt(row.cluster_id) ?? undefined;
    const rawProgramIds = row.program_ids;
    const programIds: number[] = Array.isArray(rawProgramIds)
      ? (rawProgramIds as unknown[])
        .map(Number)
        .filter((value) => Number.isInteger(value) && value > 0)
      : [];

    validRows.push({
      email,
      role,
      name: (row.name as string)?.trim() || undefined,
      first_name: (row.first_name as string)?.trim() || undefined,
      last_name: (row.last_name as string)?.trim() || undefined,
      middle_initial: (row.middle_initial as string)?.trim() || undefined,
      school_id_int: schoolId,
      cluster_id_int: clusterId,
      program_ids: programIds,
    });
  }

  const validEmails = validRows.map((row) => row.email);
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: validEmails } },
    select: { email: true },
  });
  const existingEmailSet = new Set(existingUsers.map((user) => user.email));

  let imported = 0;
  let skipped = 0;
  const rolesImported: Record<string, number> = {};
  const createdUserIds: number[] = [];

  for (const row of validRows) {
    if (existingEmailSet.has(row.email)) {
      skipped++;
      continue;
    }
    try {
      const created = await prisma.user.create({
        data: {
          email: row.email,
          password: null,
          is_active: true,
          role: row.role,
          ...(row.name && { name: row.name }),
          ...(row.first_name && { first_name: row.first_name }),
          ...(row.last_name && { last_name: row.last_name }),
          ...(row.middle_initial && { middle_initial: row.middle_initial }),
          ...(row.school_id_int && { school_id: row.school_id_int }),
          ...(row.cluster_id_int && { cluster_id: row.cluster_id_int }),
          ...(row.program_ids?.length && {
            programs: { connect: row.program_ids.map((id) => ({ id })) },
          }),
        },
      });
      createdUserIds.push(created.id);
      imported++;
      rolesImported[row.role] = (rolesImported[row.role] ?? 0) + 1;
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === "P2002") {
        skipped++;
      } else {
        errors.push({ email: row.email, reason: "Database error" });
        logger.error("Error importing user", { email: row.email, error });
      }
    }
  }

  try {
    await writeAuditLog(admin.id, "bulk_imported_users", "User", 0, {
      imported,
      skipped,
      error_count: errors.length,
      roles_imported: rolesImported,
    });
  } catch (error) {
    logger.error("Failed to write audit log for bulk import", error);
  }

  return c.json({ imported, skipped, errors, created_user_ids: createdUserIds });
});

usersRoutes.patch("/users/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  const body = sanitizeObject(await c.req.json());
  const {
    salutation,
    name,
    first_name,
    middle_initial,
    last_name,
    position,
    role,
    school_id,
    cluster_id,
    program_ids,
    is_active,
  } = body;

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, is_active: true },
  });
  if (!existingUser) {
    return c.json({ error: "Not found" }, 404);
  }

  const cesRoles = ["CES-SGOD", "CES-ASDS", "CES-CID"];
  if (role !== undefined && cesRoles.includes(role)) {
    const existing = await prisma.user.findFirst({
      where: { role, NOT: { id } },
    });
    if (existing) {
      return c.json({
        error:
          `A ${role} account already exists. Only one account per CES role is allowed.`,
      }, 409);
    }
  }

  if (role === "School" && school_id != null) {
    const existing = await prisma.user.findFirst({
      where: { role: "School", school_id, NOT: { id } },
    });
    if (existing) {
      return c.json({
        error:
          "This school already has a user account. Only one account per school is allowed.",
      }, 409);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (salutation !== undefined) updateData.salutation = salutation;
  if (name !== undefined) updateData.name = name;
  if (first_name !== undefined) updateData.first_name = first_name;
  if (middle_initial !== undefined) updateData.middle_initial = middle_initial;
  if (last_name !== undefined) updateData.last_name = last_name;
  if (position !== undefined) updateData.position = position;
  if (role !== undefined) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;

  if (role === "School" && school_id !== undefined) {
    updateData.school_id = school_id;
    updateData.cluster_id = null;
  } else if (role === "Cluster Coordinator") {
    if (school_id !== undefined) updateData.school_id = school_id;
    if (cluster_id !== undefined) updateData.cluster_id = cluster_id;
  } else if (
    [
      "Division Personnel",
      "Admin",
      "CES-SGOD",
      "CES-ASDS",
      "CES-CID",
      "Pending",
      OBSERVER_ROLE,
    ].includes(role)
  ) {
    updateData.school_id = null;
    updateData.cluster_id = null;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(program_ids !== undefined && {
          programs: { set: program_ids.map((programId: number) => ({ id: programId })) },
        }),
      },
    });

    const revokedSessionCount =
      existingUser.is_active && is_active === false
        ? await revokeAllUserSessions(id, { revokedBy: admin.id })
        : 0;

    await writeAuditLog(admin.id, "updated_user", "User", id, {
      ...body,
      ...(is_active === false
        ? { revoked_session_count: revokedSessionCount }
        : {}),
    });
    return c.json({
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
  } catch (error: unknown) {
    logger.error("Error updating user", error);
    return c.json({ error: "Failed to update user." }, 500);
  }
});

usersRoutes.delete("/users/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);

  if (id === admin.id) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return c.json({ error: "Not found" }, 404);

  const revokedSessionCount = await revokeAllUserSessions(id, {
    revokedBy: admin.id,
  });
  await prisma.user.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_user", "User", id, {
    role: user.role,
    revoked_session_count: revokedSessionCount,
  });
  return c.json({ success: true });
});

usersRoutes.post("/users/:id/reset-password", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) return c.json({ error: "Not found" }, 404);

  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 10);

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(tempPassword, salt);

  await prisma.user.update({ where: { id }, data: { password: hashed, must_change_password: true } });
  const revokedSessionCount = await revokeAllUserSessions(id, {
    revokedBy: admin.id,
  });
  await writeAuditLog(admin.id, "reset_password", "User", id, {
    revoked_session_count: revokedSessionCount,
  });

  return c.json({
    success: true,
    temporaryPassword: tempPassword,
    message:
      "Password reset successful. Share this temporary password securely with the user.",
  });
});

usersRoutes.post("/users/:id/anonymize", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) return c.json({ error: "Not found" }, 404);

  await prisma.user.update({
    where: { id },
    data: {
      name: null,
      first_name: null,
      middle_initial: null,
      last_name: null,
      email: `anonymized_${id}@deleted.local`,
      password: "ANONYMIZED",
      is_active: false,
      deleted_at: new Date(),
    },
  });

  const revokedSessionCount = await revokeAllUserSessions(id, {
    revokedBy: admin.id,
  });
  await writeAuditLog(admin.id, "anonymized_user", "User", id, {
    role: user.role,
    revoked_session_count: revokedSessionCount,
  });
  return c.json({
    success: true,
    message: "User PII has been anonymized (RA 10173 §23).",
  });
});

export default usersRoutes;
