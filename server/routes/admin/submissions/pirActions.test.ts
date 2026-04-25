import { resolvePresentedValue } from "./presented.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("resolvePresentedValue applies explicit idempotent values", () => {
  assertEquals(
    resolvePresentedValue(false, true),
    true,
    "explicit true should mark presented",
  );
  assertEquals(
    resolvePresentedValue(true, true),
    true,
    "explicit true should be idempotent",
  );
  assertEquals(
    resolvePresentedValue(true, false),
    false,
    "explicit false should unmark presented",
  );
  assertEquals(
    resolvePresentedValue(false, false),
    false,
    "explicit false should be idempotent",
  );
});

Deno.test("resolvePresentedValue preserves legacy empty-body toggle behavior", () => {
  assertEquals(
    resolvePresentedValue(false, undefined),
    true,
    "missing value should toggle false to true",
  );
  assertEquals(
    resolvePresentedValue(true, undefined),
    false,
    "missing value should toggle true to false",
  );
});
