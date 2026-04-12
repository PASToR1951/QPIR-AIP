import { safeParseInt } from "../../../lib/safeParseInt.ts";
import type {
  ActivityInput,
  ActivityReviewInput,
  FactorMapInput,
  IndicatorInput,
} from "./types.ts";

export function normalizeBudgetSource(
  amount: number,
  source: string | null | undefined,
): string {
  const empty = !source ||
    ["none", "n/a", "0", ""].includes(source.trim().toLowerCase());
  return amount === 0 && empty ? "NONE" : (source?.trim() || "NONE");
}

export function normalizeIndicators(
  indicators: IndicatorInput[] | null | undefined,
): Array<{ description: string; target: string }> {
  const source = Array.isArray(indicators) ? indicators : [];
  return source.map((ind) => ({
    description: ind.description || "",
    target: ind.target?.toString().trim() || "",
  }));
}

export function serializeIndicators(
  indicators: IndicatorInput[] | null | undefined,
): Array<{ description: string; target: string }> {
  const source = Array.isArray(indicators) ? indicators : [];
  return source.map((ind) => ({
    description: ind.description || "",
    target: ind.target?.toString().trim() === "NONE"
      ? ""
      : (ind.target?.toString().trim() || ""),
  }));
}

export function validateBudgetAmount(raw: unknown): number {
  const amount = parseFloat(String(raw ?? 0));
  if (Number.isNaN(amount) || amount < 0 || amount > 999_999_999_999) {
    throw new Error(
      "Invalid budget amount: must be a non-negative number not exceeding 999,999,999,999",
    );
  }
  return amount;
}

export function transformAIPActivities(
  activities: ActivityInput[] | null | undefined,
) {
  return (activities || []).map((act) => {
    const amount = validateBudgetAmount(act.budgetAmount);
    return {
      phase: act.phase || "",
      activity_name: act.name || "",
      implementation_period: act.period || "",
      period_start_month: act.periodStartMonth
        ? safeParseInt(act.periodStartMonth, 0, 1, 12)
        : null,
      period_end_month: act.periodEndMonth
        ? safeParseInt(act.periodEndMonth, 0, 1, 12)
        : null,
      persons_involved: act.persons || "",
      outputs: act.outputs || "",
      budget_amount: amount,
      budget_source: normalizeBudgetSource(amount, act.budgetSource),
    };
  });
}

export function transformFactors(factors: FactorMapInput | null | undefined) {
  return Object.entries(factors || {}).map(([type, data]) => ({
    factor_type: type,
    facilitating_factors: data.facilitating ?? "",
    hindering_factors: data.hindering ?? "",
    recommendations: data.recommendations ?? "",
  }));
}

export function transformActivityReviews(
  activityReviews: ActivityReviewInput[] | null | undefined,
) {
  return (activityReviews || []).map((rev) => ({
    aip_activity_id: rev.aip_activity_id
      ? safeParseInt(rev.aip_activity_id, 0)
      : null,
    complied: rev.complied ?? null,
    actual_tasks_conducted: rev.actual_tasks_conducted ?? "",
    contributory_performance_indicators:
      rev.contributory_performance_indicators ?? "",
    movs_expected_outputs: rev.movs_expected_outputs ?? "",
    adjustments: rev.adjustments ?? "",
    is_unplanned: rev.is_unplanned ?? false,
    physical_target: parseFloat(String(rev.physTarget || 0)),
    financial_target: parseFloat(String(rev.finTarget || 0)),
    physical_accomplished: parseFloat(String(rev.physAcc || 0)),
    financial_accomplished: parseFloat(String(rev.finAcc || 0)),
    actions_to_address_gap: rev.actions ?? "",
  }));
}
