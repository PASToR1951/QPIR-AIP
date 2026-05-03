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
import {
  CLUSTER_LOGO_DIR,
  LOGO_MIME_EXTENSIONS,
  SCHOOL_LOGO_DIR,
  removeExistingClusterLogos,
  removeExistingSchoolLogos,
} from "./shared/logos.ts";
import { parsePositiveInt } from "./shared/params.ts";

const SCHOOL_LEVELS = new Set(["Elementary", "Secondary"]);

export const observerRoutes = new Hono();
export const adminRoutes = new Hono();

observerRoutes.use("/clusters", adminOrObserverOnly);
observerRoutes.use("/schools", adminOrObserverOnly);

adminRoutes.use("/clusters/:id", adminOnly);
adminRoutes.use("/clusters/:id/logo", adminOnly);
adminRoutes.use("/schools/:id", adminOnly);
adminRoutes.use("/schools/:id/restrictions", adminOnly);
adminRoutes.use("/schools/:id/logo", adminOnly);

observerRoutes.get("/clusters", async (c) => {
  const actor = await requireAdminOrObserver(c);
  if (!actor) return c.json({ error: "Unauthorized" }, 401);

  if (actor.role === OBSERVER_ROLE) {
    const clusters = await prisma.cluster.findMany({
      select: { id: true, name: true, cluster_number: true, logo: true },
      orderBy: { cluster_number: "asc" },
    });
    return c.json(clusters);
  }

  const clusters = await prisma.cluster.findMany({
    include: {
      schools: {
        orderBy: { name: "asc" },
        include: {
          aips: { select: { id: true, year: true, status: true } },
          users: {
            select: {
              id: true,
              email: true,
              salutation: true,
              name: true,
              first_name: true,
              middle_initial: true,
              last_name: true,
              position: true,
            },
          },
          restricted_programs: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { cluster_number: "asc" },
  });
  return c.json(clusters);
});

adminRoutes.post("/clusters", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { cluster_number, name } = sanitizeObject(await c.req.json());
  if (!cluster_number) {
    return c.json({ error: "Cluster number is required" }, 400);
  }
  try {
    const cluster = await prisma.cluster.create({
      data: { cluster_number: Number(cluster_number), name },
    });
    await writeAuditLog(admin.id, "created_cluster", "Cluster", cluster.id, {
      cluster_number,
      name,
    }, { ctx: c });
    return c.json(cluster);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return c.json({ error: `Cluster ${cluster_number} already exists` }, 409);
    }
    throw error;
  }
});

adminRoutes.patch("/clusters/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { cluster_number, name } = sanitizeObject(await c.req.json());
  if (!cluster_number) {
    return c.json({ error: "Cluster number is required" }, 400);
  }
  try {
    const cluster = await prisma.cluster.update({
      where: { id },
      data: { cluster_number: Number(cluster_number), name },
    });
    await writeAuditLog(admin.id, "updated_cluster", "Cluster", id, {
      cluster_number,
      name,
    }, { ctx: c });
    return c.json(cluster);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return c.json({ error: `Cluster ${cluster_number} already exists` }, 409);
    }
    throw error;
  }
});

adminRoutes.delete("/clusters/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  const schoolCount = await prisma.school.count({ where: { cluster_id: id } });
  if (schoolCount > 0) {
    return c.json({
      error: "Cannot delete a cluster that has schools assigned to it",
    }, 400);
  }
  await prisma.cluster.delete({ where: { id } });
  await removeExistingClusterLogos(id);
  await writeAuditLog(admin.id, "deleted_cluster", "Cluster", id, {}, {
    ctx: c,
  });
  return c.json({ success: true });
});

adminRoutes.post("/clusters/:id/logo", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid cluster ID" }, 400);

  const cluster = await prisma.cluster.findUnique({ where: { id } });
  if (!cluster) return c.json({ error: "Cluster not found" }, 404);

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Expected multipart/form-data" }, 400);
  }

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return c.json({ error: "Missing logo file" }, 400);
  }

  const extension = LOGO_MIME_EXTENSIONS[file.type];
  if (!extension) {
    return c.json({
      error: "Logo must be a WebP, PNG, JPEG, or GIF image",
    }, 400);
  }
  if (file.size > 2 * 1024 * 1024) {
    return c.json({ error: "Logo must be 2 MB or smaller" }, 400);
  }

  await Deno.mkdir(CLUSTER_LOGO_DIR, { recursive: true });
  await removeExistingClusterLogos(id);

  const logoPath = `/cluster-logos/${id}.${extension}?v=${Date.now()}`;
  const buffer = await file.arrayBuffer();
  await Deno.writeFile(
    `${CLUSTER_LOGO_DIR}/${id}.${extension}`,
    new Uint8Array(buffer),
  );

  await prisma.cluster.update({ where: { id }, data: { logo: logoPath } });
  await writeAuditLog(admin.id, "uploaded_cluster_logo", "Cluster", id, {
    logo: logoPath,
  }, { ctx: c });

  return c.json({ logo: logoPath });
});

adminRoutes.delete("/clusters/:id/logo", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid cluster ID" }, 400);

  const cluster = await prisma.cluster.findUnique({ where: { id } });
  if (!cluster) return c.json({ error: "Cluster not found" }, 404);

  await prisma.cluster.update({ where: { id }, data: { logo: null } });
  await removeExistingClusterLogos(id);
  await writeAuditLog(admin.id, "removed_cluster_logo", "Cluster", id, {}, {
    ctx: c,
  });
  return c.json({ logo: null });
});

observerRoutes.get("/schools", async (c) => {
  const actor = await requireAdminOrObserver(c);
  if (!actor) return c.json({ error: "Unauthorized" }, 401);
  const clusterId = c.req.query("cluster")
    ? safeParseInt(c.req.query("cluster"), 0)
    : undefined;

  if (actor.role === OBSERVER_ROLE) {
    const schools = await prisma.school.findMany({
      where: clusterId ? { cluster_id: clusterId } : undefined,
      select: {
        id: true,
        name: true,
        abbreviation: true,
        cluster_id: true,
        logo: true,
        cluster: true,
      },
      orderBy: { name: "asc" },
    });
    return c.json(schools);
  }

  const schools = await prisma.school.findMany({
    where: clusterId ? { cluster_id: clusterId } : undefined,
    include: {
      cluster: true,
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          first_name: true,
          last_name: true,
        },
      },
      restricted_programs: { select: { id: true, title: true } },
      aips: { select: { id: true, year: true, status: true } },
    },
    orderBy: { name: "asc" },
  });
  return c.json(schools);
});

adminRoutes.post("/schools", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  const { name, abbreviation, level, cluster_id } = sanitizeObject(
    await c.req.json(),
  );
  if (!SCHOOL_LEVELS.has(level)) {
    return c.json({
      error: "School level must be Elementary or Secondary",
    }, 400);
  }
  const clusterId = parsePositiveInt(cluster_id);
  if (!clusterId) return c.json({ error: "Cluster is required" }, 400);

  const clusterExists = await prisma.cluster.findUnique({
    where: { id: clusterId },
    select: { id: true },
  });
  if (!clusterExists) return c.json({ error: "Cluster not found" }, 404);

  const school = await prisma.school.create({
    data: {
      name,
      abbreviation: abbreviation || null,
      level,
      cluster: { connect: { id: clusterId } },
    },
  });

  await writeAuditLog(admin.id, "created_school", "School", school.id, {
    name,
    abbreviation,
    level,
    cluster_id: clusterId,
  }, { ctx: c });
  return c.json(school);
});

adminRoutes.patch("/schools/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  const body = sanitizeObject(await c.req.json());
  const { name, abbreviation, level, cluster_id } = body;

  if ("level" in body && !SCHOOL_LEVELS.has(level)) {
    return c.json({
      error: "School level must be Elementary or Secondary",
    }, 400);
  }

  let clusterId: number | undefined;
  if ("cluster_id" in body) {
    const parsedClusterId = parsePositiveInt(cluster_id);
    if (!parsedClusterId) {
      return c.json({ error: "Cluster is required" }, 400);
    }
    const clusterExists = await prisma.cluster.findUnique({
      where: { id: parsedClusterId },
      select: { id: true },
    });
    if (!clusterExists) return c.json({ error: "Cluster not found" }, 404);
    clusterId = parsedClusterId;
  }

  const school = await prisma.school.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...("abbreviation" in body && { abbreviation: abbreviation || null }),
      ...(level && { level }),
      ...(clusterId !== undefined &&
        { cluster: { connect: { id: clusterId } } }),
    },
  });

  await writeAuditLog(admin.id, "updated_school", "School", id, body, {
    ctx: c,
  });
  return c.json(school);
});

adminRoutes.delete("/schools/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.school.delete({ where: { id } });
  await writeAuditLog(admin.id, "deleted_school", "School", id, {}, {
    ctx: c,
  });
  return c.json({ success: true });
});

adminRoutes.patch("/schools/:id/restrictions", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  const { restricted_program_ids } = await c.req.json();
  await prisma.school.update({
    where: { id },
    data: {
      restricted_programs: {
        set: restricted_program_ids.map((programId: number) => ({ id: programId })),
      },
    },
  });
  await writeAuditLog(admin.id, "updated_school_restrictions", "School", id, {
    restricted_program_ids,
  }, { ctx: c });
  return c.json({ success: true });
});

adminRoutes.post("/schools/:id/logo", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid school ID" }, 400);

  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) return c.json({ error: "School not found" }, 404);

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Expected multipart/form-data" }, 400);
  }

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return c.json({ error: "Missing logo file" }, 400);
  }

  const extension = LOGO_MIME_EXTENSIONS[file.type];
  if (!extension) {
    return c.json({
      error: "Logo must be a WebP, PNG, JPEG, or GIF image",
    }, 400);
  }
  if (file.size > 2 * 1024 * 1024) {
    return c.json({ error: "Logo must be 2 MB or smaller" }, 400);
  }

  await Deno.mkdir(SCHOOL_LOGO_DIR, { recursive: true });
  await removeExistingSchoolLogos(id);

  const logoPath = `/school-logos/${id}.${extension}?v=${Date.now()}`;
  const buffer = await file.arrayBuffer();
  await Deno.writeFile(
    `${SCHOOL_LOGO_DIR}/${id}.${extension}`,
    new Uint8Array(buffer),
  );

  await prisma.school.update({ where: { id }, data: { logo: logoPath } });
  await writeAuditLog(admin.id, "uploaded_school_logo", "School", id, {
    logo: logoPath,
  }, { ctx: c });

  return c.json({ logo: logoPath });
});

adminRoutes.delete("/schools/:id/logo", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  if (!id) return c.json({ error: "Invalid school ID" }, 400);

  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) return c.json({ error: "School not found" }, 404);

  await prisma.school.update({ where: { id }, data: { logo: null } });
  await removeExistingSchoolLogos(id);
  await writeAuditLog(admin.id, "removed_school_logo", "School", id, {}, {
    ctx: c,
  });

  return c.json({ logo: null });
});
