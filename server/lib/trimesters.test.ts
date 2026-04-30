import {
  activityOverlapsTrimester,
  getDefaultReportingYear,
  getSchoolYearStart,
  getTrimesterLabel,
  normalizeTrimesterLabel,
  parseTrimesterLabel,
} from "./trimesters.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("normalizeTrimesterLabel canonicalizes school trimester labels", () => {
  assertEquals(
    normalizeTrimesterLabel("  1ST   TRIMESTER   CY   2026  "),
    "1st Trimester CY 2026",
    "trimester labels should be stored in canonical display form",
  );
  assertEquals(
    normalizeTrimesterLabel("t3 cy 2026"),
    "3rd Trimester CY 2026",
    "short trimester labels should map to canonical display form",
  );
});

Deno.test("parseTrimesterLabel extracts year and trimester", () => {
  assertEquals(
    parseTrimesterLabel("2nd Trimester CY 2026"),
    { trimester: 2, year: 2026 },
    "canonical trimester labels should parse",
  );
  assertEquals(
    parseTrimesterLabel("1st Quarter CY 2026"),
    null,
    "quarter labels should not be parsed as trimesters",
  );
});

Deno.test("getSchoolYearStart maps Jan-May to previous calendar year", () => {
  assertEquals(
    getSchoolYearStart(new Date(2027, 0, 15)),
    2026,
    "January belongs to the school year that started the previous calendar year",
  );
  assertEquals(
    getSchoolYearStart(new Date(2026, 5, 8)),
    2026,
    "June starts the current school year",
  );
});

Deno.test("getDefaultReportingYear uses school year only for school role", () => {
  const april = new Date(2027, 3, 30);
  assertEquals(
    getDefaultReportingYear("School", april),
    2026,
    "school users should default to the school year start",
  );
  assertEquals(
    getDefaultReportingYear("Division Personnel", april),
    2027,
    "division users should default to calendar year",
  );
});

Deno.test("activityOverlapsTrimester uses school-calendar month ranges", () => {
  assertEquals(
    activityOverlapsTrimester(8, 10, 1),
    true,
    "Aug-Oct activities overlap T1",
  );
  assertEquals(
    activityOverlapsTrimester(10, 12, 1),
    false,
    "Oct-Dec activities do not overlap T1",
  );
  assertEquals(
    activityOverlapsTrimester(1, 3, 3),
    true,
    "Jan-Mar activities overlap T3",
  );
});

Deno.test("getTrimesterLabel formats school-year labels", () => {
  assertEquals(
    getTrimesterLabel(3, 2026),
    "3rd Trimester CY 2026",
    "T3 keeps the school year start in its label",
  );
});
