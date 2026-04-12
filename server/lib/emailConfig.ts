import { prisma } from "../db/client.ts";

export const EMAIL_PASSWORD_MASK = "••••••••";
export const MIN_MAGIC_LINK_TTL_MINUTES = 5;
export const MAX_MAGIC_LINK_TTL_MINUTES = 30 * 24 * 60;

export type MagicLinkPurpose = "login" | "welcome" | "reminder";

export async function getOrCreateEmailConfig() {
  const existing = await prisma.emailConfig.findFirst({
    orderBy: { id: "asc" },
  });
  if (existing) return existing;
  return prisma.emailConfig.create({ data: {} });
}

export function toPublicEmailConfig(config: Awaited<ReturnType<typeof getOrCreateEmailConfig>>) {
  return {
    id: config.id,
    smtp_host: config.smtp_host,
    smtp_port: config.smtp_port,
    smtp_user: config.smtp_user,
    smtp_pass: config.smtp_pass_enc ? EMAIL_PASSWORD_MASK : "",
    has_password: Boolean(config.smtp_pass_enc),
    from_name: config.from_name,
    is_enabled: config.is_enabled,
    magic_link_ttl_login: config.magic_link_ttl_login,
    magic_link_ttl_welcome: config.magic_link_ttl_welcome,
    magic_link_ttl_reminder: config.magic_link_ttl_reminder,
    updated_at: config.updated_at,
  };
}

export function validateMagicLinkTtlMinutes(
  value: unknown,
  label: string,
): number {
  const minutes = Number(value);
  if (!Number.isInteger(minutes)) {
    throw new Error(`${label} TTL must be a whole number of minutes.`);
  }
  if (
    minutes < MIN_MAGIC_LINK_TTL_MINUTES ||
    minutes > MAX_MAGIC_LINK_TTL_MINUTES
  ) {
    throw new Error(
      `${label} TTL must be between ${MIN_MAGIC_LINK_TTL_MINUTES} minutes and ${MAX_MAGIC_LINK_TTL_MINUTES} minutes.`,
    );
  }
  return minutes;
}

export function getMagicLinkTtlMinutes(
  config: Awaited<ReturnType<typeof getOrCreateEmailConfig>>,
  purpose: MagicLinkPurpose,
): number {
  if (purpose === "welcome") return config.magic_link_ttl_welcome;
  if (purpose === "reminder") return config.magic_link_ttl_reminder;
  return config.magic_link_ttl_login;
}

export function isEmailConfigured(
  config: Awaited<ReturnType<typeof getOrCreateEmailConfig>>,
  options?: { ignoreDisabled?: boolean },
): boolean {
  return Boolean(
    (options?.ignoreDisabled || config.is_enabled) &&
      config.smtp_host?.trim() &&
      Number.isInteger(config.smtp_port) &&
      config.smtp_port > 0 &&
      config.smtp_user?.trim() &&
      config.smtp_pass_enc,
  );
}
