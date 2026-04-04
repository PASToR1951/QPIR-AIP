/** Parse a string to integer, returning fallback if invalid or out of optional bounds. */
export function safeParseInt(
  value: string | number | undefined | null,
  fallback: number,
  min?: number,
  max?: number
): number {
  if (value === undefined || value === null) return fallback;
  const parsed = parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return fallback;
  if (min !== undefined && parsed < min) return fallback;
  if (max !== undefined && parsed > max) return fallback;
  return parsed;
}
