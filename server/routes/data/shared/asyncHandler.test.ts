import { Hono } from "hono";
import { ConflictError, HttpError } from "../../../lib/errors.ts";
import { asyncHandler } from "./asyncHandler.ts";
import type { DataRouteEnv } from "./types.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

function buildApp(error: unknown) {
  const app = new Hono<{ Variables: DataRouteEnv }>();
  app.get(
    "/boom",
    asyncHandler("test error", "fallback", async () => {
      throw error;
    }),
  );
  return app;
}

async function readJson(res: Response) {
  return await res.json() as Record<string, unknown>;
}

Deno.test("data asyncHandler maps HttpError status and code", async () => {
  const res = await buildApp(
    new HttpError(403, "Forbidden here", "FORBIDDEN"),
  ).request("http://localhost/boom");

  assertEquals(res.status, 403, "HttpError status should pass through");
  assertEquals(
    await readJson(res),
    { error: "Forbidden here", code: "FORBIDDEN" },
    "HttpError payload should expose expected error and code",
  );
});

Deno.test("data asyncHandler maps ConflictError to HTTP 409", async () => {
  const res = await buildApp(
    new ConflictError("Already exists", "ALREADY_EXISTS"),
  ).request("http://localhost/boom");

  assertEquals(res.status, 409, "ConflictError should return HTTP 409");
  assertEquals(
    await readJson(res),
    { error: "Already exists", code: "ALREADY_EXISTS" },
    "ConflictError payload should expose expected error and code",
  );
});

Deno.test("data asyncHandler maps known AIP/PIR P2002 errors to HTTP 409", async () => {
  const res = await buildApp({
    code: "P2002",
    meta: { target: ["aip_id", "quarter"] },
  }).request("http://localhost/boom");

  assertEquals(res.status, 409, "known uniqueness conflicts should be 409");
  assertEquals(
    await readJson(res),
    { error: "A record already exists for this request" },
    "known uniqueness conflicts should return the standard conflict message",
  );
});
