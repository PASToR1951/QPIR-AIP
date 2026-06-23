import { canOwnPir } from "./shared/pirOwnership.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("canOwnPir allows the recorded submitter", () => {
  assertEquals(
    canOwnPir(
      { id: 10, role: "School", school_id: 3 },
      { created_by_user_id: 10, aip: { school_id: 3 } },
    ),
    true,
    "the submitting user should own the PIR",
  );
});

Deno.test("canOwnPir does not expose submitted PIRs to sibling school accounts", () => {
  assertEquals(
    canOwnPir(
      { id: 11, role: "School", school_id: 3 },
      { created_by_user_id: 10, aip: { school_id: 3 } },
    ),
    false,
    "a same-school account should not see submitter-private comments",
  );
});

Deno.test("canOwnPir keeps school fallback only for legacy PIRs without creator", () => {
  assertEquals(
    canOwnPir(
      { id: 11, role: "School", school_id: 3 },
      { created_by_user_id: null, aip: { school_id: 3 } },
    ),
    true,
    "legacy PIRs without created_by_user_id should still be reachable by school",
  );
});
