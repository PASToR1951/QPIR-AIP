import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { prisma } from "./db/client.ts";
import {
  aipResourceKeyFromRecord,
  LOCK_NAMESPACE,
  pirResourceKeyFromRecord,
  withAdvisoryLock,
} from "./lib/advisoryLock.ts";
import {
  getPrismaUniqueTarget,
  isKnownUniqueConflict,
  isPrismaUniqueConflict,
  isPrismaUniqueConflictWithoutTarget,
} from "./lib/prismaErrors.ts";

const RUN_DB_TESTS = Deno.env.get("AIP_PIR_CONCURRENCY_DB_TESTS") === "1";
const TEST_YEAR = 2026;
const TEST_QUARTER = "2nd Quarter CY 2026";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

function randomInt() {
  return crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000_000;
}

async function buildApp() {
  const [{ default: dataRoutes }, { default: adminRoutes }] = await Promise.all(
    [
      import("./routes/data.ts"),
      import("./routes/admin.ts"),
    ],
  );
  const app = new Hono();
  app.route("/api", dataRoutes);
  app.route("/api/admin", adminRoutes);
  return app;
}

type Fixture = Awaited<ReturnType<typeof createFixture>>;

async function createFixture(label: string) {
  const suffix = `${label}-${crypto.randomUUID().slice(0, 8)}`;
  const cluster = await prisma.cluster.create({
    data: {
      cluster_number: randomInt(),
      name: `Concurrency Cluster ${suffix}`,
    },
  });
  const school = await prisma.school.create({
    data: {
      name: `Concurrency School ${suffix}`,
      abbreviation: `CT${suffix.slice(-4)}`,
      level: "Elementary",
      cluster_id: cluster.id,
    },
  });
  const program = await prisma.program.create({
    data: {
      title: `Concurrency Program ${suffix}`,
      school_level_requirement: "Both",
    },
  });
  const schoolUser = await prisma.user.create({
    data: {
      email: `school-${suffix}@example.test`,
      role: "School",
      school_id: school.id,
      cluster_id: cluster.id,
      is_active: true,
      name: `School User ${suffix}`,
    },
  });
  const adminUser = await prisma.user.create({
    data: {
      email: `admin-${suffix}@example.test`,
      role: "Admin",
      is_active: true,
      name: `Admin User ${suffix}`,
    },
  });

  return {
    suffix,
    cluster,
    school,
    program,
    schoolUser,
    adminUser,
    schoolToken: await createToken(schoolUser, {
      school_id: school.id,
      cluster_id: cluster.id,
    }),
    adminToken: await createToken(adminUser, {
      school_id: null,
      cluster_id: null,
    }),
  };
}

async function cleanupFixture(fixture: Fixture) {
  await prisma.pIR.deleteMany({
    where: { aip: { program_id: fixture.program.id } },
  });
  await prisma.aIP.deleteMany({ where: { program_id: fixture.program.id } });
  await prisma.notification.deleteMany({
    where: {
      user_id: { in: [fixture.schoolUser.id, fixture.adminUser.id] },
    },
  });
  await prisma.userSession.deleteMany({
    where: {
      user_id: { in: [fixture.schoolUser.id, fixture.adminUser.id] },
    },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [fixture.schoolUser.id, fixture.adminUser.id] } },
  });
  await prisma.program.deleteMany({ where: { id: fixture.program.id } });
  await prisma.school.deleteMany({ where: { id: fixture.school.id } });
  await prisma.cluster.deleteMany({ where: { id: fixture.cluster.id } });
}

async function createToken(
  user: { id: number; role: string },
  scope: { school_id: number | null; cluster_id: number | null },
) {
  const [{ JWT_SECRET }, { hashSessionToken }] = await Promise.all([
    import("./lib/config.ts"),
    import("./lib/userSessions.ts"),
  ]);
  const sid = crypto.randomUUID();
  await prisma.userSession.create({
    data: {
      user_id: user.id,
      session_token: await hashSessionToken(sid),
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      school_id: scope.school_id,
      cluster_id: scope.cluster_id,
      sid,
    },
    JWT_SECRET,
    { algorithm: "HS256" },
  );
}

function headers(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

async function jsonRequest(
  app: Hono,
  method: string,
  path: string,
  token: string,
  body?: unknown,
) {
  return await app.request(`http://localhost${path}`, {
    method,
    headers: headers(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function aipBody(fixture: Fixture, marker: string) {
  return {
    program_id: fixture.program.id,
    year: TEST_YEAR,
    outcome: `Outcome ${marker}`,
    target_description: `Target ${marker}`,
    sip_title: `SIP ${marker}`,
    project_coordinator: `Coordinator ${marker}`,
    objectives: [`Objective ${marker}`],
    indicators: [{ description: `Indicator ${marker}`, target: "1" }],
    prepared_by_name: "Prepared By",
    prepared_by_title: "Teacher",
    approved_by_name: "Approved By",
    approved_by_title: "Principal",
    activities: [
      {
        phase: "Planning",
        name: `Activity ${marker} A`,
        period: "January",
        periodStartMonth: 1,
        periodEndMonth: 1,
        persons: "Team",
        outputs: "Output",
        budgetAmount: 100,
        budgetSource: "MOOE",
      },
      {
        phase: "Implementation",
        name: `Activity ${marker} B`,
        period: "February",
        periodStartMonth: 2,
        periodEndMonth: 2,
        persons: "Team",
        outputs: "Output",
        budgetAmount: 200,
        budgetSource: "MOOE",
      },
    ],
  };
}

async function createAipWithActivities(
  fixture: Fixture,
  status = "Approved",
) {
  return await prisma.aIP.create({
    data: {
      school_id: fixture.school.id,
      program_id: fixture.program.id,
      created_by_user_id: fixture.schoolUser.id,
      year: TEST_YEAR,
      outcome: "Outcome",
      target_description: "Target",
      sip_title: "SIP",
      project_coordinator: "Coordinator",
      objectives: ["Objective"],
      indicators: [{ description: "Indicator", target: "1" }],
      status,
      activities: {
        create: [
          {
            phase: "Planning",
            activity_name: "Activity A",
            implementation_period: "January",
            period_start_month: 1,
            period_end_month: 1,
            persons_involved: "Team",
            outputs: "Output",
            budget_amount: 100,
            budget_source: "MOOE",
          },
          {
            phase: "Implementation",
            activity_name: "Activity B",
            implementation_period: "February",
            period_start_month: 2,
            period_end_month: 2,
            persons_involved: "Team",
            outputs: "Output",
            budget_amount: 200,
            budget_source: "MOOE",
          },
        ],
      },
    },
    include: { activities: true },
  });
}

async function createDivisionAip(
  fixture: Fixture,
  divisionUserId: number,
  marker: string,
) {
  return await prisma.aIP.create({
    data: {
      school_id: null,
      program_id: fixture.program.id,
      created_by_user_id: divisionUserId,
      year: TEST_YEAR,
      outcome: `Division Outcome ${marker}`,
      target_description: `Division Target ${marker}`,
      sip_title: `Division SIP ${marker}`,
      project_coordinator: `Coordinator ${marker}`,
      objectives: [`Objective ${marker}`],
      indicators: [{ description: `Indicator ${marker}`, target: "1" }],
      status: "Approved",
    },
  });
}

function pirBody(fixture: Fixture, activityIds: number[], marker: string) {
  return {
    program_title: fixture.program.title,
    quarter: TEST_QUARTER,
    program_owner: `Owner ${marker}`,
    budget_from_division: 100,
    budget_from_co_psf: 50,
    functional_division: null,
    indicator_quarterly_targets: [],
    action_items: [],
    activity_reviews: activityIds.map((id, index) => ({
      aip_activity_id: id,
      complied: true,
      actual_tasks_conducted: `Actual ${marker} ${index}`,
      contributory_performance_indicators: "Indicator",
      movs_expected_outputs: "MOV",
      adjustments: "",
      is_unplanned: false,
      physTarget: 1,
      finTarget: 1,
      physAcc: 1,
      finAcc: 1,
      actions: "",
    })),
    factors: {
      Institutional: {
        facilitating: `Facilitating ${marker}`,
        hindering: "",
        recommendations: "",
      },
      Technical: {
        facilitating: `Technical ${marker}`,
        hindering: "",
        recommendations: "",
      },
    },
  };
}

async function runWithFixture(
  label: string,
  fn: (app: Hono, fixture: Fixture) => Promise<void>,
) {
  const app = await buildApp();
  await runDbFixture(label, (fixture) => fn(app, fixture));
}

async function runDbFixture(
  label: string,
  fn: (fixture: Fixture) => Promise<void>,
) {
  const fixture = await createFixture(label);
  try {
    await fn(fixture);
  } finally {
    await cleanupFixture(fixture);
  }
}

function dbTest(name: string, fn: () => Promise<void>) {
  Deno.test({
    name,
    ignore: !RUN_DB_TESTS,
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
      const missing = ["DATABASE_URL", "JWT_SECRET", "EMAIL_CONFIG_SECRET"]
        .filter((key) => !Deno.env.get(key));
      if (missing.length > 0) {
        throw new Error(
          `AIP_PIR_CONCURRENCY_DB_TESTS requires ${missing.join(", ")}`,
        );
      }
      await fn();
    },
  });
}

dbTest(
  "concurrent AIP submits produce one success, one 409, and one AIP row",
  async () => {
    await runWithFixture("aip-submit", async (app, fixture) => {
      const body = aipBody(fixture, "submit");
      const responses = await Promise.all([
        jsonRequest(app, "POST", "/api/aips", fixture.schoolToken, body),
        jsonRequest(app, "POST", "/api/aips", fixture.schoolToken, body),
      ]);
      const statuses = responses.map((res) => res.status).sort();
      const count = await prisma.aIP.count({
        where: { program_id: fixture.program.id, year: TEST_YEAR },
      });

      assertEquals(
        statuses,
        [200, 409],
        "one submit should win and one should conflict",
      );
      assertEquals(count, 1, "duplicate AIP submits should leave one row");
    });
  },
);

dbTest(
  "concurrent AIP draft saves produce one draft row with consistent activities",
  async () => {
    await runWithFixture("aip-draft", async (app, fixture) => {
      const body = aipBody(fixture, "draft");
      const responses = await Promise.all([
        jsonRequest(app, "POST", "/api/aips/draft", fixture.schoolToken, body),
        jsonRequest(app, "POST", "/api/aips/draft", fixture.schoolToken, body),
      ]);
      const aip = await prisma.aIP.findFirst({
        where: { program_id: fixture.program.id, year: TEST_YEAR },
        include: { activities: true },
      });

      assertEquals(
        responses.map((res) => res.status),
        [200, 200],
        "both draft saves should succeed",
      );
      assert(aip, "draft save should leave an AIP row");
      assertEquals(aip.status, "Draft", "draft save should leave draft status");
      assertEquals(
        aip.activities.length,
        2,
        "activity delete/recreate should be consistent",
      );
    });
  },
);

dbTest(
  "concurrent PIR submits produce one success, one 409, and one PIR row",
  async () => {
    await runWithFixture("pir-submit", async (app, fixture) => {
      const aip = await createAipWithActivities(fixture);
      const body = pirBody(
        fixture,
        aip.activities.map((activity) => activity.id),
        "submit",
      );
      const responses = await Promise.all([
        jsonRequest(app, "POST", "/api/pirs", fixture.schoolToken, body),
        jsonRequest(app, "POST", "/api/pirs", fixture.schoolToken, body),
      ]);
      const statuses = responses.map((res) => res.status).sort();
      const count = await prisma.pIR.count({ where: { aip_id: aip.id } });

      assertEquals(
        statuses,
        [200, 409],
        "one PIR submit should win and one should conflict",
      );
      assertEquals(count, 1, "duplicate PIR submits should leave one row");
    });
  },
);

dbTest(
  "quarter casing and whitespace variants resolve to one PIR row",
  async () => {
    await runWithFixture("pir-quarter-normalize", async (app, fixture) => {
      const aip = await createAipWithActivities(fixture);
      const activityIds = aip.activities.map((activity) => activity.id);
      const canonicalBody = pirBody(fixture, activityIds, "canonical");
      const variantBody = {
        ...pirBody(fixture, activityIds, "variant"),
        quarter: "  2ND   QUARTER   cy   2026  ",
      };

      const responses = await Promise.all([
        jsonRequest(
          app,
          "POST",
          "/api/pirs",
          fixture.schoolToken,
          canonicalBody,
        ),
        jsonRequest(app, "POST", "/api/pirs", fixture.schoolToken, variantBody),
      ]);
      const statuses = responses.map((res) => res.status).sort();
      const pirs = await prisma.pIR.findMany({ where: { aip_id: aip.id } });

      assertEquals(
        statuses,
        [200, 409],
        "quarter variants should serialize to one success and one conflict",
      );
      assertEquals(
        pirs.length,
        1,
        "quarter variants should not create duplicate PIR rows",
      );
      assertEquals(
        pirs[0].quarter,
        TEST_QUARTER,
        "PIR quarter should be stored in canonical form",
      );
    });
  },
);

dbTest(
  "concurrent PIR draft saves produce one PIR row with consistent children",
  async () => {
    await runWithFixture("pir-draft", async (app, fixture) => {
      const aip = await createAipWithActivities(fixture);
      const body = pirBody(
        fixture,
        aip.activities.map((activity) => activity.id),
        "draft",
      );
      const responses = await Promise.all([
        jsonRequest(app, "POST", "/api/pirs/draft", fixture.schoolToken, body),
        jsonRequest(app, "POST", "/api/pirs/draft", fixture.schoolToken, body),
      ]);
      const pir = await prisma.pIR.findFirst({
        where: { aip_id: aip.id, quarter: TEST_QUARTER },
        include: { activity_reviews: true, factors: true },
      });

      assertEquals(
        responses.map((res) => res.status),
        [200, 200],
        "both draft saves should succeed",
      );
      assert(pir, "draft save should leave a PIR row");
      assertEquals(pir.status, "Draft", "PIR draft should keep draft status");
      assertEquals(
        pir.activity_reviews.length,
        2,
        "review delete/recreate should be consistent",
      );
      assertEquals(
        pir.factors.length,
        2,
        "factor delete/recreate should be consistent",
      );
    });
  },
);

dbTest(
  "AIP returned edit racing with admin status change does not overwrite stale state",
  async () => {
    await runWithFixture("aip-race", async (app, fixture) => {
      const aip = await createAipWithActivities(fixture, "Returned");
      const [userRes, adminRes] = await Promise.all([
        jsonRequest(
          app,
          "PUT",
          `/api/aips/${aip.id}`,
          fixture.schoolToken,
          aipBody(fixture, "returned-edit"),
        ),
        jsonRequest(
          app,
          "PATCH",
          `/api/admin/submissions/${aip.id}/status`,
          fixture.adminToken,
          { type: "aip", status: "Submitted" },
        ),
      ]);
      const current = await prisma.aIP.findUnique({ where: { id: aip.id } });

      assert(
        [200, 409].includes(userRes.status),
        "user edit should either win first or see the stale status",
      );
      assertEquals(adminRes.status, 200, "admin status write should succeed");
      assertEquals(
        current?.status,
        "Submitted",
        "admin status should not be overwritten by a stale edit",
      );
    });
  },
);

dbTest("explicit concurrent presented writes are idempotent", async () => {
  await runWithFixture("presented", async (app, fixture) => {
    const aip = await createAipWithActivities(fixture);
    const pir = await prisma.pIR.create({
      data: {
        aip_id: aip.id,
        created_by_user_id: fixture.schoolUser.id,
        quarter: TEST_QUARTER,
        program_owner: "Owner",
        status: "Approved",
      },
    });

    await Promise.all([
      jsonRequest(
        app,
        "PATCH",
        `/api/admin/pirs/${pir.id}/presented`,
        fixture.adminToken,
        { presented: true },
      ),
      jsonRequest(
        app,
        "PATCH",
        `/api/admin/pirs/${pir.id}/presented`,
        fixture.adminToken,
        { presented: true },
      ),
    ]);
    const marked = await prisma.pIR.findUnique({ where: { id: pir.id } });
    assertEquals(
      marked?.presented,
      true,
      "explicit true writes should end true",
    );

    await Promise.all([
      jsonRequest(
        app,
        "PATCH",
        `/api/admin/pirs/${pir.id}/presented`,
        fixture.adminToken,
        { presented: false },
      ),
      jsonRequest(
        app,
        "PATCH",
        `/api/admin/pirs/${pir.id}/presented`,
        fixture.adminToken,
        { presented: false },
      ),
    ]);
    const unmarked = await prisma.pIR.findUnique({ where: { id: pir.id } });
    assertEquals(
      unmarked?.presented,
      false,
      "explicit false writes should end false",
    );
  });
});

dbTest(
  "division AIP partial unique index P2002 target shape is recognized",
  async () => {
    await runDbFixture("div-p2002", async (fixture) => {
      const divisionUser = await prisma.user.create({
        data: {
          email: `division-${fixture.suffix}@example.test`,
          role: "Division Personnel",
          is_active: true,
          name: `Division User ${fixture.suffix}`,
        },
      });

      try {
        await createDivisionAip(fixture, divisionUser.id, "first");

        let caught: unknown;
        try {
          await createDivisionAip(fixture, divisionUser.id, "duplicate");
        } catch (error) {
          caught = error;
        }

        assert(
          caught,
          "duplicate division AIP should fail on the partial unique index",
        );
        assert(
          isPrismaUniqueConflict(caught),
          "duplicate division AIP should surface as Prisma P2002",
        );

        const target = getPrismaUniqueTarget(caught);
        console.info(
          `AIP_div_personnel_unique_idx P2002 target: ${target || "<empty>"}`,
        );
        assert(
          isKnownUniqueConflict(caught) ||
            isPrismaUniqueConflictWithoutTarget(caught),
          `unexpected AIP_div_personnel_unique_idx target: ${target}`,
        );
      } finally {
        await prisma.user.deleteMany({ where: { id: divisionUser.id } });
      }
    });
  },
);

dbTest(
  "AIP activity delete/recreate rolls back if the transaction fails after delete",
  async () => {
    await runDbFixture("aip-rollback", async (fixture) => {
      const aip = await createAipWithActivities(fixture);
      const beforeCount = await prisma.aIPActivity.count({
        where: { aip_id: aip.id },
      });

      let rolledBack = false;
      try {
        await withAdvisoryLock(
          LOCK_NAMESPACE.AIP,
          aipResourceKeyFromRecord(aip),
          async (tx) => {
            await tx.aIPActivity.deleteMany({ where: { aip_id: aip.id } });
            throw new Error("injected AIP rollback failure");
          },
        );
      } catch (error) {
        rolledBack = error instanceof Error &&
          error.message === "injected AIP rollback failure";
      }

      const afterCount = await prisma.aIPActivity.count({
        where: { aip_id: aip.id },
      });
      assert(rolledBack, "test should hit the injected rollback failure");
      assertEquals(
        afterCount,
        beforeCount,
        "AIP activities deleted inside the failed transaction should roll back",
      );
    });
  },
);

dbTest(
  "PIR review/factor delete/recreate rolls back if the transaction fails after delete",
  async () => {
    await runDbFixture("pir-rollback", async (fixture) => {
      const aip = await createAipWithActivities(fixture);
      const pir = await prisma.pIR.create({
        data: {
          aip_id: aip.id,
          created_by_user_id: fixture.schoolUser.id,
          quarter: TEST_QUARTER,
          program_owner: "Owner",
          status: "Draft",
          activity_reviews: {
            create: aip.activities.map((activity, index) => ({
              aip_activity_id: activity.id,
              complied: true,
              actual_tasks_conducted: `Actual ${index}`,
            })),
          },
          factors: {
            create: [
              {
                factor_type: "Institutional",
                facilitating_factors: "Facilitating",
                hindering_factors: "Hindering",
              },
              {
                factor_type: "Technical",
                facilitating_factors: "Facilitating",
                hindering_factors: "Hindering",
              },
            ],
          },
        },
        include: { activity_reviews: true, factors: true },
      });
      const beforeReviewCount = pir.activity_reviews.length;
      const beforeFactorCount = pir.factors.length;

      let rolledBack = false;
      try {
        await withAdvisoryLock(
          LOCK_NAMESPACE.PIR,
          pirResourceKeyFromRecord(pir),
          async (tx) => {
            await tx.pIRActivityReview.deleteMany({
              where: { pir_id: pir.id },
            });
            await tx.pIRFactor.deleteMany({ where: { pir_id: pir.id } });
            throw new Error("injected PIR rollback failure");
          },
        );
      } catch (error) {
        rolledBack = error instanceof Error &&
          error.message === "injected PIR rollback failure";
      }

      const [afterReviewCount, afterFactorCount] = await Promise.all([
        prisma.pIRActivityReview.count({ where: { pir_id: pir.id } }),
        prisma.pIRFactor.count({ where: { pir_id: pir.id } }),
      ]);
      assert(rolledBack, "test should hit the injected rollback failure");
      assertEquals(
        afterReviewCount,
        beforeReviewCount,
        "PIR reviews deleted inside the failed transaction should roll back",
      );
      assertEquals(
        afterFactorCount,
        beforeFactorCount,
        "PIR factors deleted inside the failed transaction should roll back",
      );
    });
  },
);
