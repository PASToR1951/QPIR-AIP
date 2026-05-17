// Pure functions for admin-editable email templates.
// - HTML body is admin-authored (trusted; gated by adminOnly route).
// - Variable values substituted into the body are NOT trusted — HTML-escaped first.
// - Subjects are text; CRLF stripped to prevent SMTP header injection.
// - Unknown {{tokens}} are left literal so admin notices typos in preview.

export type TemplateVarType = "string" | "url" | "date" | "number";

export type TemplateVarDef = {
  name: string;
  type: TemplateVarType;
  description: string;
};

export type TemplateDefinition = {
  key: string;
  label: string;
  description: string;
  variables: TemplateVarDef[];
  sampleValues: Record<string, unknown>;
};

const TOKEN_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const URL_SAMPLE_LOGIN = "https://example.com/login";
const URL_SAMPLE_MAGIC = "https://example.com/login?magic=preview-token";
const DATE_SAMPLE = new Date("2026-05-20T15:59:59.000Z");

export const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
  welcome: {
    key: "welcome",
    label: "Welcome Email",
    description:
      "Sent when an admin creates a new account. Includes a magic link for first-time sign-in.",
    variables: [
      { name: "userName", type: "string", description: "Recipient display name." },
      { name: "role", type: "string", description: "Recipient role label." },
      {
        name: "affiliation",
        type: "string",
        description: "Recipient affiliation (school, division, etc.).",
      },
      { name: "loginUrl", type: "url", description: "Standard sign-in URL." },
      {
        name: "magicLinkUrl",
        type: "url",
        description: "One-time magic link for direct sign-in.",
      },
    ],
    sampleValues: {
      userName: "Maria Santos",
      role: "School",
      affiliation: "Sample Elementary School",
      loginUrl: URL_SAMPLE_LOGIN,
      magicLinkUrl: URL_SAMPLE_MAGIC,
    },
  },
  portal_open_aip: {
    key: "portal_open_aip",
    label: "Portal Open — AIP",
    description:
      "Sent when admin broadcasts that the AIP submission window is open.",
    variables: [
      { name: "userName", type: "string", description: "Recipient display name." },
      {
        name: "periodLabel",
        type: "string",
        description: "Period label, e.g. \"2027\".",
      },
      { name: "loginUrl", type: "url", description: "Standard sign-in URL." },
      {
        name: "magicLinkUrl",
        type: "url",
        description: "Magic link that lands on the AIP portal.",
      },
    ],
    sampleValues: {
      userName: "Maria Santos",
      periodLabel: "2027",
      loginUrl: URL_SAMPLE_LOGIN,
      magicLinkUrl: URL_SAMPLE_MAGIC,
    },
  },
  portal_open_pir: {
    key: "portal_open_pir",
    label: "Portal Open — PIR",
    description:
      "Sent when admin broadcasts that the PIR submission window is open.",
    variables: [
      { name: "userName", type: "string", description: "Recipient display name." },
      {
        name: "periodLabel",
        type: "string",
        description: "Period label, e.g. \"2nd Quarter CY 2026\".",
      },
      { name: "loginUrl", type: "url", description: "Standard sign-in URL." },
      {
        name: "magicLinkUrl",
        type: "url",
        description: "Magic link that lands on the PIR portal.",
      },
    ],
    sampleValues: {
      userName: "Maria Santos",
      periodLabel: "2nd Quarter CY 2026",
      loginUrl: URL_SAMPLE_LOGIN,
      magicLinkUrl: URL_SAMPLE_MAGIC,
    },
  },
  deadline_reminder: {
    key: "deadline_reminder",
    label: "Deadline Reminder",
    description:
      "Sent on the deadline-reminder schedule (14/7/3/1/0 days before close).",
    variables: [
      { name: "userName", type: "string", description: "Recipient display name." },
      {
        name: "quarterLabel",
        type: "string",
        description: "Reporting period label.",
      },
      { name: "deadline", type: "date", description: "Formatted deadline date." },
      { name: "deadlineIso", type: "string", description: "ISO deadline string." },
      { name: "daysLeft", type: "number", description: "Days remaining (0 = today)." },
      {
        name: "deadlinePhrase",
        type: "string",
        description:
          "Pre-computed phrase: \"is today\" / \"is tomorrow\" / \"is in N days\".",
      },
      {
        name: "deadlineSentence",
        type: "string",
        description:
          "Pre-computed sentence for the body urgency box.",
      },
      {
        name: "urgencyColor",
        type: "string",
        description:
          "Pre-computed hex color (red if ≤3 days, amber otherwise). Safe to use in style attributes.",
      },
      { name: "loginUrl", type: "url", description: "Standard sign-in URL." },
      {
        name: "magicLinkUrl",
        type: "url",
        description: "Magic link that lands on the PIR submission.",
      },
    ],
    sampleValues: {
      userName: "Maria Santos",
      quarterLabel: "2nd Quarter CY 2026",
      deadline: DATE_SAMPLE,
      deadlineIso: DATE_SAMPLE.toISOString(),
      daysLeft: 3,
      deadlinePhrase: "is in 3 days",
      deadlineSentence: "3 days remain before the deadline.",
      urgencyColor: "#dc2626",
      loginUrl: URL_SAMPLE_LOGIN,
      magicLinkUrl: URL_SAMPLE_MAGIC,
    },
  },
};

export function listAllowedTokens(key: string): Set<string> {
  const def = TEMPLATE_DEFINITIONS[key];
  if (!def) return new Set();
  return new Set(def.variables.map((variable) => variable.name));
}

export function extractTokens(text: string): string[] {
  if (typeof text !== "string") return [];
  const out = new Set<string>();
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    out.add(match[1]);
  }
  return [...out];
}

export function findUnknownTokens(
  text: string,
  allowed: Set<string>,
): string[] {
  return extractTokens(text).filter((name) => !allowed.has(name));
}

export function validateAccentColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function formatVarForHtml(
  value: unknown,
  type: TemplateVarType,
): string {
  if (value === null || value === undefined) return "";
  if (type === "date") {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    return escapeHtml(
      date.toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }
  if (type === "number") return escapeHtml(String(value));
  if (type === "url") return escapeHtml(String(value));
  return escapeHtml(String(value));
}

export function formatVarForText(
  value: unknown,
  type: TemplateVarType,
): string {
  if (value === null || value === undefined) return "";
  if (type === "date") {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return String(value);
}

// Substitution uses String#replace with a function callback. Each match is
// evaluated against the original template, so a value containing "{{x}}"
// cannot become a second match. Unknown tokens render literally (typo signal).
function substitute(
  template: string,
  values: Record<string, string>,
): string {
  if (typeof template !== "string") return "";
  return template.replace(TOKEN_REGEX, (raw, name: string) => {
    if (Object.prototype.hasOwnProperty.call(values, name)) {
      return values[name];
    }
    return raw;
  });
}

function buildEscapedValueMap(
  vars: Record<string, unknown>,
  defs: TemplateVarDef[],
  formatter: (value: unknown, type: TemplateVarType) => string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const def of defs) {
    if (Object.prototype.hasOwnProperty.call(vars, def.name)) {
      out[def.name] = formatter(vars[def.name], def.type);
    }
  }
  return out;
}

function stripCrlf(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export type RenderedTemplate = {
  subject: string;
  title: string;
  intro: string;
  body_html: string;
  accent_color: string;
};

export type RawTemplate = {
  key: string;
  subject: string;
  title: string;
  intro: string;
  body_html: string;
  accent_color: string;
};

// Renders subject/title/intro/body using the per-key variable allowlist.
// Accent color is regex-validated; falls back to default if invalid.
//
// Field treatment:
// - subject: text destination (SMTP header). Variables substituted unescaped;
//   CRLF stripped at the end to prevent header injection.
// - title / intro: plain-text content rendered into HTML. We escape the
//   admin-stored template first (so any literal HTML the admin pasted becomes
//   visible text rather than executable markup), then substitute already
//   HTML-escaped variable values into it.
// - body_html: trusted HTML (admin-only route). Variables substituted with
//   HTML-escaped values; template HTML preserved verbatim.
export function renderTemplate(
  template: RawTemplate,
  vars: Record<string, unknown>,
): RenderedTemplate {
  const def = TEMPLATE_DEFINITIONS[template.key];
  if (!def) {
    throw new Error(`Unknown template key: ${template.key}`);
  }
  const htmlValues = buildEscapedValueMap(vars, def.variables, formatVarForHtml);
  const textValues = buildEscapedValueMap(vars, def.variables, formatVarForText);

  let accentColor = validateAccentColor(template.accent_color)
    ? template.accent_color
    : "#1d4ed8";
  // For deadline_reminder the shell accent follows urgency so the email's
  // overall color matches the message tone (red ≤3 days, amber otherwise).
  // Mirrors the original hardcoded deadlineReminderEmail() behavior.
  if (
    template.key === "deadline_reminder" &&
    typeof textValues.urgencyColor === "string" &&
    validateAccentColor(textValues.urgencyColor)
  ) {
    accentColor = textValues.urgencyColor;
  }

  return {
    subject: stripCrlf(substitute(template.subject, textValues)),
    title: substitute(escapeHtml(template.title), htmlValues),
    intro: substitute(escapeHtml(template.intro), htmlValues),
    body_html: substitute(template.body_html, htmlValues),
    accent_color: accentColor,
  };
}

// Wraps the rendered title/intro/body in the shared branded shell.
// The shell stays in code so admin edits cannot break HTML scaffold.
export function wrapInShell(rendered: RenderedTemplate): string {
  const accent = rendered.accent_color;
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:24px 28px;background:${accent};color:#ffffff;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">AIP-PIR System</div>
                <div style="margin-top:8px;font-size:24px;font-weight:800;line-height:1.3;">${rendered.title}</div>
                <div style="margin-top:8px;font-size:14px;line-height:1.6;opacity:0.95;">${rendered.intro}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${rendered.body_html}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b;background:#f8fafc;">
                This email was sent by the AIP-PIR System. Do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Pre-computes the conditional pieces for the deadline reminder template
// so the admin can use {{deadlinePhrase}}, {{deadlineSentence}}, {{urgencyColor}}
// without writing branching logic.
export function buildDeadlineReminderExtras(daysLeft: number): {
  deadlinePhrase: string;
  deadlineSentence: string;
  urgencyColor: string;
} {
  const safeDays = Number.isFinite(daysLeft) ? Math.max(0, Math.round(daysLeft)) : 0;
  // Note: 0/1 use "is today"/"is tomorrow"; N uses "in N days" without "is"
  // to match the original wording in the hardcoded subject template.
  const deadlinePhrase = safeDays === 0
    ? "is today"
    : safeDays === 1
    ? "is tomorrow"
    : `in ${safeDays} days`;
  const deadlineSentence = safeDays === 0
    ? "The deadline is today."
    : safeDays === 1
    ? "The deadline is tomorrow."
    : `${safeDays} days remain before the deadline.`;
  const urgencyColor = safeDays <= 3 ? "#dc2626" : "#d97706";
  return { deadlinePhrase, deadlineSentence, urgencyColor };
}
