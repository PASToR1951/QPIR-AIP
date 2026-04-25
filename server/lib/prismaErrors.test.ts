import {
  getPrismaUniqueTarget,
  isKnownUniqueConflict,
  isPrismaUniqueConflict,
  isPrismaUniqueConflictWithoutTarget,
} from "./prismaErrors.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("Prisma unique conflict parsing accepts AIP/PIR field arrays", () => {
  const schoolAipError = {
    code: "P2002",
    meta: { target: ["school_id", "program_id", "year"] },
  };
  const divisionAipError = {
    code: "P2002",
    meta: { target: ["created_by_user_id", "program_id", "year"] },
  };
  const pirError = {
    code: "P2002",
    meta: { target: ["aip_id", "quarter"] },
  };

  assertEquals(
    getPrismaUniqueTarget(schoolAipError),
    "school_id,program_id,year",
    "field array targets should be serialized deterministically",
  );
  assertEquals(
    isKnownUniqueConflict(schoolAipError),
    true,
    "school AIP uniqueness should be known",
  );
  assertEquals(
    isKnownUniqueConflict(divisionAipError),
    true,
    "division AIP uniqueness should be known",
  );
  assertEquals(
    isKnownUniqueConflict(pirError),
    true,
    "PIR uniqueness should be known",
  );
});

Deno.test("Prisma unique conflict parsing accepts constraint and index names", () => {
  assertEquals(
    isKnownUniqueConflict({
      code: "P2002",
      meta: { target: "AIP_school_id_program_id_year_key" },
    }),
    true,
    "school AIP constraint names should be known",
  );
  assertEquals(
    isKnownUniqueConflict({
      code: "P2002",
      meta: { target: "AIP_div_personnel_unique_idx" },
    }),
    true,
    "division AIP partial index names should be known",
  );
  assertEquals(
    isKnownUniqueConflict({
      code: "P2002",
      meta: { target: "PIR_aip_id_quarter_key" },
    }),
    true,
    "PIR constraint names should be known",
  );
});

Deno.test("unknown Prisma errors are not treated as known AIP/PIR uniqueness conflicts", () => {
  assertEquals(
    isPrismaUniqueConflict({ code: "P2002", meta: { target: ["email"] } }),
    true,
    "P2002 should still be recognized as a Prisma uniqueness error",
  );
  assertEquals(
    isKnownUniqueConflict({ code: "P2002", meta: { target: ["email"] } }),
    false,
    "unrelated uniqueness conflicts should stay unknown",
  );
  assertEquals(
    isKnownUniqueConflict({ code: "P2025" }),
    false,
    "non-P2002 errors should stay unknown",
  );
});

Deno.test("targetless P2002 errors can be detected for route-local critical sections", () => {
  assertEquals(
    isPrismaUniqueConflictWithoutTarget({ code: "P2002", meta: {} }),
    true,
    "P2002 without usable target metadata should be detectable",
  );
  assertEquals(
    isPrismaUniqueConflictWithoutTarget({
      code: "P2002",
      meta: { target: ["aip_id", "quarter"] },
    }),
    false,
    "P2002 with usable target metadata should not be considered targetless",
  );
});
