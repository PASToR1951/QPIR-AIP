import { canUpdateObserverNotes } from "./shared/observerAccess.ts";
import { canReadPirRecord } from "./shared/pirAccess.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("Cluster Coordinators can read only PIRs from their own cluster", () => {
  const coordinator = { role: "Cluster Coordinator", cluster_id: 7 };

  assertEquals(
    canReadPirRecord(coordinator, { aip: { school: { cluster_id: 7 } } }),
    true,
    "matching cluster should be readable",
  );
  assertEquals(
    canReadPirRecord(coordinator, { aip: { school: { cluster_id: 8 } } }),
    false,
    "different cluster should be forbidden",
  );
  assertEquals(
    canReadPirRecord(coordinator, { aip: { school: null } }),
    false,
    "division-owned PIRs should not be readable through cluster coordinator scope",
  );
});

Deno.test("Observer notes writes are Observer-only", () => {
  assertEquals(
    canUpdateObserverNotes({ role: "Observer" }),
    true,
    "Observer is the author of observer notes",
  );
  assertEquals(
    canUpdateObserverNotes({ role: "Admin" }),
    false,
    "Admin reads observer notes but does not write them",
  );
  assertEquals(
    canUpdateObserverNotes({ role: "School" }),
    false,
    "other roles must be rejected",
  );
});
