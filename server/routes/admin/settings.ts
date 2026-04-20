import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { sanitizeObject } from "../../lib/sanitize.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { adminOnly } from "./shared/guards.ts";
import {
  EMAIL_PASSWORD_MASK,
  getOrCreateEmailConfig,
  isEmailConfigured,
  toPublicEmailConfig,
  validateMagicLinkTtlMinutes,
} from "../../lib/emailConfig.ts";
import { encryptText } from "../../lib/emailCrypto.ts";
import { sendMail } from "../../lib/mailer.ts";
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

settingsRoutes.get("/settings/email-config", async (c) => {
  const config = await getOrCreateEmailConfig();
  return c.json(toPublicEmailConfig(config));
});

settingsRoutes.put("/settings/email-config", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = sanitizeObject(await c.req.json());
  const current = await getOrCreateEmailConfig();

  const smtpHost = typeof body.smtp_host === "string" && body.smtp_host.trim()
    ? body.smtp_host.trim()
    : current.smtp_host;
  const smtpPort = body.smtp_port !== undefined ? Number(body.smtp_port) : current.smtp_port;
  const smtpUser = typeof body.smtp_user === "string"
    ? body.smtp_user.trim()
    : current.smtp_user;
  const fromName = typeof body.from_name === "string" && body.from_name.trim()
    ? body.from_name.trim()
    : current.from_name;
  const isEnabled = body.is_enabled !== undefined
    ? Boolean(body.is_enabled)
    : current.is_enabled;

  if (!Number.isInteger(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
    return c.json({ error: "SMTP port must be a whole number between 1 and 65535." }, 400);
  }

  let smtpPassEnc = current.smtp_pass_enc;
  if (body.smtp_pass !== undefined) {
    const incomingPassword = typeof body.smtp_pass === "string"
      ? body.smtp_pass.trim()
      : "";
    if (incomingPassword && incomingPassword !== EMAIL_PASSWORD_MASK) {
      smtpPassEnc = await encryptText(incomingPassword);
    }
  }

  let magicLinkTtlLogin = current.magic_link_ttl_login;
  let magicLinkTtlWelcome = current.magic_link_ttl_welcome;
  let magicLinkTtlReminder = current.magic_link_ttl_reminder;

  try {
    if (body.magic_link_ttl_login !== undefined) {
      magicLinkTtlLogin = validateMagicLinkTtlMinutes(
        body.magic_link_ttl_login,
        "Login magic link",
      );
    }
    if (body.magic_link_ttl_welcome !== undefined) {
      magicLinkTtlWelcome = validateMagicLinkTtlMinutes(
        body.magic_link_ttl_welcome,
        "Welcome magic link",
      );
    }
    if (body.magic_link_ttl_reminder !== undefined) {
      magicLinkTtlReminder = validateMagicLinkTtlMinutes(
        body.magic_link_ttl_reminder,
        "Reminder magic link",
      );
    }
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : "Invalid email settings.",
    }, 400);
  }

  const updated = await prisma.emailConfig.update({
    where: { id: current.id },
    data: {
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_user: smtpUser,
      smtp_pass_enc: smtpPassEnc,
      from_name: fromName,
      is_enabled: isEnabled,
      magic_link_ttl_login: magicLinkTtlLogin,
      magic_link_ttl_welcome: magicLinkTtlWelcome,
      magic_link_ttl_reminder: magicLinkTtlReminder,
    },
  });

  await writeAuditLog(admin.id, "updated_email_config", "EmailConfig", updated.id, {
    smtp_host: updated.smtp_host,
    smtp_port: updated.smtp_port,
    smtp_user: updated.smtp_user,
    has_password: Boolean(updated.smtp_pass_enc),
    from_name: updated.from_name,
    is_enabled: updated.is_enabled,
    magic_link_ttl_login: updated.magic_link_ttl_login,
    magic_link_ttl_welcome: updated.magic_link_ttl_welcome,
    magic_link_ttl_reminder: updated.magic_link_ttl_reminder,
  });

  return c.json(toPublicEmailConfig(updated));
});

settingsRoutes.post("/settings/email-config/test", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const [config, adminUser] = await Promise.all([
    getOrCreateEmailConfig(),
    prisma.user.findUnique({
      where: { id: admin.id },
      select: { email: true, name: true },
    }),
  ]);

  if (!adminUser?.email) {
    return c.json({ error: "Admin account does not have an email address." }, 400);
  }

  if (!isEmailConfigured(config, { ignoreDisabled: true })) {
    return c.json({ error: "SMTP is incomplete. Save a valid sender email and app password first." }, 400);
  }

  const result = await sendMail({
    to: adminUser.email,
    subject: "AIP-PIR email configuration test",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.7;color:#0f172a;">
        <p>Hello ${adminUser.name ?? adminUser.email},</p>
        <p>This is a successful test message from the AIP-PIR email configuration screen.</p>
        <p>If you received this, the configured SMTP credentials are working.</p>
      </div>
    `,
  }, { ignoreDisabled: true });

  if (result.status !== "sent") {
    return c.json({
      error: result.error ?? "Test email could not be sent.",
    }, 400);
  }

  await writeAuditLog(admin.id, "sent_email_config_test", "EmailConfig", config.id, {
    target_email: adminUser.email,
  });

  return c.json({ success: true, target: adminUser.email });
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
  const admin = (await getUserFromToken(c))!;
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
  const admin = (await getUserFromToken(c))!;

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

  const existingConfig = await prisma.divisionConfig.findFirst();
  if (existingConfig) {
    await prisma.divisionConfig.update({ where: { id: existingConfig.id }, data: { app_logo: logoPath } });
  } else {
    await prisma.divisionConfig.create({ data: { app_logo: logoPath } });
  }
  await writeAuditLog(admin.id, "uploaded_app_logo", "DivisionConfig", 1, {
    app_logo: logoPath,
  });

  return c.json({ app_logo: logoPath });
});

settingsRoutes.delete("/settings/app-logo", async (c) => {
  const admin = (await getUserFromToken(c))!;

  await removeExistingAppLogos();
  await prisma.divisionConfig.updateMany({ data: { app_logo: null } });
  await writeAuditLog(admin.id, "deleted_app_logo", "DivisionConfig", 1, {});

  return c.json({ success: true });
});

settingsRoutes.get("/settings/signatories", async (c) => {
  const [users, config, clusters, programs] = await Promise.all([
    prisma.user.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        role: { notIn: ["Pending", "Admin", "Observer"] },
      },
      select: {
        id: true,
        name: true,
        first_name: true,
        last_name: true,
        role: true,
        school: { select: { id: true, name: true, cluster_id: true } },
        cluster: { select: { id: true, name: true, cluster_number: true } },
        programs: { select: { id: true, title: true, division: true } },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.divisionConfig.findFirst(),
    prisma.cluster.findMany({
      include: {
        cluster_head: {
          select: { id: true, name: true, first_name: true, last_name: true, position: true },
        },
      },
    }),
    prisma.program.findMany({ select: { id: true, title: true, division: true } }),
  ]);

  // Build CES lookup: role → { name, title }
  const CES_TITLES: Record<string, string> = {
    "CES-SGOD": "Chief Education Supervisor, SGOD",
    "CES-CID":  "Chief Education Supervisor, CID",
    "CES-ASDS": "Assistant Schools Division Superintendent",
  };
  const CES_DIVISION_KEY: Record<string, string> = {
    "SGOD": "CES-SGOD",
    "CID":  "CES-CID",
    "OSDS": "CES-ASDS",
  };

  // CES users who ARE the signatories (their own row in the user list)
  const cesUsersByRole: Record<string, { name: string; title: string }> = {};
  for (const u of users) {
    if (["CES-SGOD", "CES-CID", "CES-ASDS"].includes(u.role)) {
      const displayName = u.name || [u.first_name, u.last_name].filter(Boolean).join(" ");
      cesUsersByRole[u.role] = { name: displayName, title: CES_TITLES[u.role] };
    }
  }

  // Fallback to DivisionConfig when no CES user exists
  const cesFallback: Record<string, { name: string; title: string }> = {
    "CES-SGOD": {
      name:  cesUsersByRole["CES-SGOD"]?.name  || config?.sgod_noted_by_name  || "",
      title: cesUsersByRole["CES-SGOD"]?.title || (config?.sgod_noted_by_name  ? CES_TITLES["CES-SGOD"]  : ""),
    },
    "CES-CID": {
      name:  cesUsersByRole["CES-CID"]?.name   || config?.cid_noted_by_name   || "",
      title: cesUsersByRole["CES-CID"]?.title  || (config?.cid_noted_by_name   ? CES_TITLES["CES-CID"]   : ""),
    },
    "CES-ASDS": {
      name:  cesUsersByRole["CES-ASDS"]?.name  || config?.osds_noted_by_name  || "",
      title: cesUsersByRole["CES-ASDS"]?.title || (config?.osds_noted_by_name  ? CES_TITLES["CES-ASDS"]  : ""),
    },
  };

  // Build cluster head lookup: clusterId → { name, title }
  const clusterHeadByClusterId: Record<number, { name: string; title: string }> = {};
  for (const cl of clusters) {
    if (cl.cluster_head) {
      const h = cl.cluster_head;
      clusterHeadByClusterId[cl.id] = {
        name:  h.name || [h.first_name, h.last_name].filter(Boolean).join(" "),
        title: h.position || "Cluster Coordinator",
      };
    }
  }

  // Build program division lookup: programId → Division
  const programDivision: Record<number, string | null> = {};
  for (const p of programs) {
    programDivision[p.id] = p.division;
  }

  const fallbackSupervisor = {
    name:  config?.supervisor_name  || "",
    title: config?.supervisor_title || "",
  };

  // Resolve signatory for each user
  const rows = users.map((u) => {
    let signatory: { name: string; title: string; source: string };

    if (u.role === "School") {
      const clusterId = u.school?.cluster_id;
      const head = clusterId ? clusterHeadByClusterId[clusterId] : null;
      if (head?.name) {
        signatory = { ...head, source: "cluster_head" };
      } else {
        signatory = { name: "", title: "", source: "none" };
      }
    } else if (u.role === "Cluster Coordinator") {
      const cid = cesFallback["CES-CID"];
      signatory = cid.name
        ? { ...cid, source: "ces_cid" }
        : { name: "", title: "", source: "none" };
    } else if (u.role === "Division Personnel") {
      // Use the first program's division to determine the CES chief
      const firstDivision = u.programs.map(p => programDivision[p.id]).find(Boolean);
      const cesRole = firstDivision ? CES_DIVISION_KEY[firstDivision] : null;
      const ces = cesRole ? cesFallback[cesRole] : null;
      if (ces?.name) {
        signatory = { ...ces, source: `ces_${firstDivision?.toLowerCase() ?? "unknown"}` };
      } else if (fallbackSupervisor.name) {
        signatory = { ...fallbackSupervisor, source: "division_config" };
      } else {
        signatory = { name: "", title: "", source: "none" };
      }
    } else if (["CES-SGOD", "CES-CID", "CES-ASDS"].includes(u.role)) {
      // CES users are themselves signatories — their own supervisor is the SDS
      signatory = fallbackSupervisor.name
        ? { ...fallbackSupervisor, source: "division_config" }
        : { name: "", title: "", source: "none" };
    } else {
      signatory = { name: "", title: "", source: "none" };
    }

    return {
      user: {
        id: u.id,
        name: u.name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.first_name || "",
        role: u.role,
        school: u.school?.name ?? null,
        cluster: u.cluster
          ? `Cluster ${u.cluster.cluster_number}`
          : u.school?.cluster_id
            ? `Cluster ${clusters.find(c => c.id === u.school?.cluster_id)?.cluster_number ?? "?"}`
            : null,
        programs: u.programs.map(p => p.title),
      },
      signatory,
    };
  });

  return c.json(rows);
});

export default settingsRoutes;
