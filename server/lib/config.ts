// server/lib/config.ts
// Centralised environment-based configuration.
// Import from here instead of reading Deno.env directly in route files.

const _secret = Deno.env.get("JWT_SECRET");
if (!_secret) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start.");
  Deno.exit(1);
}
export const JWT_SECRET: string = _secret;

const _emailConfigSecret = Deno.env.get("EMAIL_CONFIG_SECRET");
if (!_emailConfigSecret) {
  console.error(
    "FATAL: EMAIL_CONFIG_SECRET environment variable is not set. Refusing to start.",
  );
  Deno.exit(1);
}
export const EMAIL_CONFIG_SECRET: string = _emailConfigSecret;

export const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173";
export const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY") || "";
