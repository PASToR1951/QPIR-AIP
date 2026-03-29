/**
 * Returns which CES role should review a PIR based on the program's division
 * and whether the PIR belongs to a school.
 *
 * - School PIRs (hasSchoolId = true) always route to CES-CID regardless of program division
 * - Division PIRs route based on program.division:
 *   SGOD → CES-SGOD, OSDS → CES-ASDS, CID → CES-CID, null → CES-CID (fallback)
 */
export function getCESRoleForPIR(
  programDivision: string | null,
  hasSchoolId: boolean
): string {
  if (hasSchoolId) return "CES-CID";
  if (programDivision === "SGOD") return "CES-SGOD";
  if (programDivision === "OSDS") return "CES-ASDS";
  if (programDivision === "CID") return "CES-CID";
  return "CES-CID"; // fallback for programs without a division assigned
}

export const CES_ROLES = ["CES-SGOD", "CES-ASDS", "CES-CID"] as const;
export type CESRole = (typeof CES_ROLES)[number];
