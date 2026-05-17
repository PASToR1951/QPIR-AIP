import { prisma } from "../db/client.ts";
import { ALLOWED_ORIGIN } from "./config.ts";
import {
  buildDeadlineReminderExtras,
  type EmailTemplateRow,
  fallbackDeadlineReminder,
  fallbackPortalOpen,
  fallbackWelcome,
  renderTemplateByKey,
} from "./emailTemplateStore.ts";
import { logger } from "./logger.ts";
import { sendMail, type MailSendResult } from "./mailer.ts";
import { generateMagicLink } from "./magicLink.ts";

type EmailUser = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  deleted_at: Date | null;
  name: string | null;
  first_name: string | null;
  middle_initial: string | null;
  last_name: string | null;
  school: { id: number; name: string } | null;
};

function buildDisplayName(user: EmailUser) {
  if (user.role === "Division Personnel" && user.first_name && user.last_name) {
    const middleInitial = user.middle_initial ? ` ${user.middle_initial}.` : "";
    return `${user.first_name}${middleInitial} ${user.last_name}`;
  }
  if (user.role === "School") return user.school?.name ?? user.name ?? user.email;
  return user.name ?? user.email;
}

function buildAffiliation(user: EmailUser) {
  if (user.role === "School") return user.school?.name ?? "School";
  if (user.role === "Division Personnel") return "Division";
  if (user.role.startsWith("CES")) return "Curriculum Implementation Division";
  if (user.role === "Admin" || user.role === "Observer") return "Division Office";
  return user.role;
}

function getLoginUrl() {
  return `${ALLOWED_ORIGIN}/login`;
}

function getPortalRedirect(type: "aip" | "pir") {
  return type === "pir" ? "/pir" : "/aip";
}

async function getEmailUser(userId: number): Promise<EmailUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      is_active: true,
      deleted_at: true,
      name: true,
      first_name: true,
      middle_initial: true,
      last_name: true,
      school: { select: { id: true, name: true } },
    },
  }) as Promise<EmailUser | null>;
}

async function sendTemplatedEmail(
  userId: number,
  buildMail: (user: EmailUser) => Promise<{
    subject: string;
    html: string;
  }>,
): Promise<MailSendResult & { user_id: number; email?: string }> {
  const user = await getEmailUser(userId);
  if (!user || user.deleted_at || !user.is_active) {
    return {
      status: "skipped",
      error: "User is not eligible for email delivery.",
      user_id: userId,
    };
  }
  if (!user.email) {
    return {
      status: "skipped",
      error: "User has no email address.",
      user_id: userId,
    };
  }

  try {
    const mail = await buildMail(user);
    const result = await sendMail({
      to: user.email,
      subject: mail.subject,
      html: mail.html,
    });

    return {
      ...result,
      user_id: user.id,
      email: user.email,
    };
  } catch (error) {
    logger.error("Templated email build failed", { user_id: userId, error });
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Email generation failed.",
      user_id: userId,
      email: user.email,
    };
  }
}

export async function listEmailRecipients() {
  const users = await prisma.user.findMany({
    where: {
      is_active: true,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      first_name: true,
      middle_initial: true,
      last_name: true,
      school: { select: { id: true, name: true } },
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  const recipients = users.map((user) => {
    const normalized = {
      ...user,
      is_active: true,
      deleted_at: null,
    } as EmailUser;

    return {
      id: normalized.id,
      name: buildDisplayName(normalized),
      email: normalized.email,
      role: normalized.role,
      affiliation: buildAffiliation(normalized),
      school: normalized.school,
    };
  });

  const groups = Array.from(
    recipients.reduce((map, recipient) => {
      map.set(recipient.role, (map.get(recipient.role) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([role, count]) => ({ role, count }))
    .sort((left, right) => left.role.localeCompare(right.role));

  return {
    total: recipients.length,
    groups,
    recipients,
  };
}

export async function sendWelcomeEmail(
  userId: number,
  preloadedTemplate?: EmailTemplateRow | null,
) {
  return sendTemplatedEmail(userId, async (user) => {
    const magicLinkUrl = await generateMagicLink(user.id, "welcome");
    const displayName = buildDisplayName(user);
    const affiliation = buildAffiliation(user);
    const loginUrl = getLoginUrl();
    const vars = {
      userName: displayName,
      role: user.role,
      affiliation,
      loginUrl,
      magicLinkUrl,
    };
    const rendered = await renderTemplateByKey("welcome", vars, preloadedTemplate);
    if (rendered) return rendered;
    return fallbackWelcome({
      userName: displayName,
      role: user.role,
      affiliation,
      loginUrl,
      magicLinkUrl,
    });
  });
}

export async function sendPortalOpenNotification(
  userId: number,
  options: {
    type: "aip" | "pir";
    label: string;
  },
  preloadedTemplate?: EmailTemplateRow | null,
) {
  return sendTemplatedEmail(userId, async (user) => {
    const magicLinkUrl = await generateMagicLink(user.id, "login", {
      redirectPath: getPortalRedirect(options.type),
    });
    const displayName = buildDisplayName(user);
    const loginUrl = getLoginUrl();
    const templateKey = options.type === "aip" ? "portal_open_aip" : "portal_open_pir";
    const vars = {
      userName: displayName,
      periodLabel: options.label,
      loginUrl,
      magicLinkUrl,
    };
    const rendered = await renderTemplateByKey(templateKey, vars, preloadedTemplate);
    if (rendered) return rendered;
    return fallbackPortalOpen({
      userName: displayName,
      periodType: options.type,
      periodLabel: options.label,
      loginUrl,
      magicLinkUrl,
    });
  });
}

export async function sendDeadlineReminderNotification(
  userId: number,
  options: {
    quarterLabel: string;
    deadline: Date;
    daysLeft: number;
  },
  preloadedTemplate?: EmailTemplateRow | null,
) {
  return sendTemplatedEmail(userId, async (user) => {
    const magicLinkUrl = await generateMagicLink(user.id, "reminder", {
      redirectPath: "/pir",
    });
    const displayName = buildDisplayName(user);
    const loginUrl = getLoginUrl();
    const extras = buildDeadlineReminderExtras(options.daysLeft);
    const vars = {
      userName: displayName,
      quarterLabel: options.quarterLabel,
      deadline: options.deadline,
      deadlineIso: options.deadline.toISOString(),
      daysLeft: options.daysLeft,
      deadlinePhrase: extras.deadlinePhrase,
      deadlineSentence: extras.deadlineSentence,
      urgencyColor: extras.urgencyColor,
      loginUrl,
      magicLinkUrl,
    };
    const rendered = await renderTemplateByKey(
      "deadline_reminder",
      vars,
      preloadedTemplate,
    );
    if (rendered) return rendered;
    return fallbackDeadlineReminder({
      userName: displayName,
      quarterLabel: options.quarterLabel,
      deadline: options.deadline,
      daysLeft: options.daysLeft,
      loginUrl,
      magicLinkUrl,
    });
  });
}

export function buildBlastKey(type: "aip" | "pir", label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${type}_${slug || "general"}`;
}
