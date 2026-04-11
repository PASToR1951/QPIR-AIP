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

const deadlinesRoutes = new Hono();

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
    const custom = deadlines.find((deadline) => deadline.quarter === quarter);
    return {
      quarter,
      year,
      date: custom ? custom.date : buildDefaultDeadline(year, quarter),
      open_date: custom?.open_date ?? null,
      grace_period_days: custom?.grace_period_days ?? 0,
      isCustom: !!custom,
      id: custom?.id ?? null,
    };
  });
  return c.json(result);
});

deadlinesRoutes.post("/deadlines", async (c) => {
  const admin = getUserFromToken(c)!;
  const { year, quarter, date, open_date, grace_period_days } = await c.req
    .json();

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

  const existing = await prisma.deadline.findUnique({
    where: { year_quarter: { year: parsedYear, quarter } },
  });
  const deadline = await prisma.deadline.upsert({
    where: { year_quarter: { year: parsedYear, quarter } },
    update: {
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
    },
    create: {
      year: parsedYear,
      quarter,
      date: deadlineDate,
      open_date: openDate,
      grace_period_days: graceDays,
    },
  });

  await writeAuditLog(admin.id, "changed_deadline", "Deadline", deadline.id, {
    year: parsedYear,
    quarter,
    newDate: date,
    previousDate: existing?.date ?? null,
  });
  return c.json(deadline);
});

deadlinesRoutes.delete("/deadlines/:id", async (c) => {
  const admin = getUserFromToken(c)!;
  const id = safeParseInt(c.req.param("id"), 0);
  await prisma.deadline.delete({ where: { id } });
  await writeAuditLog(admin.id, "reset_deadline", "Deadline", id, {});
  return c.json({ success: true });
});

deadlinesRoutes.get("/deadlines/history", async (c) => {
  const logs = await prisma.auditLog.findMany({
    where: { entity_type: "Deadline" },
    include: { admin: { select: { name: true, email: true } } },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return c.json(logs);
});

export default deadlinesRoutes;
