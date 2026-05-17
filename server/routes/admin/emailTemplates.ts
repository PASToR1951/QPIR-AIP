import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import {
  type EmailTemplateRow,
  loadAllTemplates,
  loadTemplate,
  renderTemplateByKey,
  type TemplateKey,
} from "../../lib/emailTemplateStore.ts";
import { getDefaultTemplate } from "../../lib/emailTemplateDefaults.ts";
import {
  findUnknownTokens,
  listAllowedTokens,
  renderTemplate,
  TEMPLATE_DEFINITIONS,
  validateAccentColor,
  wrapInShell,
} from "../../lib/emailTemplateRenderer.ts";
import { sendMail } from "../../lib/mailer.ts";
import { logger } from "../../lib/logger.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { adminOnly } from "./shared/guards.ts";

const emailTemplatesRoutes = new Hono();

emailTemplatesRoutes.use("/email-templates", adminOnly);
emailTemplatesRoutes.use("/email-templates/*", adminOnly);

const MAX_SUBJECT = 200;
const MAX_TITLE = 120;
const MAX_INTRO = 280;
const MAX_BODY_HTML = 64 * 1024;
const MAX_LABEL = 60;

const VALID_KEYS = new Set<string>(Object.keys(TEMPLATE_DEFINITIONS));

// Strips control characters (incl. CRLF for subject safety) but does NOT
// HTML-encode. Storage stays as the admin typed it; render-time escaping
// handles XSS for the fields that land in HTML.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "").replace(CONTROL_CHARS, "").trim().slice(0, maxLength);
}

function serializeTemplate(row: EmailTemplateRow, includeBody = true) {
  const out: Record<string, unknown> = {
    id: row.id,
    key: row.key,
    label: row.label,
    subject: row.subject,
    title: row.title,
    intro: row.intro,
    accent_color: row.accent_color,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  };
  if (includeBody) out.body_html = row.body_html;
  return out;
}

function serializeDefinitions() {
  return Object.values(TEMPLATE_DEFINITIONS).map((def) => ({
    key: def.key,
    label: def.label,
    description: def.description,
    variables: def.variables,
    sample_values: serializeSampleValues(def.sampleValues),
  }));
}

function serializeSampleValues(values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(values)) {
    out[name] = value instanceof Date ? value.toISOString() : value;
  }
  return out;
}

function getSampleVarsForKey(key: TemplateKey): Record<string, unknown> {
  const def = TEMPLATE_DEFINITIONS[key];
  if (!def) return {};
  const vars: Record<string, unknown> = { ...def.sampleValues };
  // Inflate ISO date strings back to Date objects so the renderer formats them.
  for (const variable of def.variables) {
    if (variable.type === "date") {
      const raw = vars[variable.name];
      if (typeof raw === "string") vars[variable.name] = new Date(raw);
    }
  }
  return vars;
}

function buildDefaultPayload(key: TemplateKey) {
  const defaults = getDefaultTemplate(key);
  if (!defaults) return null;
  const vars = getSampleVarsForKey(key);
  let renderedSubject = defaults.subject;
  let renderedHtml = "";
  try {
    const rendered = renderTemplate({
      key,
      subject: defaults.subject,
      title: defaults.title,
      intro: defaults.intro,
      body_html: defaults.body_html,
      accent_color: defaults.accent_color,
    }, vars);
    renderedSubject = rendered.subject;
    renderedHtml = wrapInShell(rendered);
  } catch (error) {
    logger.warn("Default preview render failed", {
      template_key: key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return {
    key,
    label: defaults.label,
    subject: defaults.subject,
    title: defaults.title,
    intro: defaults.intro,
    body_html: defaults.body_html,
    accent_color: defaults.accent_color,
    preview: {
      subject: renderedSubject,
      html: renderedHtml,
    },
  };
}

type NormalizedPayload = {
  label: string;
  subject: string;
  title: string;
  intro: string;
  body_html: string;
  accent_color: string;
};

function normalizePayload(
  source: Record<string, unknown>,
  key: TemplateKey,
): NormalizedPayload {
  // Storage is raw (what the admin typed). The renderer escapes title/intro
  // when interpolating into HTML; subject lands in the SMTP header as text.
  const label = cleanText(source.label, MAX_LABEL);
  const title = cleanText(source.title, MAX_TITLE);
  const intro = cleanText(source.intro, MAX_INTRO);
  // Subject must also be CRLF-free to prevent header injection.
  const subject = cleanText(source.subject, MAX_SUBJECT).replace(/[\r\n]+/g, " ");

  // body_html is admin-authored HTML — trusted (adminOnly). Strip null bytes
  // only; preserve every other character so HTML survives intact.
  const rawBody = typeof source.body_html === "string" ? source.body_html : "";
  if (rawBody.length > MAX_BODY_HTML) {
    throw new Error(`body_html exceeds ${MAX_BODY_HTML} characters`);
  }
  const body_html = rawBody.replace(/\x00/g, "").trim();

  const accentRaw = typeof source.accent_color === "string"
    ? source.accent_color.trim()
    : "";
  if (!validateAccentColor(accentRaw)) {
    throw new Error("accent_color must be a 6-digit hex like #1d4ed8");
  }

  if (!subject) throw new Error("Subject is required");
  if (!title) throw new Error("Title is required");
  if (!intro) throw new Error("Intro is required");
  if (!body_html) throw new Error("Body HTML is required");
  if (!label) throw new Error("Label is required");

  const allowed = listAllowedTokens(key);
  const bad = [
    ...findUnknownTokens(subject, allowed),
    ...findUnknownTokens(title, allowed),
    ...findUnknownTokens(intro, allowed),
    ...findUnknownTokens(body_html, allowed),
  ];
  const unique = [...new Set(bad)];
  if (unique.length > 0) {
    const err = new Error(`Unknown variables: ${unique.join(", ")}`);
    (err as any).badTokens = unique;
    throw err;
  }

  return { label, subject, title, intro, body_html, accent_color: accentRaw };
}

emailTemplatesRoutes.get("/email-templates", async (c) => {
  const rows = await loadAllTemplates();
  return c.json(rows.map((row) => serializeTemplate(row, false)));
});

emailTemplatesRoutes.get("/email-templates/definitions", (c) => {
  return c.json(serializeDefinitions());
});

emailTemplatesRoutes.get("/email-templates/:key", async (c) => {
  const key = c.req.param("key");
  if (!VALID_KEYS.has(key)) {
    return c.json({ error: "Unknown template key" }, 404);
  }
  const row = await loadTemplate(key);
  if (!row) return c.json({ error: "Template not found" }, 404);
  return c.json(serializeTemplate(row));
});

emailTemplatesRoutes.get("/email-templates/:key/default", (c) => {
  const key = c.req.param("key") as TemplateKey;
  if (!VALID_KEYS.has(key)) {
    return c.json({ error: "Unknown template key" }, 404);
  }
  const defaults = buildDefaultPayload(key);
  if (!defaults) return c.json({ error: "Template not found" }, 404);
  return c.json(defaults);
});

emailTemplatesRoutes.put("/email-templates/:key", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const key = c.req.param("key") as TemplateKey;
  if (!VALID_KEYS.has(key)) {
    return c.json({ error: "Unknown template key" }, 404);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Request body must be valid JSON" }, 400);
  }

  let payload: NormalizedPayload;
  try {
    payload = normalizePayload(body, key);
  } catch (error: any) {
    const response: Record<string, unknown> = {
      error: error?.message ?? "Invalid template payload",
    };
    if (error?.badTokens) response.bad_tokens = error.badTokens;
    return c.json(response, 400);
  }

  const expectedUpdatedAt = typeof body.updated_at === "string"
    ? new Date(body.updated_at)
    : null;

  const existing = await loadTemplate(key);
  if (!existing) return c.json({ error: "Template not found" }, 404);

  if (
    expectedUpdatedAt &&
    !Number.isNaN(expectedUpdatedAt.getTime()) &&
    existing.updated_at.getTime() !== expectedUpdatedAt.getTime()
  ) {
    return c.json({
      error:
        "Template was updated by another admin. Reload to see the latest version before saving.",
      current_updated_at: existing.updated_at,
    }, 409);
  }

  const updated = await prisma.emailTemplate.update({
    where: { key },
    data: {
      label: payload.label,
      subject: payload.subject,
      title: payload.title,
      intro: payload.intro,
      body_html: payload.body_html,
      accent_color: payload.accent_color,
      updated_by: admin.id,
    },
  }) as EmailTemplateRow;

  const updatedFields = Object.entries(payload)
    .filter(([field, value]) => (existing as any)[field] !== value)
    .map(([field]) => field);

  await writeAuditLog(
    admin.id,
    "updated_email_template",
    "EmailTemplate",
    updated.id,
    {
      key,
      updated_fields: updatedFields,
      previous_updated_at: existing.updated_at,
      new_updated_at: updated.updated_at,
    },
    { ctx: c },
  );

  return c.json(serializeTemplate(updated));
});

emailTemplatesRoutes.post("/email-templates/:key/preview", async (c) => {
  const key = c.req.param("key") as TemplateKey;
  if (!VALID_KEYS.has(key)) {
    return c.json({ error: "Unknown template key" }, 404);
  }

  let draft: Record<string, unknown> | null = null;
  try {
    draft = await c.req.json();
  } catch {
    draft = null;
  }

  let source: EmailTemplateRow | null = null;
  if (draft && typeof draft === "object" && Object.keys(draft).length > 0) {
    try {
      const payload = normalizePayload(draft, key);
      source = {
        id: 0,
        key,
        label: payload.label,
        subject: payload.subject,
        title: payload.title,
        intro: payload.intro,
        body_html: payload.body_html,
        accent_color: payload.accent_color,
        updated_at: new Date(),
        updated_by: null,
      };
    } catch (error: any) {
      const response: Record<string, unknown> = {
        error: error?.message ?? "Invalid template payload",
      };
      if (error?.badTokens) response.bad_tokens = error.badTokens;
      return c.json(response, 400);
    }
  } else {
    source = await loadTemplate(key);
    if (!source) return c.json({ error: "Template not found" }, 404);
  }

  const vars = getSampleVarsForKey(key);
  try {
    const rendered = renderTemplate({
      key: source.key,
      subject: source.subject,
      title: source.title,
      intro: source.intro,
      body_html: source.body_html,
      accent_color: source.accent_color,
    }, vars);
    return c.json({
      subject: rendered.subject,
      html: wrapInShell(rendered),
      accent_color: rendered.accent_color,
    });
  } catch (error) {
    logger.warn("Preview render failed", {
      template_key: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: "Failed to render preview" }, 500);
  }
});

emailTemplatesRoutes.post("/email-templates/:key/test-send", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const key = c.req.param("key") as TemplateKey;
  if (!VALID_KEYS.has(key)) {
    return c.json({ error: "Unknown template key" }, 404);
  }

  // Resolve the admin's email from the DB; never accept a `to` from the body.
  const adminUser = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { email: true },
  });
  if (!adminUser?.email) {
    return c.json({ error: "Your admin account has no email address." }, 400);
  }

  const vars = getSampleVarsForKey(key);
  const rendered = await renderTemplateByKey(key, vars);
  if (!rendered) {
    return c.json({
      error:
        "Template is not configured. Save the template first or click Restore Default.",
    }, 400);
  }

  const result = await sendMail({
    to: adminUser.email,
    subject: rendered.subject,
    html: rendered.html,
  });

  await writeAuditLog(
    admin.id,
    "test_sent_email_template",
    "EmailTemplate",
    0,
    {
      key,
      status: result.status,
      target: adminUser.email,
      ...(result.error ? { error: result.error } : {}),
    },
    { ctx: c },
  );

  return c.json({
    status: result.status,
    target: adminUser.email,
    ...(result.error ? { error: result.error } : {}),
  });
});

export default emailTemplatesRoutes;
