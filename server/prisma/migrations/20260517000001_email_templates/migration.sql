-- Admin-editable email templates. The 4 templates seeded here mirror the
-- hardcoded fallbacks in server/lib/emailTemplates.ts; on render failure the
-- store falls back to those functions so the mail pipeline never breaks.

CREATE TABLE IF NOT EXISTS "email_templates" (
  "id"           SERIAL PRIMARY KEY,
  "key"          TEXT NOT NULL,
  "label"        TEXT NOT NULL,
  "subject"      TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "intro"        TEXT NOT NULL,
  "body_html"    TEXT NOT NULL,
  "accent_color" TEXT NOT NULL DEFAULT '#1d4ed8',
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by"   INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_key_key"
  ON "email_templates"("key");

CREATE INDEX IF NOT EXISTS "email_templates_key_idx"
  ON "email_templates"("key");

INSERT INTO "email_templates" ("key","label","subject","title","intro","body_html","accent_color") VALUES
('welcome',
 'Welcome Email',
 'Your AIP-PIR account is ready',
 'Your account is ready',
 'A portal account has been created for {{userName}}.',
 $body$
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
    $body$,
 '#1d4ed8'),
('portal_open_aip',
 'Portal Open — AIP',
 'AIP portal is open: {{periodLabel}}',
 'AIP submission period is now open',
 'The portal is now open for AIP {{periodLabel}}.',
 $body$
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
    $body$,
 '#1d4ed8'),
('portal_open_pir',
 'Portal Open — PIR',
 'PIR portal is open: {{periodLabel}}',
 'PIR submission period is now open',
 'The portal is now open for PIR {{periodLabel}}.',
 $body$
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
    $body$,
 '#1d4ed8'),
('deadline_reminder',
 'Deadline Reminder',
 '{{quarterLabel}} deadline {{deadlinePhrase}}',
 '{{quarterLabel}} reminder',
 '{{quarterLabel}} closes on {{deadline}}.',
 $body$
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
    $body$,
 '#d97706')
ON CONFLICT ("key") DO NOTHING;
