// Database-backed loader and renderer for admin-editable email templates.
//
// CONTRACT: a templated email send NEVER fails because of a template issue.
// Any DB lookup, parsing, or rendering error logs a WARN and the caller falls
// through to the hardcoded function in emailTemplates.ts.

import { prisma } from "../db/client.ts";
import {
  buildDeadlineReminderExtras,
  type RawTemplate,
  renderTemplate,
  type RenderedTemplate,
  wrapInShell,
} from "./emailTemplateRenderer.ts";
import {
  deadlineReminderEmail,
  portalOpenEmail,
  welcomeEmail,
} from "./emailTemplates.ts";
import { logger } from "./logger.ts";

export type TemplateKey =
  | "welcome"
  | "portal_open_aip"
  | "portal_open_pir"
  | "deadline_reminder";

export type EmailTemplateRow = {
  id: number;
  key: string;
  label: string;
  subject: string;
  title: string;
  intro: string;
  body_html: string;
  accent_color: string;
  updated_at: Date;
  updated_by: number | null;
};

export type RenderResult = {
  subject: string;
  html: string;
};

function rowToRaw(row: EmailTemplateRow): RawTemplate {
  return {
    key: row.key,
    subject: row.subject,
    title: row.title,
    intro: row.intro,
    body_html: row.body_html,
    accent_color: row.accent_color,
  };
}

export async function loadTemplate(
  key: string,
): Promise<EmailTemplateRow | null> {
  try {
    const row = await prisma.emailTemplate.findUnique({
      where: { key },
    });
    return row ?? null;
  } catch (error) {
    logger.warn("Email template DB lookup failed", {
      template_key: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function loadAllTemplates(): Promise<EmailTemplateRow[]> {
  const rows = await prisma.emailTemplate.findMany({
    orderBy: { key: "asc" },
  });
  return rows as EmailTemplateRow[];
}

// Renders a template from a preloaded row OR by loading it now. Returns null
// on any failure so the caller can fall back to the hardcoded function.
export async function renderTemplateByKey(
  key: TemplateKey,
  vars: Record<string, unknown>,
  preloaded?: EmailTemplateRow | null,
): Promise<RenderResult | null> {
  const row = preloaded ?? await loadTemplate(key);
  if (!row) return null;

  try {
    const rendered: RenderedTemplate = renderTemplate(rowToRaw(row), vars);
    const html = wrapInShell(rendered);
    if (!rendered.subject || !html) return null;
    return { subject: rendered.subject, html };
  } catch (error) {
    logger.warn("Email template render failed", {
      template_key: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// Fallback helpers — these wrap the original hardcoded functions so callers
// can pick a single rendering path. Each returns {subject, html}.

export function fallbackWelcome(args: {
  userName: string;
  role: string;
  affiliation: string;
  loginUrl: string;
  magicLinkUrl: string;
}): RenderResult {
  return {
    subject: "Your AIP-PIR account is ready",
    html: welcomeEmail(
      args.userName,
      args.role,
      args.affiliation,
      args.loginUrl,
      args.magicLinkUrl,
    ),
  };
}

export function fallbackPortalOpen(args: {
  userName: string;
  periodType: "aip" | "pir";
  periodLabel: string;
  loginUrl: string;
  magicLinkUrl: string;
}): RenderResult {
  const readableType = args.periodType === "aip" ? "AIP" : "PIR";
  return {
    subject: `${readableType} portal is open: ${args.periodLabel}`,
    html: portalOpenEmail(
      args.userName,
      args.periodType,
      args.periodLabel,
      args.loginUrl,
      args.magicLinkUrl,
    ),
  };
}

export function fallbackDeadlineReminder(args: {
  userName: string;
  quarterLabel: string;
  deadline: Date;
  daysLeft: number;
  loginUrl: string;
  magicLinkUrl: string;
}): RenderResult {
  const subject = args.daysLeft === 0
    ? `${args.quarterLabel} deadline is today`
    : args.daysLeft === 1
    ? `${args.quarterLabel} deadline is tomorrow`
    : `${args.quarterLabel} deadline in ${args.daysLeft} days`;
  return {
    subject,
    html: deadlineReminderEmail(
      args.userName,
      args.quarterLabel,
      args.deadline,
      args.daysLeft,
      args.loginUrl,
      args.magicLinkUrl,
    ),
  };
}

export { buildDeadlineReminderExtras };
