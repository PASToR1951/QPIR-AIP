// Control character regex: null bytes, backspace, tab escapes, etc.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Strip control characters from a string. Returns empty string if not a string.
 *  HTML escaping for rendered output is handled by React at render time, so we
 *  intentionally do not HTML-entity-encode here — encoding on save corrupts
 *  text that legitimately contains `&`, `<`, `>`, `"`, or `'`. */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(CONTROL_CHARS, '');
}

/** Recursively strip control characters from all string values in an object/array. */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj as unknown as T;
  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? sanitizeString(value) : sanitizeObject(value);
  }
  return result;
}
