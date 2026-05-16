import {
  announcementMatchesUser,
  isAnnouncementActiveNow,
  recipientIdsNeedingAnnouncementNotification,
  shouldShowAnnouncementToUser,
} from "./announcements.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("announcementMatchesUser treats empty audience as broadcast", () => {
  assertEquals(
    announcementMatchesUser({ id: 1 }, {
      id: 10,
      role: "School",
      school_id: 3,
    }),
    true,
    "announcements without targets should match all active users",
  );
});

Deno.test("announcementMatchesUser supports role, school, and personnel targets", () => {
  const announcement = {
    id: 1,
    target_roles: [{ role: "CES-SGOD" }],
    mentioned_schools: [{ school_id: 7 }],
    mentioned_users: [{ user_id: 42 }],
  };

  assertEquals(
    announcementMatchesUser(announcement, { id: 99, role: "CES-SGOD" }),
    true,
    "role target should match",
  );
  assertEquals(
    announcementMatchesUser(announcement, {
      id: 99,
      role: "School",
      school_id: 7,
    }),
    true,
    "school target should match",
  );
  assertEquals(
    announcementMatchesUser(announcement, {
      id: 42,
      role: "Division Personnel",
    }),
    true,
    "direct personnel target should match",
  );
  assertEquals(
    announcementMatchesUser(announcement, {
      id: 43,
      role: "School",
      school_id: 8,
    }),
    false,
    "unmatched users should not see targeted announcements",
  );
});

Deno.test("isAnnouncementActiveNow handles drafts, scheduled, expired, archived, and active records", () => {
  const now = new Date("2026-05-16T12:00:00Z");

  assertEquals(
    isAnnouncementActiveNow({ id: 1, is_active: false }, now),
    false,
    "inactive announcements are drafts",
  );
  assertEquals(
    isAnnouncementActiveNow({
      id: 1,
      is_active: true,
      starts_at: "2026-05-17T00:00:00Z",
    }, now),
    false,
    "future starts should not be active",
  );
  assertEquals(
    isAnnouncementActiveNow({
      id: 1,
      is_active: true,
      expires_at: "2026-05-16T11:59:00Z",
    }, now),
    false,
    "past expiry should not be active",
  );
  assertEquals(
    isAnnouncementActiveNow({
      id: 1,
      is_active: true,
      archived_at: "2026-05-16T11:00:00Z",
    }, now),
    false,
    "archived announcements should not be active",
  );
  assertEquals(
    isAnnouncementActiveNow({
      id: 1,
      is_active: true,
      starts_at: "2026-05-16T11:00:00Z",
      expires_at: "2026-05-16T13:00:00Z",
    }, now),
    true,
    "current active window should be visible",
  );
});

Deno.test("shouldShowAnnouncementToUser hides dismissed receipts", () => {
  const now = new Date("2026-05-16T12:00:00Z");
  const announcement = {
    id: 1,
    is_active: true,
    receipts: [{ user_id: 5, dismissed_at: "2026-05-16T11:30:00Z" }],
  };

  assertEquals(
    shouldShowAnnouncementToUser(announcement, { id: 5, role: "School" }, now),
    false,
    "dismissed user should not see the banner",
  );
  assertEquals(
    shouldShowAnnouncementToUser(announcement, { id: 6, role: "School" }, now),
    true,
    "other users should still see the banner",
  );
});

Deno.test("recipientIdsNeedingAnnouncementNotification dedupes notified users", () => {
  assertEquals(
    recipientIdsNeedingAnnouncementNotification(
      [1, 1, 2, 3],
      [{ user_id: 2, notified_at: "2026-05-16T12:00:00Z" }],
    ),
    [1, 3],
    "only unnotified unique recipients should be returned",
  );
});
