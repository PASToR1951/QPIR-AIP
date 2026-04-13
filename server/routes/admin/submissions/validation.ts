// ── Valid status values ────────────────────────────────────────────────────

export const VALID_STATUSES = new Set([
  "Submitted",
  "Under Review",
  "For CES Review",
  "For Cluster Head Review",
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

// ── Remarks merge ──────────────────────────────────────────────────────────
// When a status change carries optional feedback and the PIR already has
// remarks, we merge rather than overwrite so no prior text is lost.

export function mergeRemarks(
  existing: string,
  incoming: string,
): string | undefined {
  if (!incoming) return undefined;
  if (!existing || existing === incoming || existing.includes(incoming)) {
    return existing || incoming;
  }
  return `${existing}\n\n${incoming}`;
}
