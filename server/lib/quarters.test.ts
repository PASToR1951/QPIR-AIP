import { normalizeQuarterLabel, parseQuarterLabel } from "./quarters.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("normalizeQuarterLabel canonicalizes quarter casing and whitespace", () => {
  assertEquals(
    normalizeQuarterLabel("  1ST   QUARTER   CY   2026  "),
    "1st Quarter CY 2026",
    "quarter labels should be stored and queried in canonical display form",
  );
  assertEquals(
    normalizeQuarterLabel("2nd quarter cy 2025"),
    "2nd Quarter CY 2025",
    "already recognizable quarter labels should be recased",
  );
});

Deno.test("normalizeQuarterLabel accepts short Qn CY yyyy labels", () => {
  assertEquals(
    normalizeQuarterLabel("Q3 CY 2027"),
    "3rd Quarter CY 2027",
    "short quarter labels should map to the canonical PIR label",
  );
});

Deno.test("normalizeQuarterLabel leaves unrecognized labels trimmed only", () => {
  assertEquals(
    normalizeQuarterLabel("  Special Quarter  "),
    "Special Quarter",
    "unexpected quarter labels should not be lowercased or otherwise rewritten",
  );
});

Deno.test("parseQuarterLabel extracts canonical and short quarter labels", () => {
  assertEquals(
    parseQuarterLabel("  4TH   QUARTER   CY 2026 "),
    { quarter: 4, year: 2026 },
    "canonical quarter labels should parse independent of casing and spacing",
  );
  assertEquals(
    parseQuarterLabel("Q2 CY 2027"),
    { quarter: 2, year: 2027 },
    "short quarter labels should parse",
  );
});

Deno.test("parseQuarterLabel rejects non-quarter period labels", () => {
  assertEquals(
    parseQuarterLabel("1st Trimester CY 2026"),
    null,
    "trimester labels should not be parsed as quarters",
  );
});
