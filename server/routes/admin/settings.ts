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
  });
});

settingsRoutes.post("/settings/division-config", async (c) => {
  const admin = getUserFromToken(c)!;
  const { supervisor_name, supervisor_title } = sanitizeObject(
    await c.req.json(),
  );
  const existing = await prisma.divisionConfig.findFirst();

  let config;
  if (existing) {
    config = await prisma.divisionConfig.update({
      where: { id: existing.id },
      data: {
        supervisor_name: supervisor_name ?? "",
        supervisor_title: supervisor_title ?? "",
      },
    });
  } else {
    config = await prisma.divisionConfig.create({
      data: {
        supervisor_name: supervisor_name ?? "",
        supervisor_title: supervisor_title ?? "",
      },
    });
  }

  await writeAuditLog(
    admin.id,
    "updated_division_config",
    "DivisionConfig",
    config.id,
    { supervisor_name, supervisor_title },
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
