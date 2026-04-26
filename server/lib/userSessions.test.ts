Deno.env.set("JWT_SECRET", Deno.env.get("JWT_SECRET") ?? "test-secret");
Deno.env.set(
  "EMAIL_CONFIG_SECRET",
  Deno.env.get("EMAIL_CONFIG_SECRET") ?? "test-email-secret",
);

const {
  getSessionValidationFailure,
} = await import("./userSessions.ts");

type ValidatableSession = {
  user_id: number;
  last_seen_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  user: {
    is_active: boolean;
    role: string;
  };
};

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

const NOW = new Date("2026-04-24T00:00:00.000Z");

function minutesAgo(minutes: number) {
  return new Date(NOW.getTime() - minutes * 60 * 1000);
}

function minutesFromNow(minutes: number) {
  return new Date(NOW.getTime() + minutes * 60 * 1000);
}

function buildSession(
  overrides: Partial<ValidatableSession> = {},
): ValidatableSession {
  return {
    user_id: 10,
    last_seen_at: minutesAgo(5),
    expires_at: minutesFromNow(60),
    revoked_at: null,
    user: {
      is_active: true,
      role: "Admin",
    },
    ...overrides,
  };
}

Deno.test("getSessionValidationFailure accepts an active matching session", () => {
  assertEquals(
    getSessionValidationFailure(buildSession(), { id: 10, role: "Admin" }, NOW),
    null,
    "active sessions should pass",
  );
});

Deno.test("getSessionValidationFailure rejects revoked sessions", () => {
  assertEquals(
    getSessionValidationFailure(
      buildSession({ revoked_at: minutesAgo(1) }),
      { id: 10, role: "Admin" },
      NOW,
    ),
    "revoked",
    "revoked sessions should fail",
  );
});

Deno.test("getSessionValidationFailure rejects absolute-expired sessions", () => {
  assertEquals(
    getSessionValidationFailure(
      buildSession({ expires_at: minutesAgo(1) }),
      { id: 10, role: "Admin" },
      NOW,
    ),
    "expired",
    "absolute-expired sessions should fail",
  );
});

Deno.test("getSessionValidationFailure rejects inactive users", () => {
  assertEquals(
    getSessionValidationFailure(
      buildSession({ user: { is_active: false, role: "Admin" } }),
      { id: 10, role: "Admin" },
      NOW,
    ),
    "inactive_user",
    "inactive users should fail",
  );
});

Deno.test("getSessionValidationFailure rejects role-mismatched claims", () => {
  assertEquals(
    getSessionValidationFailure(
      buildSession({ user: { is_active: true, role: "School" } }),
      { id: 10, role: "Admin" },
      NOW,
    ),
    "role_mismatch",
    "tokens with stale role claims should fail",
  );
});

Deno.test("getSessionValidationFailure accepts sessions regardless of idle age", () => {
  assertEquals(
    getSessionValidationFailure(
      buildSession({ last_seen_at: minutesAgo(12 * 60) }),
      { id: 10, role: "Admin" },
      NOW,
    ),
    null,
    "sessions should stay valid until absolute expiry, revocation, or account changes",
  );
});
