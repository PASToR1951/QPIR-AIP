Deno.env.set("JWT_SECRET", Deno.env.get("JWT_SECRET") ?? "test-secret");
Deno.env.set(
  "EMAIL_CONFIG_SECRET",
  Deno.env.get("EMAIL_CONFIG_SECRET") ?? "test-email-secret",
);

const {
  BROAD_ACCESS_IDLE_TIMEOUT_SECONDS,
  DATA_ENTRY_IDLE_TIMEOUT_SECONDS,
  getSessionIdleTimeoutSeconds,
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

Deno.test("getSessionIdleTimeoutSeconds uses stricter limits for broad-access roles", () => {
  assertEquals(
    getSessionIdleTimeoutSeconds("Admin"),
    BROAD_ACCESS_IDLE_TIMEOUT_SECONDS,
    "Admin should use the broad-access idle timeout",
  );
  assertEquals(
    getSessionIdleTimeoutSeconds("Observer"),
    BROAD_ACCESS_IDLE_TIMEOUT_SECONDS,
    "Observer should use the broad-access idle timeout",
  );
  assertEquals(
    getSessionIdleTimeoutSeconds("CES-SGOD"),
    BROAD_ACCESS_IDLE_TIMEOUT_SECONDS,
    "CES roles should use the broad-access idle timeout",
  );
  assertEquals(
    getSessionIdleTimeoutSeconds("Cluster Coordinator"),
    BROAD_ACCESS_IDLE_TIMEOUT_SECONDS,
    "Cluster Coordinator should use the broad-access idle timeout",
  );
  assertEquals(
    getSessionIdleTimeoutSeconds("School"),
    DATA_ENTRY_IDLE_TIMEOUT_SECONDS,
    "School should use the regular data-entry idle timeout",
  );
  assertEquals(
    getSessionIdleTimeoutSeconds("Division Personnel"),
    DATA_ENTRY_IDLE_TIMEOUT_SECONDS,
    "Division Personnel should use the regular data-entry idle timeout",
  );
});

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

Deno.test("getSessionValidationFailure rejects idle-expired broad-access sessions", () => {
  assertEquals(
    getSessionValidationFailure(
      buildSession({ last_seen_at: minutesAgo(15) }),
      { id: 10, role: "Admin" },
      NOW,
    ),
    "idle_expired",
    "Admin sessions should idle-expire after 15 minutes",
  );
});

Deno.test("getSessionValidationFailure rejects idle-expired regular sessions", () => {
  assertEquals(
    getSessionValidationFailure(
      buildSession({
        last_seen_at: minutesAgo(30),
        user: { is_active: true, role: "School" },
      }),
      { id: 10, role: "School" },
      NOW,
    ),
    "idle_expired",
    "School sessions should idle-expire after 30 minutes",
  );
});
