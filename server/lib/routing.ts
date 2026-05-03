/**
 * Returns which CES role should review a PIR based on the program's division.
 * Used for Division Personnel PIRs and focal-recommended school AIPs/PIRs.
 *
 * - Division Personnel PIRs route by program.division:
 *   SGOD → CES-SGOD, OSDS → CES-ASDS, CID → CES-CID, null → CES-CID (fallback)
 * - School AIPs/PIRs use this after focal recommendation
 */
export function getCESRoleForDivisionPIR(
  programDivision: string | null,
): string {
  if (programDivision === "SGOD") return "CES-SGOD";
  if (programDivision === "OSDS") return "CES-ASDS";
  if (programDivision === "CID") return "CES-CID";
  return "CES-CID"; // fallback for programs without a division
}

export const CES_ROLES = ["CES-SGOD", "CES-ASDS", "CES-CID"] as const;
