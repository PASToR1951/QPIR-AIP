// server/lib/config.ts
// Centralised environment-based configuration.
// Import from here instead of reading Deno.env directly in route files.

export const JWT_SECRET =
  Deno.env.get("JWT_SECRET") || "super-secret-default-key-change-me-in-production";
