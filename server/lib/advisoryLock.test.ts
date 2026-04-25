import {
  aipResourceKey,
  aipResourceKeyFromRecord,
  normalizeLockPart,
  pirResourceKey,
  pirResourceKeyFromRecord,
} from "./advisoryLock.ts";
import type { TokenPayload } from "./auth.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

const user: TokenPayload = {
  id: 42,
  role: "Division Personnel",
  school_id: null,
};

Deno.test("aipResourceKey uses school ownership when a school id is present", () => {
  assertEquals(
    aipResourceKey(user, 7, 11, 2026),
    "aip:school:7:program:11:year:2026",
    "school-owned AIPs should lock by school/program/year",
  );
});

Deno.test("aipResourceKey uses creator ownership for division and CES AIPs", () => {
  assertEquals(
    aipResourceKey(user, null, 11, 2026),
    "aip:user:42:program:11:year:2026",
    "division-owned AIPs should lock by user/program/year",
  );
});

Deno.test("aipResourceKeyFromRecord mirrors the database uniqueness rules", () => {
  assertEquals(
    aipResourceKeyFromRecord({
      id: 1,
      school_id: 3,
      created_by_user_id: 42,
      program_id: 11,
      year: 2026,
    }),
    "aip:school:3:program:11:year:2026",
    "school id should take precedence over creator id",
  );
  assertEquals(
    aipResourceKeyFromRecord({
      id: 1,
      school_id: null,
      created_by_user_id: 42,
      program_id: 11,
      year: 2026,
    }),
    "aip:user:42:program:11:year:2026",
    "division-owned existing records should lock by creator/program/year",
  );
  assertEquals(
    aipResourceKeyFromRecord({
      id: 99,
      school_id: null,
      created_by_user_id: null,
      program_id: 11,
      year: 2026,
    }),
    "aip:id:99",
    "legacy rows with no ownership key should still have a stable lock",
  );
});

Deno.test("pirResourceKey normalizes quarter text before hashing", () => {
  assertEquals(
    normalizeLockPart("  1st   Quarter CY 2026  "),
    "1st quarter cy 2026",
    "quarter fragments should be trimmed, lowercased, and whitespace-normalized",
  );
  assertEquals(
    pirResourceKey(10, "  1st   Quarter CY 2026  "),
    "pir:aip:10:quarter:1st quarter cy 2026",
    "PIRs should lock by AIP and normalized quarter",
  );
  assertEquals(
    pirResourceKeyFromRecord({ aip_id: 10, quarter: "1st Quarter CY 2026" }),
    "pir:aip:10:quarter:1st quarter cy 2026",
    "record-derived PIR lock keys should use the same normalization",
  );
});
