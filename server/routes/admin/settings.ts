import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { adminOnly } from "./shared/guards.ts";
import {
  APP_LOGO_DIR,
  LOGO_MIME_EXTENSIONS,
  removeExistingAppLogos,
} from "./shared/logos.ts";

const settingsRoutes = new Hono();

settingsRoutes.use("/settings/*", adminOnly);

settingsRoutes.get("/settings/system-info", async (c) => {
  const [userCount, schoolCount, programCount] = await Promise.all([
    prisma.user.count(),
    prisma.school.count(),
    prisma.program.count(),
  ]);
  return c.json({ userCount, schoolCount, programCount });
});

settingsRoutes.get("/settings/division-config", async (c) => {
  const config = await prisma.divisionConfig.findFirst();
  return c.json(config ?? {
    supervisor_name: "",
    supervisor_title: "",
    app_logo: null,
    sgod_noted_by_name: "",
    sgod_noted_by_title: "",
    cid_noted_by_name: "",
    cid_noted_by_title: "",
    osds_noted_by_name: "",
    osds_noted_by_title: "",
  });
});

settingsRoutes.post("/settings/division-config", async (c) => {
  const admin = getUserFromToken(c)!;
  const body = sanitizeObject(await c.req.json());
  const {
    supervisor_name, supervisor_title,
    sgod_noted_by_name, sgod_noted_by_title,
    cid_noted_by_name, cid_noted_by_title,
    osds_noted_by_name, osds_noted_by_title,
  } = body;

  // Build update data — only include fields that were sent
  const data: Record<string, string> = {};
  if (supervisor_name !== undefined) data.supervisor_name = supervisor_name;
  if (supervisor_title !== undefined) data.supervisor_title = supervisor_title;
  if (sgod_noted_by_name !== undefined) data.sgod_noted_by_name = sgod_noted_by_name;
  if (sgod_noted_by_title !== undefined) data.sgod_noted_by_title = sgod_noted_by_title;
  if (cid_noted_by_name !== undefined) data.cid_noted_by_name = cid_noted_by_name;
  if (cid_noted_by_title !== undefined) data.cid_noted_by_title = cid_noted_by_title;
  if (osds_noted_by_name !== undefined) data.osds_noted_by_name = osds_noted_by_name;
  if (osds_noted_by_title !== undefined) data.osds_noted_by_title = osds_noted_by_title;

  const existing = await prisma.divisionConfig.findFirst();

  let config;
  if (existing) {
    config = await prisma.divisionConfig.update({
      where: { id: existing.id },
      data,
    });
  } else {
    config = await prisma.divisionConfig.create({ data });
  }

  await writeAuditLog(
    admin.id,
    "updated_division_config",
    "DivisionConfig",
    config.id,
    body,
  );
  return c.json(config);
});

settingsRoutes.post("/settings/app-logo", async (c) => {
  const admin = getUserFromToken(c)!;

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

  await Deno.mkdir(APP_LOGO_DIR, { recursive: true });
  await removeExistingAppLogos();

  const logoPath = `/app-logo/logo.${extension}?v=${Date.now()}`;
  const buffer = await file.arrayBuffer();
  await Deno.writeFile(
    `${APP_LOGO_DIR}/logo.${extension}`,
    new Uint8Array(buffer),
  );

  await prisma.divisionConfig.updateMany({ data: { app_logo: logoPath } });
  await writeAuditLog(admin.id, "uploaded_app_logo", "DivisionConfig", 1, {
    app_logo: logoPath,
  });

  return c.json({ app_logo: logoPath });
});

settingsRoutes.delete("/settings/app-logo", async (c) => {
  const admin = getUserFromToken(c)!;

  await removeExistingAppLogos();
  await prisma.divisionConfig.updateMany({ data: { app_logo: null } });
  await writeAuditLog(admin.id, "deleted_app_logo", "DivisionConfig", 1, {});

  return c.json({ success: true });
});

export default settingsRoutes;
