import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { logger } from "../../../lib/logger.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { toCSV, toXLSX } from "../shared/exports.ts";
import { buildSubmittedBy } from "../shared/display.ts";
import { buildSubmissionFilters, parseExportFormat } from "../shared/params.ts";
import {
  AIP_SUBMISSION_INCLUDE,
  PIR_SUBMISSION_INCLUDE,
} from "../shared/prismaSelects.ts";
import {
  normalizeAIP,
  normalizePIR,
  type RawAIP,
  type RawPIR,
} from "./normalizers.ts";

export const listRouter = new Hono();

// GET /submissions
listRouter.get("/submissions", async (c) => {
  try {
    const {
      type,
      page,
      limit,
      skip,
      aipWhere,
      pirWhere,
    } = buildSubmissionFilters(c);

    const [aipTotal, pirTotal] = await Promise.all([
      prisma.aIP.count({ where: aipWhere }),
      prisma.pIR.count({ where: pirWhere }),
    ]);

    let aips: unknown[] = [];
    if (!type || type === "aip" || type === "all") {
      aips = await prisma.aIP.findMany({
        where: aipWhere,
        skip: type === "aip" ? skip : 0,
        take: type === "aip" ? limit : 100,
        orderBy: { created_at: "desc" },
        include: AIP_SUBMISSION_INCLUDE,
      });
    }

    let pirs: unknown[] = [];
    if (!type || type === "pir" || type === "all") {
      pirs = await prisma.pIR.findMany({
        where: pirWhere,
        skip: type === "pir" ? skip : 0,
        take: type === "pir" ? limit : 100,
        orderBy: { created_at: "desc" },
        include: PIR_SUBMISSION_INCLUDE,
      });
    }

    const normalizedAIPs = (aips as RawAIP[]).map(normalizeAIP);
    const normalizedPIRs = (pirs as RawPIR[]).map(normalizePIR);

    const combined = [...normalizedAIPs, ...normalizedPIRs].sort(
      (a, b) =>
        new Date(b.dateSubmitted).getTime() -
        new Date(a.dateSubmitted).getTime(),
    );

    const total = type === "aip"
      ? aipTotal
      : type === "pir"
      ? pirTotal
      : aipTotal + pirTotal;

    return c.json({
      data: type === "all" || !type
        ? combined.slice(skip, skip + limit)
        : combined,
      total,
      aipTotal,
      pirTotal,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    logger.error("GET /submissions error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /submissions/export
listRouter.get("/submissions/export", async (c) => {
  const exporter = (await getUserFromToken(c))!;
  const format = parseExportFormat(c.req.query("format"));
  const type = c.req.query("type");
  const year = c.req.query("year")
    ? safeParseInt(c.req.query("year"), 0)
    : undefined;
  const status = c.req.query("status");

  const aips = (!type || type === "aip" || type === "all")
    ? await prisma.aIP.findMany({
      where: {
        status: { not: "Draft" },
        ...(year && { year }),
        ...(status && { status }),
      },
      include: AIP_SUBMISSION_INCLUDE,
      orderBy: { created_at: "desc" },
    })
    : [];

  const pirs = (!type || type === "pir" || type === "all")
    ? await prisma.pIR.findMany({
      where: {
        status: { not: "Draft" },
        ...(status && { status }),
        aip: { ...(year && { year }) },
      },
      include: PIR_SUBMISSION_INCLUDE,
      orderBy: { created_at: "desc" },
    })
    : [];

  const rows = [
    ...aips.map((aip) => ({
      Type: "AIP",
      School: aip.school?.name ?? "Division",
      Cluster: aip.school?.cluster
        ? `Cluster ${aip.school.cluster.cluster_number}`
        : "—",
      Program: aip.program.title,
      Year: aip.year,
      Quarter: "—",
      Status: aip.status,
      "Date Submitted": aip.created_at.toISOString().slice(0, 10),
      "Submitted By": buildSubmittedBy(aip.created_by),
    })),
    ...pirs.map((pir) => ({
      Type: "PIR",
      School: pir.aip.school?.name ?? "Division",
      Cluster: pir.aip.school?.cluster
        ? `Cluster ${pir.aip.school.cluster.cluster_number}`
        : "—",
      Program: pir.aip.program.title,
      Year: pir.aip.year,
      Quarter: pir.quarter,
      Status: pir.status,
      "Date Submitted": pir.created_at.toISOString().slice(0, 10),
      "Submitted By": buildSubmittedBy(pir.created_by),
    })),
  ];

  await writeAuditLog(exporter.id, "exported_submissions", "Export", 0, {
    format,
    type: type ?? "all",
    year: year ?? "all",
    status: status ?? "all",
    row_count: rows.length,
  }, { ctx: c });

  if (format === "csv") {
    return new Response(toCSV(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-export.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    return new Response(await toXLSX(rows, "Submissions"), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="submissions-export.xlsx"`,
      },
    });
  }

  return c.json(
    { error: "Unsupported export format. Use 'csv' or 'xlsx'." },
    400,
  );
});
