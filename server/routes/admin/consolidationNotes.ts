import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { isValidQuarter } from "./shared/dates.ts";
import { parseOptionalPositiveInt } from "./shared/params.ts";

const consolidationNotesRoutes = new Hono();

const QUARTER_PREFIXES: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

// Roles that may read consolidation data
const READ_ROLES = new Set(["Admin", "Observer"]);

// Field → roles that may write that field
const FIELD_WRITE_ROLES: Record<string, Set<string>> = {
  gaps: new Set(["Admin"]),
  recommendations: new Set(["Admin"]),
  management_response: new Set(["Admin", "Observer"]),
};

function parseYearQuarter(c: { req: { query: (k: string) => string | undefined } }) {
  const year = safeParseInt(c.req.query("year"), 0, 2020, 2100);
  const quarter = safeParseInt(c.req.query("quarter"), 0, 1, 4);
  return { year, quarter };
}

// GET /reports/consolidation — PIR stats aggregated by program (physicalRate, schoolCount, taSchools)
consolidationNotesRoutes.get("/reports/consolidation", async (c) => {
  const user = await getUserFromToken(c);
  if (!user || !READ_ROLES.has(user.role)) return c.json({ error: "Forbidden" }, 403);

  const year = safeParseInt(c.req.query("year"), 0, 2020, 2100);
  const quarter = safeParseInt(c.req.query("quarter"), 0, 1, 4);
  if (year < 2020 || year > 2100) return c.json({ error: "Invalid year" }, 400);
  if (!isValidQuarter(quarter) || quarter === 0) return c.json({ error: "Invalid quarter" }, 400);

  const clusterId = parseOptionalPositiveInt(c.req.query("cluster"));
  const schoolId = parseOptionalPositiveInt(c.req.query("school"));
  const statusParam = c.req.query("statuses");
  const statuses = statusParam ? statusParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const quarterPrefix = QUARTER_PREFIXES[quarter];

  try {
    const schoolWhere = schoolId
      ? { id: schoolId }
      : clusterId
      ? { cluster_id: clusterId }
      : undefined;

    const [pirs, schools, programs] = await Promise.all([
      prisma.pIR.findMany({
        where: {
          quarter: { startsWith: quarterPrefix },
          ...(statuses.length ? { status: { in: statuses } } : {}),
          aip: {
            year,
            ...(schoolWhere ? { school: schoolWhere } : {}),
          },
        },
        select: {
          aip: { select: { program_id: true, school_id: true } },
          activity_reviews: {
            select: { physical_target: true, physical_accomplished: true },
          },
        },
      }),
      prisma.school.findMany({
        where: schoolWhere ?? {},
        select: {
          id: true,
          level: true,
          restricted_programs: { select: { id: true } },
        },
      }),
      prisma.program.findMany({
        select: { id: true, school_level_requirement: true },
      }),
    ]);

    // Eligible school count per program (for TA denominator)
    const eligibleCount = new Map<number, number>();
    for (const program of programs) {
      if (program.school_level_requirement === "Division") {
        eligibleCount.set(program.id, 0);
        continue;
      }
      let count = 0;
      for (const school of schools) {
        const eligible =
          program.school_level_requirement === "Both" ||
          program.school_level_requirement === school.level ||
          (program.school_level_requirement === "Select Schools" &&
            !school.restricted_programs.some((rp) => rp.id === program.id));
        if (eligible) count++;
      }
      eligibleCount.set(program.id, count);
    }

    // Aggregate PIRs by program
    type Agg = { schoolIds: Set<number>; physSum: number; physTarget: number };
    const byProgram = new Map<number, Agg>();
    for (const pir of pirs) {
      const pid = pir.aip.program_id;
      if (!byProgram.has(pid)) {
        byProgram.set(pid, { schoolIds: new Set(), physSum: 0, physTarget: 0 });
      }
      const agg = byProgram.get(pid)!;
      if (pir.aip.school_id) agg.schoolIds.add(pir.aip.school_id);
      for (const r of pir.activity_reviews) {
        agg.physSum += Number(r.physical_accomplished);
        agg.physTarget += Number(r.physical_target);
      }
    }

    const groups = Array.from(byProgram.entries()).map(([id, agg]) => ({
      id,
      physicalRate: agg.physTarget > 0 ? Math.round((agg.physSum / agg.physTarget) * 100) : null,
      taSchoolsCount: agg.schoolIds.size,
      taSchoolsTotal: eligibleCount.get(id) ?? 0,
    }));

    return c.json({ groups, year, quarter });
  } catch (e) {
    console.error("[reports/consolidation GET]", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /consolidation-notes — saved notes + auto-recommendations from CES remarks on PIRs
consolidationNotesRoutes.get("/consolidation-notes", async (c) => {
  const user = await getUserFromToken(c);
  if (!user || !READ_ROLES.has(user.role)) return c.json({ error: "Forbidden" }, 403);

  const { year, quarter } = parseYearQuarter(c);
  if (year < 2020 || year > 2100) return c.json({ error: "Invalid year (must be 2020–2100)" }, 400);
  if (!isValidQuarter(quarter) || quarter === 0) return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);

  const quarterPrefix = QUARTER_PREFIXES[quarter];

  try {
    const [notes, pirRemarks] = await Promise.all([
      prisma.consolidationNote.findMany({ where: { year, quarter } }),
      prisma.pIR.findMany({
        where: {
          aip: { year },
          quarter: { startsWith: quarterPrefix },
          ces_remarks: { not: null },
        },
        select: {
          ces_remarks: true,
          aip: {
            select: {
              program_id: true,
              school: { select: { abbreviation: true, name: true } },
            },
          },
        },
      }),
    ]);

    // CES remarks on PIRs → auto-suggestions for Recommendations column
    const auto_recommendations: Record<number, string> = {};
    for (const pir of pirRemarks) {
      const pid = pir.aip.program_id;
      const school = pir.aip.school?.abbreviation || pir.aip.school?.name || "Division";
      const line = `${school}: ${pir.ces_remarks!.trim()}`;
      auto_recommendations[pid] = auto_recommendations[pid]
        ? `${auto_recommendations[pid]}\n\n${line}`
        : line;
    }

    return c.json({ notes, auto_recommendations });
  } catch (e) {
    console.error("[consolidation-notes GET]", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PUT /consolidation-notes — field-level update; role checked per field
consolidationNotesRoutes.put("/consolidation-notes", async (c) => {
  const user = await getUserFromToken(c);
  if (!user || !READ_ROLES.has(user.role)) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json();
  const year = safeParseInt(body.year, 0, 2020, 2100);
  const quarter = safeParseInt(body.quarter, 0, 1, 4);
  const program_id = safeParseInt(body.program_id, 0);
  const { field, value } = body;

  if (year < 2020 || year > 2100) return c.json({ error: "Invalid year" }, 400);
  if (!isValidQuarter(quarter) || quarter === 0) return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);
  if (!program_id || program_id < 1) return c.json({ error: "Invalid program_id" }, 400);
  if (typeof value !== "string") return c.json({ error: "Value must be a string" }, 400);

  const allowedRoles = FIELD_WRITE_ROLES[field];
  if (!allowedRoles) return c.json({ error: `Field '${field}' is not editable` }, 400);
  if (!allowedRoles.has(user.role)) {
    return c.json({ error: "Forbidden: your role cannot edit this field" }, 403);
  }

  const program = await prisma.program.findUnique({ where: { id: program_id } });
  if (!program) return c.json({ error: "Program not found" }, 404);

  let note;
  try {
    note = await prisma.consolidationNote.upsert({
      where: { year_quarter_program_id: { year, quarter, program_id } },
      update: { [field]: value },
      create: { year, quarter, program_id, [field]: value },
    });
  } catch (e) {
    console.error("[consolidation-notes PUT]", e);
    return c.json({ error: "Internal server error" }, 500);
  }

  await writeAuditLog(
    user.id,
    "updated_consolidation_note",
    "ConsolidationNote",
    note.id,
    { year, quarter, program_id, field },
    { ctx: c },
  );

  return c.json({ note });
});

export default consolidationNotesRoutes;
