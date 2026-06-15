import { parseQuarterLabel } from "./quarters.ts";
import { getDefaultReportingYear } from "./trimesters.ts";

export function validateBackfillPeriodForRole(
  role: string,
  periodLabel: string,
  date = new Date(),
): string | null {
  const parsed = parseQuarterLabel(periodLabel);
  if (!parsed) return "Invalid backfill reporting period.";

  const previousYear = getDefaultReportingYear(role, date) - 1;
  if (parsed.year !== previousYear) {
    return "Backfill submissions are allowed only for the previous reporting year.";
  }

  return null;
}
