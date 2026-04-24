import { Hono } from "hono";
import {
  isTrustedProxy,
  resolveClientIp,
  shouldBypassRecaptchaForPrivateIp,
} from "./clientIp.ts";
import { csrfProtection, isAllowedCookieOrigin } from "./csrf.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

function headers(values: Record<string, string | undefined>) {
  return (name: string) => values[name.toLowerCase()];
}

Deno.test("resolveClientIp ignores spoofed forwarded headers unless proxy is trusted", () => {
  const ip = resolveClientIp({
    remoteAddress: "203.0.113.10",
    headers: headers({ "x-forwarded-for": "127.0.0.1" }),
    trustProxy: false,
    trustedProxyCidrs: "203.0.113.0/24",
  });

  assertEquals(
    ip,
    "203.0.113.10",
    "untrusted requests should use remote address",
  );
});

Deno.test("resolveClientIp accepts forwarded headers only from trusted proxies", () => {
  const ip = resolveClientIp({
    remoteAddress: "10.0.0.8",
    headers: headers({ "x-forwarded-for": "198.51.100.22, 10.0.0.8" }),
    trustProxy: true,
    trustedProxyCidrs: "10.0.0.0/8",
  });

  assertEquals(
    ip,
    "198.51.100.22",
    "trusted proxy should expose the first forwarded client",
  );
  assert(
    isTrustedProxy("10.0.0.8", "10.0.0.0/8"),
    "trusted CIDR should match proxy",
  );
});

Deno.test("private IP reCAPTCHA bypass is disabled unless explicitly enabled", () => {
  assertEquals(
    shouldBypassRecaptchaForPrivateIp("127.0.0.1", false),
    false,
    "private addresses should not bypass by default",
  );
  assertEquals(
    shouldBypassRecaptchaForPrivateIp("127.0.0.1", true),
    true,
    "private bypass should require explicit opt-in",
  );
});

function buildCsrfApp() {
  Deno.env.set("ALLOWED_ORIGIN", "https://portal.example.test");
  const app = new Hono();
  app.use("*", csrfProtection());
  app.all("/thing", (c) => c.json({ ok: true }));
  return app;
}

async function csrfFetch(
  app: Hono,
  method: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  return await app.request("http://localhost/thing", { method, headers });
}

Deno.test("csrfProtection allows safe methods without any origin/referer", async () => {
  const app = buildCsrfApp();
  const res = await csrfFetch(app, "GET");
  assertEquals(res.status, 200, "GET should pass through");
});

Deno.test("csrfProtection allows unsafe method when no auth cookie present", async () => {
  const app = buildCsrfApp();
  const res = await csrfFetch(app, "POST", {
    origin: "https://evil.example.test",
  });
  assertEquals(
    res.status,
    200,
    "unauthenticated requests should bypass CSRF check",
  );
});

Deno.test("csrfProtection rejects unsafe method with mismatched origin when cookie is present", async () => {
  const app = buildCsrfApp();
  const res = await csrfFetch(app, "POST", {
    cookie: "token=abc123",
    origin: "https://evil.example.test",
  });
  assertEquals(res.status, 403, "foreign origin should be rejected");
});

Deno.test("csrfProtection accepts unsafe method with matching origin", async () => {
  const app = buildCsrfApp();
  const res = await csrfFetch(app, "POST", {
    cookie: "token=abc123",
    origin: "https://portal.example.test",
  });
  assertEquals(res.status, 200, "matching origin should pass");
});

Deno.test("csrfProtection rejects unsafe method when origin and referer are missing", async () => {
  const app = buildCsrfApp();
  const res = await csrfFetch(app, "POST", { cookie: "token=abc123" });
  assertEquals(
    res.status,
    403,
    "missing origin/referer with cookie should reject",
  );
});

Deno.test("csrfProtection rejects malformed origin header", async () => {
  const app = buildCsrfApp();
  const res = await csrfFetch(app, "POST", {
    cookie: "token=abc123",
    origin: "not-a-url",
  });
  assertEquals(res.status, 403, "malformed origin should reject");
});

Deno.test("cookie CSRF origin checks accept only the configured frontend origin", () => {
  assertEquals(
    isAllowedCookieOrigin(
      "https://portal.example.test",
      null,
      "https://portal.example.test",
    ),
    true,
    "matching origin should pass",
  );
  assertEquals(
    isAllowedCookieOrigin(
      null,
      "https://portal.example.test/admin",
      "https://portal.example.test",
    ),
    true,
    "matching referer should pass when origin is absent",
  );
  assertEquals(
    isAllowedCookieOrigin(
      "https://evil.example.test",
      null,
      "https://portal.example.test",
    ),
    false,
    "foreign origin should fail",
  );
});
