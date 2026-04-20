const REMOVE_KEYS = new Set([
  "password",
  "password_hash",
  "current_password",
  "new_password",
  "currentpassword",
  "newpassword",
  "temporarypassword",
]);

const MASK_KEYS = new Set([
  "token",
  "refresh_token",
  "magic_link_token",
  "reset_token",
  "jwt",
  "session_token",
  "smtp_pass_enc",
  "secret",
  "authorization",
  "cookie",
  "recaptchatoken",
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s-]/g, "_");
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "[REDACTED]";
  return `***-***-${digits.slice(-4)}`;
}

function redactValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;

  const normalized = normalizeKey(key);
  if (normalized.includes("phone")) {
    return maskPhone(value);
  }
  if (MASK_KEYS.has(normalized)) {
    return "[REDACTED]";
  }
  return value;
}

export function redactDetails(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    const normalized = normalizeKey(key);
    if (REMOVE_KEYS.has(normalized)) continue;

    if (Array.isArray(raw)) {
      result[key] = raw.map((item) =>
        typeof item === "object" && item !== null
          ? redactDetails(item)
          : redactValue(key, item)
      );
      continue;
    }

    if (raw && typeof raw === "object") {
      result[key] = redactDetails(raw);
      continue;
    }

    result[key] = redactValue(key, raw);
  }

  return result;
}
