import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { writeAuditLog } from "./shared/audit.ts";
import {
  buildDefaultDeadline,
  getQuarterNumbers,
  isValidQuarter,
} from "./shared/dates.ts";
import { adminOnly } from "./shared/guards.ts";
import { getTrimesterNumbers, isValidTrimester } from "../../lib/trimesters.ts";
import {
  getDefaultQuarterRange,
  getDefaultTrimesterRange,
  isValidMonthRange,
  type PeriodRange,
  resolveMonthRange,
} from "../../lib/periodRanges.ts";

const deadlinesRoutes = new Hono();

function parseMonthRangePayload(
  startMonth: unknown,
  endMonth: unknown,
  fallback: PeriodRange,
): PeriodRange | string {
  if (startMonth === undefined && endMonth === undefined) {
    return fallback;
  }

  const start = safeParseInt(
    startMonth as string | number | null | undefined,
    0,
    1,
    12,
  );
  const end = safeParseInt(
    endMonth as string | number | null | undefined,
    0,
    1,
    12,
  );
  if (!isValidMonthRange(start, end)) {
    return "Invalid reporting period month range";
  }

  return { start, end };
}

deadlinesRoutes.use("/deadlines", adminOnly);
deadlinesRoutes.use("/deadlines/*", adminOnly);

deadlinesRoutes.get("/deadlines", async (c) => {
  const year = safeParseInt(
    c.req.query("year"),
    new Date().getFullYear(),
    2020,
    2100,
  );
  const deadlines = await prisma.deadline.findMany({ where: { year } });
  const result = getQuarterNumbers().map((quarter) => {
    const custom = deadlines.find((deadline) => deadline.quarter === quarter) as
      | any
      | undefined;
    const range = resolveMonthRange(
      custom?.period_start_month,
      custom?.period_end_month,
      getDefaultQuarterRange(quarter),
    );
    return {
      quarter,
      year,
      date: custom ? custom.date : buildDefaultDeadline(year, quarter),
      open_date: custom?.open_date ?? null,
      grace_period_days: custom?.grace_period_days ?? 0,
      period_start_month: range.start,
      period_end_month: range.end,
      isCustom: !!custom,
      id: custom?.id ?? null,
    };
  });
  return c.json(result);
});

deadlinesRoutes.post("/deadlines", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const {
    year,
    quarter,
    date,
    open_date,
    grace_period_days,
    period_start_month,
    period_end_month,
  } = await c.req.json();

  const parsedYear = safeParseInt(year, 0, 2020, 2100);
  if (parsedYear < 2020 || parsedYear > 2100) {
    return c.json({ error: "Invalid year (must be 2020–2100)" }, 400);
  }
  if (!isValidQuarter(quarter)) {
    return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);
  }

  const deadlineDate = new Date(date);
  if (isNaN(deadlineDate.getTime())) {
    return c.json({ error: "Invalid date" }, 400);
  }

  let openDate: Date | null = null;
  if (open_date) {
    openDate = new Date(open_date);
    if (isNaN(openDate.getTime())) {
      return c.json({ error: "Invalid open_date" }, 400);
    }
    if (openDate >= deadlineDate) {
      return c.json({ error: "Open date must be before deadline" }, 400);
    }
  }

  const graceDays = safeParseInt(grace_period_days, 0, 0, 30);
  if (graceDays < 0 || graceDays > 30) {
    return c.json({ error: "Grace period must be between 0 and 30 days" }, 400);
  }

  const periodRange = parseMonthRangePayload(
    period_start_month,
    period_end_month,
    getDefaultQuarterRange(quarter),
  );
  if (typeof periodRange === "string") {
    return c.json({ error: periodRange }, 400);
  }

  const existing = await prisma.deadline.findUnique({
    where: { year_quarter: { year: parsedYear, quarter } },
  });
  const deadline = await (prisma.deadline as any).upsert({
    where: { year_quarter: { year: parsedYear, quarter } },
    update: {
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
      period_start_month: periodRange.start,
      period_end_month: periodRange.end,
    },
    create: {
      year: parsedYear,
      quarter,
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
      period_start_month: periodRange.start,
      period_end_month: periodRange.end,
    },
  });

  await writeAuditLog(admin.id, "changed_deadline", "Deadline", deadline.id, {
    year: parsedYear,
    quarter,
    newDate: date,
    previousDate: existing?.date ?? null,
    periodStartMonth: periodRange.start,
    periodEndMonth: periodRange.end,
    previousPeriodStartMonth: (existing as any)?.period_start_month ?? null,
    previousPeriodEndMonth: (existing as any)?.period_end_month ?? null,
  }, { ctx: c });
  return c.json(deadline);
});

deadlinesRoutes.get("/deadlines/trimesters", async (c) => {
  const year = safeParseInt(
    c.req.query("year"),
    new Date().getFullYear(),
    2020,
    2100,
  );
  const deadlines = await prisma.trimesterDeadline.findMany({
    where: { year },
  });
  const result = getTrimesterNumbers().map((trimester) => {
    const custom = deadlines.find((deadline) =>
      deadline.trimester === trimester
    ) as any | undefined;
    const range = resolveMonthRange(
      custom?.period_start_month,
      custom?.period_end_month,
      getDefaultTrimesterRange(trimester),
    );
    return {
      trimester,
      year,
      date: custom?.date ?? null,
      open_date: custom?.open_date ?? null,
      grace_period_days: custom?.grace_period_days ?? 0,
      period_start_month: range.start,
      period_end_month: range.end,
      isCustom: !!custom,
      id: custom?.id ?? null,
    };
  });
  return c.json(result);
});

deadlinesRoutes.post("/deadlines/trimesters", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const {
    year,
    trimester,
    date,
    open_date,
    grace_period_days,
    period_start_month,
    period_end_month,
  } = await c.req.json();

  const parsedYear = safeParseInt(year, 0, 2020, 2100);
  if (parsedYear < 2020 || parsedYear > 2100) {
    return c.json({ error: "Invalid year (must be 2020–2100)" }, 400);
  }
  if (!isValidTrimester(trimester)) {
    return c.json({ error: "Invalid trimester (must be 1–3)" }, 400);
  }

  if (!open_date) {
    return c.json({ error: "Open date is required" }, 400);
  }
  if (!date) {
    return c.json({ error: "Deadline date is required" }, 400);
  }

  const deadlineDate = new Date(date);
  if (isNaN(deadlineDate.getTime())) {
    return c.json({ error: "Invalid date" }, 400);
  }

  const openDate = new Date(open_date);
  if (isNaN(openDate.getTime())) {
    return c.json({ error: "Invalid open_date" }, 400);
  }
  if (openDate >= deadlineDate) {
    return c.json({ error: "Open date must be before deadline" }, 400);
  }

  const graceDays = safeParseInt(grace_period_days, 0, 0, 30);
  if (graceDays < 0 || graceDays > 30) {
    return c.json({ error: "Grace period must be between 0 and 30 days" }, 400);
  }

  const periodRange = parseMonthRangePayload(
    period_start_month,
    period_end_month,
    getDefaultTrimesterRange(trimester),
  );
  if (typeof periodRange === "string") {
    return c.json({ error: periodRange }, 400);
  }

  const existing = await prisma.trimesterDeadline.findUnique({
    where: { year_trimester: { year: parsedYear, trimester } },
  });
  const deadline = await (prisma.trimesterDeadline as any).upsert({
    where: { year_trimester: { year: parsedYear, trimester } },
    update: {
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
      period_start_month: periodRange.start,
      period_end_month: periodRange.end,
    },
    create: {
      year: parsedYear,
      trimester,
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
      period_start_month: periodRange.start,
      period_end_month: periodRange.end,
    },
  });

  await writeAuditLog(
    admin.id,
    "changed_trimester_deadline",
    "TrimesterDeadline",
    deadline.id,
    {
      year: parsedYear,
      trimester,
      newDate: date,
      previousDate: existing?.date ?? null,
      newOpenDate: open_date,
      previousOpenDate: existing?.open_date ?? null,
      periodStartMonth: periodRange.start,
      periodEndMonth: periodRange.end,
      previousPeriodStartMonth: (existing as any)?.period_start_month ?? null,
      previousPeriodEndMonth: (existing as any)?.period_end_month ?? null,
    },
    { ctx: c },
  );
  return c.json(deadline);
});

deadlinesRoutes.delete("/deadlines/trimesters/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.trimesterDeadline.delete({ where: { id } });
  await writeAuditLog(
    admin.id,
    "reset_trimester_deadline",
    "TrimesterDeadline",
    id,
    {},
    { ctx: c },
  );
  return c.json({ success: true });
});

deadlinesRoutes.delete("/deadlines/:id", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.deadline.delete({ where: { id } });
  await writeAuditLog(admin.id, "reset_deadline", "Deadline", id, {}, {
    ctx: c,
  });
  return c.json({ success: true });
});

deadlinesRoutes.get("/deadlines/history", async (c) => {
  const logs = await prisma.auditLog.findMany({
    where: { entity_type: { in: ["Deadline", "TrimesterDeadline"] } },
    include: { admin: { select: { name: true, email: true } } },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return c.json(logs);
});

export default deadlinesRoutes;
