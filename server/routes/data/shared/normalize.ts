import { safeParseInt } from "../../../lib/safeParseInt.ts";
import type {
  ActivityInput,
  ActivityReviewInput,
  FactorInput,
  FactorMapInput,
  IndicatorInput,
} from "./types.ts";

const ACTIVITY_FACTOR_MARKER = "__pirActivityFactorsV1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isActivityFactorEntry(value: unknown): value is {
  facilitating?: unknown;
  hindering?: unknown;
} {
  return isRecord(value) &&
    ("facilitating" in value || "hindering" in value);
}

function isActivityFactorMap(data: FactorInput): boolean {
  const hasLegacyKeys = ["facilitating", "hindering", "recommendations"].some(
    (key) => Object.prototype.hasOwnProperty.call(data, key),
  );
  if (!hasLegacyKeys) return true;

  return Object.entries(data).some(([key, value]) =>
    !["facilitating", "hindering", "recommendations"].includes(key) &&
    isActivityFactorEntry(value)
  );
}

function encodeActivityFactorCategory(
  data: FactorInput,
  category: "facilitating" | "hindering",
): string {
  const values = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => isActivityFactorEntry(value))
      .map(([activityId, value]) => [
        activityId,
        String((value as Record<string, unknown>)[category] ?? ""),
      ]),
  );

  return JSON.stringify({
    [ACTIVITY_FACTOR_MARKER]: true,
    values,
  });
}

function decodeActivityFactorCategory(value: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(value);
    if (!isRecord(parsed) || parsed[ACTIVITY_FACTOR_MARKER] !== true) {
      return null;
    }
    if (!isRecord(parsed.values)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed.values).map(([activityId, entry]) => [
        activityId,
        String(entry ?? ""),
      ]),
    );
  } catch {
    return null;
  }
}

export function storedFactorFieldHasContent(value: string | null | undefined): boolean {
  const text = value ?? "";
  const decoded = decodeActivityFactorCategory(text);
  if (decoded) {
    return Object.values(decoded).some((entry) => entry.trim().length > 0);
  }
  return text.trim().length > 0;
}

export function factorFieldsToClientShape(factor: {
  facilitating_factors: string;
  hindering_factors: string;
  recommendations?: string | null;
}) {
  const facilitatingByActivity = decodeActivityFactorCategory(
    factor.facilitating_factors,
  );
  const hinderingByActivity = decodeActivityFactorCategory(
    factor.hindering_factors,
  );

  if (facilitatingByActivity || hinderingByActivity) {
    const activityIds = new Set([
      ...Object.keys(facilitatingByActivity ?? {}),
      ...Object.keys(hinderingByActivity ?? {}),
    ]);

    return Object.fromEntries(
      [...activityIds].map((activityId) => [activityId, {
        facilitating: facilitatingByActivity?.[activityId] ?? "",
        hindering: hinderingByActivity?.[activityId] ?? "",
      }]),
    );
  }

  return {
    facilitating: factor.facilitating_factors,
    hindering: factor.hindering_factors,
    recommendations: factor.recommendations ?? "",
  };
}

export function pirActivityClientId(
  review: { id?: number | string; aip_activity_id?: number | null; is_unplanned?: boolean | null },
  unplannedIndex: number,
): string {
  if (review.aip_activity_id) return `aip:${review.aip_activity_id}`;
  if (review.is_unplanned) return `unplanned:${unplannedIndex}`;
  return String(review.id ?? `activity:${unplannedIndex}`);
}

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
  return Object.entries(factors || {}).map(([type, data]) => {
    if (isActivityFactorMap(data)) {
      return {
        factor_type: type,
        facilitating_factors: encodeActivityFactorCategory(data, "facilitating"),
        hindering_factors: encodeActivityFactorCategory(data, "hindering"),
        recommendations: "",
      };
    }

    return {
      factor_type: type,
      facilitating_factors: data.facilitating ?? "",
      hindering_factors: data.hindering ?? "",
      recommendations: data.recommendations ?? "",
    };
  });
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
