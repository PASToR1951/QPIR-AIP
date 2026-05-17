// Source-of-truth defaults for the 4 admin-editable email templates.
// These mirror the seed in the 20260517000001_email_templates migration; if you
// change one you must change the other. Used by the "Restore Default" endpoint
// so admins can revert to the shipped wording from the UI.

export type DefaultTemplate = {
  key: string;
  label: string;
  subject: string;
  title: string;
  intro: string;
  body_html: string;
  accent_color: string;
};

export const DEFAULT_EMAIL_TEMPLATES: Record<string, DefaultTemplate> = {
  welcome: {
    key: "welcome",
    label: "Welcome Email",
    subject: "Your AIP-PIR account is ready",
    title: "Your account is ready",
    intro: "A portal account has been created for {{userName}}.",
    body_html: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Welcome to the AIP-PIR portal.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        Role: <strong>{{role}}</strong><br />
        Affiliation: <strong>{{affiliation}}</strong>
      </p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        Use the secure magic link below for a direct sign-in. You can also open the normal login page and sign in with your existing method.
      </p>
      <div style="margin:24px 0 16px;">
        <a href="{{magicLinkUrl}}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;">
          Open My Account
        </a>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        Prefer the standard login page? <a href="{{loginUrl}}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">Sign in here</a>
      </p>
    `,
    accent_color: "#1d4ed8",
  },
  portal_open_aip: {
    key: "portal_open_aip",
    label: "Portal Open — AIP",
    subject: "AIP portal is open: {{periodLabel}}",
    title: "AIP submission period is now open",
    intro: "The portal is now open for AIP {{periodLabel}}.",
    body_html: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello {{userName}},</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        You may now access the portal and begin working on <strong>AIP {{periodLabel}}</strong>.
      </p>
      <div style="margin:24px 0 16px;">
        <a href="{{magicLinkUrl}}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;">
          Open AIP Portal
        </a>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        If you prefer the usual sign-in page, <a href="{{loginUrl}}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">log in here</a>.
      </p>
    `,
    accent_color: "#1d4ed8",
  },
  portal_open_pir: {
    key: "portal_open_pir",
    label: "Portal Open — PIR",
    subject: "PIR portal is open: {{periodLabel}}",
    title: "PIR submission period is now open",
    intro: "The portal is now open for PIR {{periodLabel}}.",
    body_html: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello {{userName}},</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        You may now access the portal and begin working on <strong>PIR {{periodLabel}}</strong>.
      </p>
      <div style="margin:24px 0 16px;">
        <a href="{{magicLinkUrl}}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;">
          Open PIR Portal
        </a>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        If you prefer the usual sign-in page, <a href="{{loginUrl}}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">log in here</a>.
      </p>
    `,
    accent_color: "#1d4ed8",
  },
  deadline_reminder: {
    key: "deadline_reminder",
    label: "Deadline Reminder",
    subject: "{{quarterLabel}} deadline {{deadlinePhrase}}",
    title: "{{quarterLabel}} reminder",
    intro: "{{quarterLabel}} closes on {{deadline}}.",
    body_html: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello {{userName}},</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        This is a reminder that <strong>{{quarterLabel}}</strong> will close on <strong>{{deadline}}</strong>.
      </p>
      <p style="margin:0 0 16px;padding:12px 14px;border-radius:12px;background:#fff7ed;color:{{urgencyColor}};font-size:14px;font-weight:700;line-height:1.6;">
        {{deadlineSentence}}
      </p>
      <div style="margin:24px 0 16px;">
        <a href="{{magicLinkUrl}}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;">
          Open PIR Submission
        </a>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        Standard sign-in is also available at <a href="{{loginUrl}}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">the login page</a>.
      </p>
    `,
    accent_color: "#d97706",
  },
};

export function getDefaultTemplate(key: string): DefaultTemplate | null {
  return DEFAULT_EMAIL_TEMPLATES[key] ?? null;
}
