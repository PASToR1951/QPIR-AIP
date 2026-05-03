export const DEFAULT_ALLOWED_ORIGIN = "http://localhost:5173";

export function normalizeOrigin(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function parseAllowedOrigins(
  value: string | null | undefined,
  fallback = DEFAULT_ALLOWED_ORIGIN,
): string[] {
  const origins = (value || fallback)
    .split(",")
    .map((entry) => normalizeOrigin(entry.trim()))
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(origins));
}

export function getAllowedOrigins(
  value = Deno.env.get("ALLOWED_ORIGIN"),
): string[] {
  const origins = parseAllowedOrigins(value);
  return origins.length > 0 ? origins : [DEFAULT_ALLOWED_ORIGIN];
}

export function getPrimaryAllowedOrigin(
  value = Deno.env.get("ALLOWED_ORIGIN"),
): string {
  return getAllowedOrigins(value)[0] ?? DEFAULT_ALLOWED_ORIGIN;
}

export function isAllowedOrigin(
  value: string | null | undefined,
  allowedOrigins = getAllowedOrigins(),
): boolean {
  const origin = normalizeOrigin(value);
  return Boolean(origin && allowedOrigins.includes(origin));
}
