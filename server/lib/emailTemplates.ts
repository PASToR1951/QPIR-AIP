function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function emailShell(title: string, intro: string, body: string, accent = "#1d4ed8") {
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
                <div style="margin-top:8px;font-size:24px;font-weight:800;line-height:1.3;">${title}</div>
                <div style="margin-top:8px;font-size:14px;line-height:1.6;opacity:0.95;">${intro}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${body}
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

function primaryButton(url: string, label: string) {
  return `
    <div style="margin:24px 0 16px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;">
        ${escapeHtml(label)}
      </a>
    </div>
  `;
}

function secondaryLink(url: string, label: string) {
  return `<a href="${escapeHtml(url)}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">${escapeHtml(label)}</a>`;
}

function formatDeadline(deadline: Date) {
  return deadline.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function welcomeEmail(
  userName: string,
  role: string,
  affiliation: string,
  loginUrl: string,
  magicLinkUrl: string,
) {
  const safeUserName = escapeHtml(userName);
  const safeRole = escapeHtml(role);
  const safeAffiliation = escapeHtml(affiliation);

  return emailShell(
    "Your account is ready",
    `A portal account has been created for ${safeUserName}.`,
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Welcome to the AIP-PIR portal.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        Role: <strong>${safeRole}</strong><br />
        Affiliation: <strong>${safeAffiliation}</strong>
      </p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        Use the secure magic link below for a direct sign-in. You can also open the normal login page and sign in with your existing method.
      </p>
      ${primaryButton(magicLinkUrl, "Open My Account")}
      <p style="margin:0;font-size:14px;line-height:1.7;">
        Prefer the standard login page? ${secondaryLink(loginUrl, "Sign in here")}
      </p>
    `,
  );
}

export function portalOpenEmail(
  userName: string,
  periodType: "aip" | "pir",
  periodLabel: string,
  loginUrl: string,
  magicLinkUrl: string,
) {
  const title = periodType === "aip" ? "AIP submission period is now open" : "PIR submission period is now open";
  const readableType = periodType === "aip" ? "AIP" : "PIR";
  const safeUserName = escapeHtml(userName);
  const safeLabel = escapeHtml(periodLabel);

  return emailShell(
    title,
    `The portal is now open for ${readableType} ${safeLabel}.`,
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeUserName},</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        You may now access the portal and begin working on <strong>${readableType} ${safeLabel}</strong>.
      </p>
      ${primaryButton(magicLinkUrl, `Open ${readableType} Portal`)}
      <p style="margin:0;font-size:14px;line-height:1.7;">
        If you prefer the usual sign-in page, ${secondaryLink(loginUrl, "log in here")}.
      </p>
    `,
  );
}

export function deadlineReminderEmail(
  userName: string,
  quarterLabel: string,
  deadline: Date,
  daysLeft: number,
  loginUrl: string,
  magicLinkUrl: string,
) {
  const urgencyColor = daysLeft <= 3 ? "#dc2626" : "#d97706";
  const timingText = daysLeft === 0
    ? "The deadline is today."
    : daysLeft === 1
    ? "The deadline is tomorrow."
    : `${daysLeft} days remain before the deadline.`;
  const safeUserName = escapeHtml(userName);
  const safeQuarterLabel = escapeHtml(quarterLabel);

  return emailShell(
    `${safeQuarterLabel} reminder`,
    `${safeQuarterLabel} closes on ${formatDeadline(deadline)}.`,
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeUserName},</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
        This is a reminder that <strong>${safeQuarterLabel}</strong> will close on <strong>${formatDeadline(deadline)}</strong>.
      </p>
      <p style="margin:0 0 16px;padding:12px 14px;border-radius:12px;background:#fff7ed;color:${urgencyColor};font-size:14px;font-weight:700;line-height:1.6;">
        ${timingText}
      </p>
      ${primaryButton(magicLinkUrl, "Open PIR Submission")}
      <p style="margin:0;font-size:14px;line-height:1.7;">
        Standard sign-in is also available at ${secondaryLink(loginUrl, "the login page")}.
      </p>
    `,
    urgencyColor,
  );
}
