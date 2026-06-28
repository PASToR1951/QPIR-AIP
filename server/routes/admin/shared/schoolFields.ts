export function normalizeOptionalSchoolAbbreviation(value: unknown) {
  if (typeof value !== "string") return null;
  const abbreviation = value.trim();
  return abbreviation.length > 0 ? abbreviation : null;
}
