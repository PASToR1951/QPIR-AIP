import { getActionMeta } from "./actionCatalog.ts";
import { parseAdminLogFilters, AdminLogQueryError } from "./query.ts";
import { redactDetails } from "./redact.ts";
import { buildAdminLogRow } from "./shared.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`);
  }
}

Deno.test("parseAdminLogFilters normalizes lists and date-only boundaries", () => {
  const filters = parseAdminLogFilters({
    source: "admin",
    action: "failed_login,failed_login,BACKUP_TRIGGERED",
    severity: "critical,notice",
    entityType: "User,Export",
    role: "Admin,Admin",
    from: "2026-04-10",
    to: "2026-04-12",
    page: "2",
    limit: "250",
    q: "  password mismatch  ",
  });

  assertEquals(filters.source, "admin", "source should be parsed");
  assertEquals(
    filters.actions,
    ["failed_login", "BACKUP_TRIGGERED"],
    "actions should be deduplicated",
  );
  assertEquals(filters.entityTypes, ["User", "Export"], "entity types should be deduplicated");
  assertEquals(filters.roles, ["Admin"], "roles should be deduplicated");
  assertEquals(filters.severities, ["critical", "notice"], "severities should be parsed");
  assertEquals(filters.page, 2, "page should be parsed");
  assertEquals(filters.limit, 100, "limit should respect the v1 cap");
  assertEquals(filters.offset, 100, "offset should match page and limit");
  assertEquals(filters.q, "password mismatch", "search text should be trimmed");
  assertEquals(filters.from?.toISOString(), "2026-04-10T00:00:00.000Z", "from date should start at midnight UTC");
  assertEquals(filters.to?.toISOString(), "2026-04-12T23:59:59.999Z", "to date should end at the day boundary");
});

Deno.test("parseAdminLogFilters rejects invalid severities", () => {
  let thrown: unknown = null;

  try {
    parseAdminLogFilters({ severity: "alarm" });
  } catch (error) {
    thrown = error;
  }

  assert(thrown instanceof AdminLogQueryError, "invalid severity should throw AdminLogQueryError");
  assertEquals(
    (thrown as Error).message,
    "Unknown severity filter: alarm",
    "error message should explain the invalid filter",
  );
});

Deno.test("getActionMeta falls back for unknown historical actions", () => {
  const meta = getActionMeta("deleted_legacy_record");

  assertEquals(meta.label, "Deleted Legacy Record", "fallback labels should be human-readable");
  assertEquals(meta.severity, "critical", "fallback severity should be inferred");
  assertEquals(meta.category, "system", "fallback category should still be assigned");
  assertEquals(meta.icon, "GearSix", "fallback icon should stay readable even for unknown keys");
});

Deno.test("redactDetails removes or masks sensitive values recursively", () => {
  const redacted = redactDetails({
    password: "hunter2",
    token: "abc123",
    phone_number: "09171234567",
    nested: {
      secret: "keep-out",
      current_password: "do-not-show",
      note: "visible",
    },
    sessions: [
      { session_token: "xyz", label: "Chrome" },
    ],
  });

  assert(!("password" in redacted), "password keys should be removed");
  assertEquals(redacted.token, "[REDACTED]", "token-like keys should be masked");
  assertEquals(redacted.phone_number, "***-***-4567", "phone-like values should be masked");
  assertEquals(
    redacted.nested,
    {
      secret: "[REDACTED]",
      note: "visible",
    },
    "nested sensitive keys should be redacted",
  );
  assertEquals(
    redacted.sessions,
    [{ session_token: "[REDACTED]", label: "Chrome" }],
    "array items should be redacted recursively",
  );
});

Deno.test("buildAdminLogRow maps raw rows and redacts previews", () => {
  const row = buildAdminLogRow(
    {
      id: 44,
      source: "user",
      action: "failed_login",
      entity_type: "User",
      entity_id: 77,
      details: JSON.stringify({
        email_attempted: "person@example.com",
        temporaryPassword: "secret",
        phone_number: "09171234567",
      }),
      ip_address: "203.177.48.9",
      created_at: "2026-04-20T02:15:00.000Z",
      actor_id: null,
      actor_role: null,
      actor_name: null,
      actor_email: null,
      actor_first_name: null,
      actor_middle_initial: null,
      actor_last_name: null,
    },
    { includeDetails: true },
  ) as ReturnType<typeof buildAdminLogRow> & {
    details: Record<string, unknown>;
  };

  assertEquals(row.id, 44, "id should be normalized");
  assertEquals(row.source, "user", "source should be preserved");
  assertEquals(row.action_label, "Failed Login", "action labels should come from the catalog");
  assertEquals(row.entity_label, "User #77", "unknown entity labels should fall back to type + id");
  assertEquals(
    row.details_preview,
    "email_attempted: person@example.com · phone_number: ***-***-4567",
    "preview should skip removed secrets and use redacted values",
  );
  assertEquals(
    row.details,
    {
      email_attempted: "person@example.com",
      phone_number: "***-***-4567",
    },
    "detail payloads should be redacted before returning",
  );
});
