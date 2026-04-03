// Control character regex: null bytes, backspace, tab escapes, etc.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Strip control characters from a string value. Returns original if not a string. */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(CONTROL_CHARS, '');
}

/** Recursively sanitize an object, applying sanitization to all string values. */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj as unknown as T;
  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? sanitizeString(value) : sanitizeObject(value);
  }
  return result;
}