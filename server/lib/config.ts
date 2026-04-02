// server/lib/config.ts
// Centralised environment-based configuration.
// Import from here instead of reading Deno.env directly in route files.

const _secret = Deno.env.get("JWT_SECRET");
if (!_secret) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start.");
  Deno.exit(1);
}
export const JWT_SECRET: string = _secret;
