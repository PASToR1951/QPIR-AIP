// ── Valid status values ────────────────────────────────────────────────────

export const VALID_STATUSES = new Set([
  "Submitted",
  "Under Review",
  "For Recommendation",
  "For CES Review",
  "For Cluster Head Review",
  "For Admin Review",
  "Approved",
  "Returned",
]);

// ── Feedback / notes length cap ────────────────────────────────────────────

export const MAX_TEXT_LENGTH = 5000;

export function validateTextLength(
  value: string,
  fieldName: string,
): string | null {
  return value.length > MAX_TEXT_LENGTH
    ? `${fieldName} cannot exceed ${MAX_TEXT_LENGTH} characters`
    : null;
}
