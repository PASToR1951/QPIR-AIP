import { aipVisibilityWhere } from "./visibility.ts";
import type { TokenPayload } from "../../../lib/auth.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

function user(overrides: Partial<TokenPayload>): TokenPayload {
  return { id: 1, role: "School", school_id: null, ...overrides } as TokenPayload;
}

Deno.test("School users are scoped to their school (entity-owned)", () => {
  assertEquals(
    aipVisibilityWhere(user({ role: "School", school_id: 7 })),
    { school_id: 7 },
    "school records should be scoped by school_id",
  );
});

Deno.test("Division Personnel see own records plus assigned-program records", () => {
  assertEquals(
    aipVisibilityWhere(user({ id: 42, role: "Division Personnel" })),
    {
      school_id: null,
      OR: [
        { created_by_user_id: 42 },
        { program: { personnel: { some: { id: 42 } } } },
      ],
    },
    "a new owner should see the program's history while keeping their own",
  );
});

Deno.test("Division program arm uses current assignment, so a new owner inherits visibility", () => {
  // The program-membership arm keys off `personnel` (UserPrograms), which is what
  // an admin edits on transfer — so the where never references the prior owner.
  const where = aipVisibilityWhere(user({ id: 99, role: "Division Personnel" }));
  const programArm = (where.OR as Array<Record<string, unknown>>)[1];
  assertEquals(
    programArm,
    { program: { personnel: { some: { id: 99 } } } },
    "visibility should follow current program assignment",
  );
});

Deno.test("School user without a school_id falls back to own division records", () => {
  assertEquals(
    aipVisibilityWhere(user({ id: 5, role: "School", school_id: null })),
    { created_by_user_id: 5, school_id: null },
    "legacy/edge behavior should be preserved",
  );
});

Deno.test("Other roles keep author-scoped division visibility", () => {
  assertEquals(
    aipVisibilityWhere(user({ id: 8, role: "Admin" })),
    { created_by_user_id: 8, school_id: null },
    "non-School non-Division roles should be unchanged",
  );
});
