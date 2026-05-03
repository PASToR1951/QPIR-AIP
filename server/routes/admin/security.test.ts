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

Deno.test("purged Cluster Coordinator role cannot read PIRs", () => {
  const retiredRole = { role: "Cluster Coordinator" };

  assertEquals(
    canReadPirRecord(retiredRole, { aip: { school: { cluster_id: 7 } } }),
    false,
    "retired role should not be readable",
  );
});

Deno.test("admin-facing reviewer roles can read non-draft PIRs", () => {
  assertEquals(
    canReadPirRecord({ role: "CES-CID" }, { aip: { school: null } }),
    true,
    "CES-CID should be readable",
  );
  assertEquals(
    canReadPirRecord({ role: "School" }, { aip: { school: { cluster_id: 7 } } }),
    false,
    "submitter roles should not be readable through admin PIR access",
  );
});
