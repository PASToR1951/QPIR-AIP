import { validateBackfillPeriodForRole } from "../../lib/pirBackfill.ts";

Deno.test("PIR backfill accepts only the immediately previous reporting year", () => {
  const now = new Date(2026, 5, 15);

  if (
    validateBackfillPeriodForRole(
      "Division Personnel",
      "1st Quarter CY 2025",
      now,
    ) !== null
  ) {
    throw new Error("Expected previous calendar year to be accepted");
  }

  if (
    validateBackfillPeriodForRole(
      "Division Personnel",
      "4th Quarter CY 2026",
      now,
    ) ===
      null
  ) {
    throw new Error("Expected current year to be rejected");
  }

  if (
    validateBackfillPeriodForRole(
      "Division Personnel",
      "1st Quarter CY 2024",
      now,
    ) ===
      null
  ) {
    throw new Error("Expected older historical year to be rejected");
  }

  if (
    validateBackfillPeriodForRole(
      "Division Personnel",
      "not a quarter",
      now,
    ) ===
      null
  ) {
    throw new Error("Expected malformed quarter label to be rejected");
  }
});

Deno.test("PIR backfill follows school reporting year defaults", () => {
  const beforeSchoolYearRollover = new Date(2026, 4, 15);
  const afterSchoolYearRollover = new Date(2026, 5, 15);

  if (
    validateBackfillPeriodForRole(
      "School",
      "2nd Quarter CY 2024",
      beforeSchoolYearRollover,
    ) !== null
  ) {
    throw new Error(
      "Expected previous school reporting year to be accepted before June",
    );
  }

  if (
    validateBackfillPeriodForRole(
      "School",
      "2nd Quarter CY 2025",
      afterSchoolYearRollover,
    ) !== null
  ) {
    throw new Error(
      "Expected previous school reporting year to be accepted after June",
    );
  }
});
