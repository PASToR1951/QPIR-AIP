const PIR_READABLE_ROLES = new Set([
  "Admin",
  "CES-SGOD",
  "CES-ASDS",
  "CES-CID",
  "Superintendent",
]);

export function pirReadableWhereFor(
  _user: { role: string },
) {
  return { status: { not: "Draft" } };
}

export function canReadPirRecord(
  user: { role: string },
  _pir: unknown,
): boolean {
  if (!PIR_READABLE_ROLES.has(user.role)) return false;
  return true;
}
