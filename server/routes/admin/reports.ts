import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { toCSV, toXLSX } from "./shared/exports.ts";
import { adminOnly } from "./shared/guards.ts";
import { parseReportQuery } from "./shared/params.ts";
import {
  REPORT_AIP_INCLUDE,
  REPORT_PIR_INCLUDE,
} from "./shared/prismaSelects.ts";
import { storedFactorFieldHasContent } from "../data/shared/normalize.ts";

const reportsRoutes = new Hono();

const reportRequests = new Map<number, number[]>();
const MAX_REPORT_REQUESTS = 60;
const REPORT_WINDOW_MS = 60 * 1000;
const FACTOR_TYPES = [
  "Institutional",
  "Technical",
  "Infrastructure",
  "Learning Resources",
  "Environmental",
  "Others",
];
const QUARTER_PREFIXES: Record<number, string | undefined> = {
  0: undefined,
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
};
const QUARTER_LABELS: Record<number, string> = {
  0: "All Quarters",
  1: "1st Quarter",
  2: "2nd Quarter",
  3: "3rd Quarter",
  4: "4th Quarter",
};
const FUNNEL_STATUSES = [
  "Draft",
  "Submitted",
  "Under Review",
  "For Recommendation",
  "For CES Review",
  "For Cluster Head Review",
  "Approved",
  "Returned",
];

reportsRoutes.use("/reports/*", adminOnly);
reportsRoutes.use("/reports/*", async (c, next) => {
  const admin = (await getUserFromToken(c))!;
  const now = Date.now();
  const timestamps = (reportRequests.get(admin.id) ?? []).filter(
    (ts) => now - ts < REPORT_WINDOW_MS,
  );
  if (timestamps.length >= MAX_REPORT_REQUESTS) {
    return c.json(
      { error: "Rate limit exceeded for reports. Please wait." },
      429,
    );
  }
  timestamps.push(now);
  reportRequests.set(admin.id, timestamps);
  await next();
});

function invalidYearResponse() {
  return new Response(
    JSON.stringify({ error: "Invalid year (must be 2020–2100)" }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    },
  );
}

type AccomplishmentRow = {
  school: string;
  cluster: string;
  physSum: number;
  physCount: number;
  finSum: number;
  finCount: number;
};

function aggregateAccomplishmentBySchool(
  reviews: Array<{
    physical_target: unknown;
    physical_accomplished: unknown;
    financial_target: unknown;
    financial_accomplished: unknown;
    // deno-lint-ignore no-explicit-any
    pir: {
      aip: {
        school?: { name: string; cluster?: { name: string } | null } | null;
      };
    };
  }>,
): Record<string, AccomplishmentRow> {
  const bySchool: Record<string, AccomplishmentRow> = {};
  for (const review of reviews) {
    const school = review.pir.aip.school?.name ?? "Division";
    const cluster = review.pir.aip.school?.cluster?.name ?? "Division";
    if (!bySchool[school]) {
      bySchool[school] = {
        school,
        cluster,
        physSum: 0,
        physCount: 0,
        finSum: 0,
        finCount: 0,
      };
    }
    const physTarget = Number(review.physical_target);
    const finTarget = Number(review.financial_target);
    if (physTarget > 0) {
      bySchool[school].physSum +=
        (Number(review.physical_accomplished) / physTarget) * 100;
      bySchool[school].physCount++;
    }
    if (finTarget > 0) {
      bySchool[school].finSum +=
        (Number(review.financial_accomplished) / finTarget) * 100;
      bySchool[school].finCount++;
    }
  }
  return bySchool;
}

type ExportBuilder = (year: number) => Promise<Record<string, unknown>[]>;

const EXPORT_BUILDERS: Record<string, ExportBuilder> = {
  workload: async (_year) => {
    const personnel = await prisma.user.findMany({
      where: { role: "Division Personnel", is_active: true },
      include: { programs: true, aips: true, pirs: true },
    });
    return personnel.map((person) => ({
      Name: person.name ?? person.email,
      Email: person.email,
      Programs: person.programs.length,
      AIPs: person.aips.length,
      PIRs: person.pirs.length,
    }));
  },
  budget: async (year) => {
    const activities = await prisma.aIPActivity.findMany({
      where: { aip: { year } },
      include: { aip: { include: REPORT_AIP_INCLUDE } },
    });
    return activities.map((activity) => ({
      Program: activity.aip.program.title,
      School: activity.aip.school?.name ?? "Division",
      Activity: activity.activity_name,
      Phase: activity.phase,
      "Budget Amount": Number(activity.budget_amount),
      "Budget Source": activity.budget_source,
    }));
  },
  compliance: async (year) => {
    const aips = await prisma.aIP.findMany({
      where: { year },
      include: REPORT_AIP_INCLUDE,
    });
    return aips.map((aip) => ({
      School: aip.school?.name ?? "Division",
      Cluster: aip.school?.cluster
        ? `Cluster ${aip.school.cluster.cluster_number}`
        : "—",
      Program: aip.program.title,
      Year: aip.year,
      Status: aip.status,
    }));
  },
  quarterly: async (year) => {
    const pirs = await prisma.pIR.findMany({
      where: { aip: { year } },
      include: REPORT_PIR_INCLUDE,
    });
    return pirs.map((pir) => ({
      School: pir.aip.school?.name ?? "Division",
      Cluster: pir.aip.school?.cluster
        ? `Cluster ${pir.aip.school.cluster.cluster_number}`
        : "—",
      Program: pir.aip.program.title,
      Quarter: pir.quarter,
      Year: pir.aip.year,
      Status: pir.status,
    }));
  },
  accomplishment: async (year) => {
    const reviews = await prisma.pIRActivityReview.findMany({
      where: { pir: { aip: { year } } },
      include: {
        pir: {
          include: {
            aip: { include: { school: { include: { cluster: true } } } },
          },
        },
      },
    });
    const bySchool = aggregateAccomplishmentBySchool(reviews);
    return Object.values(bySchool).map((s) => ({
      School: s.school,
      Cluster: s.cluster,
      "Physical Rate (%)": s.physCount > 0
        ? Math.round(s.physSum / s.physCount)
        : 0,
      "Financial Rate (%)": s.finCount > 0
        ? Math.round(s.finSum / s.finCount)
        : 0,
    }));
  },
  factors: async (year) => {
    const factors = await prisma.pIRFactor.findMany({
      where: { pir: { aip: { year } } },
    });
    return FACTOR_TYPES.map((factorType) => {
      const matching = factors.filter((f) =>
        f.factor_type.trim() === factorType
      );
      const facilitating = matching.filter((f) =>
        storedFactorFieldHasContent(f.facilitating_factors)
      ).length;
      const hindering =
        matching.filter((f) =>
          storedFactorFieldHasContent(f.hindering_factors)
        ).length;
      return {
        "Factor Type": factorType,
        Facilitating: facilitating,
        Hindering: hindering,
        Total: facilitating + hindering,
      };
    });
  },
  sources: async (year) => {
    const activities = await prisma.aIPActivity.findMany({
      where: { aip: { year } },
      select: { budget_source: true, budget_amount: true },
    });
    const sourceMap: Record<string, number> = {};
    for (const a of activities) {
      const key = a.budget_source?.trim() || "Unspecified";
      sourceMap[key] = (sourceMap[key] ?? 0) + Number(a.budget_amount);
    }
    return Object.entries(sourceMap)
      .sort(([, a], [, b]) => b - a)
      .map(([source, total]) => ({ Source: source, "Total Amount": total }));
  },
  funnel: async (year) => {
    const aips = await prisma.aIP.findMany({
      where: { year },
      select: { status: true },
    });
    const total = aips.length;
    return FUNNEL_STATUSES.map((status) => {
      const count = aips.filter((a) => a.status === status).length;
      return {
        Status: status,
        Count: count,
        "% of Total": total > 0
          ? ((count / total) * 100).toFixed(1) + "%"
          : "0.0%",
      };
    }).filter((row) => Number(row.Count) > 0);
  },
};

reportsRoutes.get("/reports/years", async (c) => {
  const rows = await prisma.aIP.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  return c.json({ years: rows.map((row) => row.year) });
});

reportsRoutes.get("/reports/compliance", async (c) => {
  const { year, clusterId, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();
  if (clusterId !== undefined && clusterId < 1) {
    return c.json({ error: "Invalid cluster" }, 400);
  }

  const schools = await prisma.school.findMany({
    where: clusterId ? { cluster_id: clusterId } : undefined,
    include: {
      aips: { where: { year }, include: { program: true } },
      restricted_programs: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });
  const programs = await prisma.program.findMany({
    where: { school_level_requirement: { not: "Division" } },
    orderBy: { title: "asc" },
  });

  const matrix = schools.map((school) => {
    const row: Record<string, unknown> = {
      schoolId: school.id,
      school: school.name,
      level: school.level,
    };
    for (const program of programs) {
      const submitted = school.aips.some((aip) =>
        aip.program_id === program.id
      );
      const eligible = program.school_level_requirement === "Both" ||
        program.school_level_requirement === school.level ||
        (program.school_level_requirement === "Select Schools" &&
          !school.restricted_programs?.some((restricted) =>
            restricted.id === program.id
          ));
      row[program.title] = eligible
        ? (submitted ? "submitted" : "missing")
        : "na";
    }
    return row;
  });

  return c.json({
    matrix,
    programs: programs.map((program) => program.title),
    year,
  });
});

reportsRoutes.get("/reports/quarterly", async (c) => {
  const { year, clusterId, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();
  if (clusterId !== undefined && clusterId < 1) {
    return c.json({ error: "Invalid cluster" }, 400);
  }

  const pirs = await prisma.pIR.findMany({
    where: {
      aip: { year, ...(clusterId && { school: { cluster_id: clusterId } }) },
    },
    include: REPORT_PIR_INCLUDE,
  });

  const summary = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"]
    .map((_, index) => {
      const quarterPirs = pirs.filter((pir) =>
        pir.quarter.startsWith(`${index + 1}`)
      );
      return {
        quarter: `Q${index + 1}`,
        submitted: quarterPirs.filter((pir) =>
          pir.status !== "Draft"
        ).length,
        pending: quarterPirs.filter((pir) =>
          ["Submitted", "For Recommendation", "For CES Review", "For Cluster Head Review", "Under Review"].includes(pir.status)
        ).length,
        approved: quarterPirs.filter((pir) => pir.status === "Approved").length,
        returned: quarterPirs.filter((pir) => pir.status === "Returned").length,
      };
    });

  return c.json({ summary, year });
});

reportsRoutes.get("/reports/budget", async (c) => {
  const { year, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();

  const activities = await prisma.aIPActivity.findMany({
    where: { aip: { year } },
    include: { aip: { include: REPORT_AIP_INCLUDE } },
  });

  const byProgram: Record<
    string,
    {
      program: string;
      total: number;
      sources: Record<string, number>;
      activityCount: number;
    }
  > = {};
  for (const activity of activities) {
    const key = activity.aip.program.title;
    if (!byProgram[key]) {
      byProgram[key] = {
        program: key,
        total: 0,
        sources: {},
        activityCount: 0,
      };
    }
    const amount = Number(activity.budget_amount);
    byProgram[key].total += amount;
    byProgram[key].activityCount += 1;
    byProgram[key].sources[activity.budget_source] =
      (byProgram[key].sources[activity.budget_source] ?? 0) + amount;
  }

  return c.json({ data: Object.values(byProgram), year });
});

reportsRoutes.get("/reports/workload", async (c) => {
  const { year, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();

  const personnel = await prisma.user.findMany({
    where: { role: "Division Personnel", is_active: true },
    include: {
      programs: true,
      aips: { where: { year } },
      pirs: { where: { aip: { year } } },
    },
  });

  return c.json(personnel.map((person) => ({
    id: person.id,
    name: person.name ?? person.email,
    email: person.email,
    programCount: person.programs.length,
    aipCount: person.aips.length,
    pirCount: person.pirs.length,
  })));
});

reportsRoutes.get("/reports/accomplishment", async (c) => {
  const { year, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();

  const reviews = await prisma.pIRActivityReview.findMany({
    where: { pir: { aip: { year } } },
    include: {
      pir: {
        include: {
          aip: { include: { school: { include: { cluster: true } } } },
        },
      },
    },
  });

  const bySchool = aggregateAccomplishmentBySchool(reviews);
  const data = Object.values(bySchool).map((s) => ({
    school: s.school,
    cluster: s.cluster,
    physicalRate: s.physCount > 0 ? Math.round(s.physSum / s.physCount) : 0,
    financialRate: s.finCount > 0 ? Math.round(s.finSum / s.finCount) : 0,
  }));

  return c.json({ data, year });
});

reportsRoutes.get("/reports/factors", async (c) => {
  const { year, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();

  const factors = await prisma.pIRFactor.findMany({
    where: { pir: { aip: { year } } },
  });

  const data = FACTOR_TYPES.map((type) => {
    const matching = factors.filter((factor) =>
      factor.factor_type.trim() === type
    );
    return {
      type,
      facilitating: matching.filter((factor) =>
        storedFactorFieldHasContent(factor.facilitating_factors)
      ).length,
      hindering: matching.filter((factor) =>
        storedFactorFieldHasContent(factor.hindering_factors)
      ).length,
    };
  });

  return c.json({ data, year });
});

reportsRoutes.get("/reports/aip-funnel", async (c) => {
  const { year, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();

  const aips = await prisma.aIP.findMany({
    where: { year },
    select: { status: true },
  });
  const data = FUNNEL_STATUSES.map((status) => ({
    status,
    count: aips.filter((aip) => aip.status === status).length,
  })).filter((row) => row.count > 0);

  return c.json({ data, year });
});

reportsRoutes.get("/reports/cluster-pir-summary", async (c) => {
  const {
    year,
    quarter,
    clusterId,
    isValidYear,
    isValidQuarter: quarterValid,
  } = parseReportQuery(c, { requireCluster: true });
  if (!isValidYear) return invalidYearResponse();
  if (!quarterValid) {
    return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);
  }
  if (!clusterId || isNaN(clusterId) || clusterId < 1) {
    return c.json({ error: "cluster parameter is required" }, 400);
  }

  const quarterPrefix = QUARTER_PREFIXES[quarter];
  if (!quarterPrefix) {
    return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);
  }

  const programs = await prisma.program.findMany({
    where: { school_level_requirement: { not: "Division" } },
    orderBy: [{ title: "asc" }],
  });
  const schools = await prisma.school.findMany({
    where: { cluster_id: clusterId },
    include: { restricted_programs: { select: { id: true } } },
    orderBy: { name: "asc" },
  });
  const aips = await prisma.aIP.findMany({
    where: {
      year,
      school_id: { in: schools.map((school) => school.id) },
    },
    include: {
      pirs: { where: { quarter: { startsWith: quarterPrefix } } },
    },
  });

  const aipMap: Record<
    number,
    Record<number, { pirId: number; presented: boolean }>
  > = {};
  for (const aip of aips) {
    if (!aip.school_id) continue;
    if (!aipMap[aip.school_id]) aipMap[aip.school_id] = {};
    const pir = aip.pirs[0];
    if (pir) {
      aipMap[aip.school_id][aip.program_id] = {
        pirId: pir.id,
        presented: pir.presented,
      };
    }
  }

  const matrix: Record<
    string,
    {
      eligible: boolean;
      pirExists: boolean;
      pirId: number | null;
      presented: boolean;
    }
  > = {};
  const totals: Record<number, { pirTool: number; presented: number }> = {};

  for (const school of schools) {
    totals[school.id] = { pirTool: 0, presented: 0 };
    for (const program of programs) {
      const eligible = program.school_level_requirement === "Both" ||
        program.school_level_requirement === school.level ||
        (program.school_level_requirement === "Select Schools" &&
          !school.restricted_programs?.some((restricted) =>
            restricted.id === program.id
          ));

      const pirData = aipMap[school.id]?.[program.id];
      const pirExists = !!pirData;
      const presented = pirData?.presented ?? false;

      matrix[`${school.id}_${program.id}`] = {
        eligible,
        pirExists,
        pirId: pirData?.pirId ?? null,
        presented,
      };

      if (eligible && pirExists) totals[school.id].pirTool++;
      if (eligible && presented) totals[school.id].presented++;
    }
  }

  return c.json({
    programs: programs.map((program) => ({
      id: program.id,
      title: program.title,
      abbreviation: program.abbreviation,
      division: (program as any).division ?? null,
    })),
    schools: schools.map((school) => ({
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
    })),
    matrix,
    totals,
    year,
    quarter,
  });
});

reportsRoutes.get("/reports/:type/export", async (c) => {
  const reportExporter = (await getUserFromToken(c))!;
  const type = c.req.param("type");
  const { year, format, isValidYear } = parseReportQuery(c);
  if (!isValidYear) return invalidYearResponse();

  const builder = EXPORT_BUILDERS[type];
  const rows = builder ? await builder(year) : [];

  await writeAuditLog(reportExporter.id, "exported_report", "Export", 0, {
    report_type: type,
    year,
    format,
    row_count: rows.length,
  }, { ctx: c });

  if (!rows.length) {
    return c.json({
      error: `No data found for report type '${type}' in year ${year}.`,
    }, 404);
  }

  if (format === "csv") {
    return new Response(toCSV(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          `attachment; filename="${type}-report-${year}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    return new Response(await toXLSX(rows, type), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="${type}-report-${year}.xlsx"`,
      },
    });
  }

  return c.json({ data: rows, type, year });
});

export default reportsRoutes;
