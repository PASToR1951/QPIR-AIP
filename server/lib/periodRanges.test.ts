import {
  activityOverlapsMonthRange,
  getDefaultQuarterRange,
  getDefaultTrimesterRange,
  isValidMonthRange,
  resolveMonthRange,
} from "./periodRanges.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("default reporting ranges preserve existing quarter and trimester coverage", () => {
  assertEquals(
    getDefaultQuarterRange(2),
    { start: 4, end: 6 },
    "Q2 should default to Apr-Jun",
  );
  assertEquals(
    getDefaultTrimesterRange(3),
    { start: 1, end: 4 },
    "T3 should default to Jan-Apr",
  );
});

Deno.test("resolveMonthRange uses valid custom coverage and falls back for bad data", () => {
  assertEquals(
    resolveMonthRange(2, 5, { start: 1, end: 3 }),
    { start: 2, end: 5 },
    "valid admin-configured ranges should be used",
  );
  assertEquals(
    resolveMonthRange(8, 4, { start: 7, end: 9 }),
    { start: 7, end: 9 },
    "inverted month ranges should fall back to the default range",
  );
});

Deno.test("isValidMonthRange requires 1-12 months in ascending order", () => {
  assertEquals(isValidMonthRange(1, 12), true, "Jan-Dec should be valid");
  assertEquals(isValidMonthRange(0, 12), false, "month 0 should be invalid");
  assertEquals(
    isValidMonthRange(10, 9),
    false,
    "start after end should be invalid",
  );
});

Deno.test("activityOverlapsMonthRange filters activities against custom coverage", () => {
  assertEquals(
    activityOverlapsMonthRange(5, 7, { start: 6, end: 8 }),
    true,
    "May-Jul activity overlaps Jun-Aug coverage",
  );
  assertEquals(
    activityOverlapsMonthRange(1, 3, { start: 6, end: 8 }),
    false,
    "Jan-Mar activity does not overlap Jun-Aug coverage",
  );
});
