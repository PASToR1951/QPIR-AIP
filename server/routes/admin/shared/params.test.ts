import { buildPirQuarterFilter, parseSubmissionQuarter } from "./params.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("parseSubmissionQuarter accepts timeline and label values", () => {
  assertEquals(
    parseSubmissionQuarter("2"),
    2,
    "numeric timeline quarter should parse",
  );
  assertEquals(
    parseSubmissionQuarter("Q3"),
    3,
    "compact Q label should parse",
  );
  assertEquals(
    parseSubmissionQuarter("4th Quarter CY 2025"),
    4,
    "canonical PIR label should parse",
  );
  assertEquals(
    parseSubmissionQuarter("all"),
    undefined,
    "all should leave the quarter unfiltered",
  );
});

Deno.test("buildPirQuarterFilter maps timeline quarter to PIR labels", () => {
  assertEquals(
    buildPirQuarterFilter("2", 2025),
    { equals: "2nd Quarter CY 2025" },
    "year-scoped timeline quarter should become an exact PIR label",
  );
  assertEquals(
    buildPirQuarterFilter("2nd", undefined),
    { startsWith: "2nd Quarter" },
    "quarter-only filter should match the ordinal quarter across years",
  );
});
