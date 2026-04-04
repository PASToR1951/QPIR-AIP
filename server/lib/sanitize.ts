// Control character regex: null bytes, backspace, tab escapes, etc.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// HTML special characters that must be encoded to prevent XSS
const HTML_ENTITIES: [RegExp, string][] = [
  [/&/g, '&amp;'],
  [/</g, '&lt;'],
  [/>/g, '&gt;'],
  [/"/g, '&quot;'],
  [/'/g, '&#x27;'],
];

/** Strip control characters and HTML-encode special characters to prevent XSS. Returns empty string if not a string. */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  let cleaned = value.replace(CONTROL_CHARS, '');
  for (const [pattern, replacement] of HTML_ENTITIES) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
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
