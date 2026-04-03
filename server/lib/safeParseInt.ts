/** Parse a string to integer, returning fallback if invalid. */
export function safeParseInt(value: string | undefined | null, fallback: number): number {
  if (value === undefined || value === null) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}