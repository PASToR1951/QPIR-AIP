import type { Prisma } from "@prisma/client";
import type { TokenPayload } from "../../../lib/auth.ts";

/**
 * AIP `where` fragment scoping records to what a user may **VIEW**.
 *
 * - School users: their school's records (held by the school entity).
 * - Division Personnel: their own division-level records PLUS any division-level
 *   record for a program they are CURRENTLY assigned to (`UserPrograms`). Keeping
 *   the own-author arm means a user reassigned off a program never loses sight of
 *   their own past work, while a newly-assigned owner gains the program's history
 *   — records are retained by the Program, not the person.
 * - Any other role: their own division-level records (legacy behavior preserved).
 *
 * READ-ONLY. Do NOT use this for edit/submit/delete or create-gating — those stay
 * author-scoped (`created_by_user_id`) so a new owner can view a predecessor's
 * record but only act on their own (uniqueness remains per-author).
 */
export function aipVisibilityWhere(user: TokenPayload): Prisma.AIPWhereInput {
  if (user.role === "School" && user.school_id) {
    return { school_id: user.school_id };
  }
  if (user.role === "Division Personnel") {
    return {
      school_id: null,
      OR: [
        { created_by_user_id: user.id },
        { program: { personnel: { some: { id: user.id } } } },
      ],
    };
  }
  return { created_by_user_id: user.id, school_id: null };
}
