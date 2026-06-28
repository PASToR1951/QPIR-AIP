import { normalizeOptionalSchoolAbbreviation } from "./shared/schoolFields.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nexpected: ${expected}\nactual:   ${actual}`);
  }
}

Deno.test("school abbreviation normalization treats blank input as absent", () => {
  assertEquals(
    normalizeOptionalSchoolAbbreviation(""),
    null,
    "empty abbreviations should be stored as null",
  );
  assertEquals(
    normalizeOptionalSchoolAbbreviation("   "),
    null,
    "whitespace-only abbreviations should be stored as null",
  );
});

Deno.test("school abbreviation normalization trims real values", () => {
  assertEquals(
    normalizeOptionalSchoolAbbreviation("  GNAS  "),
    "GNAS",
    "real abbreviations should be trimmed",
  );
});
