import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { getUserFromToken } from "../../lib/auth.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { writeAuditLog } from "./shared/audit.ts";
import { isValidQuarter } from "./shared/dates.ts";
import { adminOnly } from "./shared/guards.ts";

const consolidationNotesRoutes = new Hono();

consolidationNotesRoutes.use("/consolidation-notes", adminOnly);
consolidationNotesRoutes.use("/consolidation-notes/*", adminOnly);

const EDITABLE_FIELDS = new Set([
  "ta_schools_pct",
  "gaps",
  "recommendations",
  "management_response",
]);

consolidationNotesRoutes.get("/consolidation-notes", async (c) => {
  const year = safeParseInt(c.req.query("year"), 0, 2020, 2100);
  const quarter = safeParseInt(c.req.query("quarter"), 0, 1, 4);

  if (year < 2020 || year > 2100) {
    return c.json({ error: "Invalid year (must be 2020–2100)" }, 400);
  }
  if (!isValidQuarter(quarter) || quarter === 0) {
    return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);
  }

  const QUARTER_PREFIXES: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
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

    const auto_remarks: Record<number, string> = {};
    for (const pir of pirRemarks) {
      const pid = pir.aip.program_id;
      const school = pir.aip.school?.abbreviation || pir.aip.school?.name || "Division";
      const line = `${school}: ${pir.ces_remarks!.trim()}`;
      auto_remarks[pid] = auto_remarks[pid] ? `${auto_remarks[pid]}\n\n${line}` : line;
    }

    return c.json({ notes, auto_remarks });
  } catch (e) {
    console.error('[consolidation-notes GET]', e);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

consolidationNotesRoutes.put("/consolidation-notes", async (c) => {
  const admin = (await getUserFromToken(c))!;
  const body = await c.req.json();

  const year = safeParseInt(body.year, 0, 2020, 2100);
  const quarter = safeParseInt(body.quarter, 0, 1, 4);
  const program_id = safeParseInt(body.program_id, 0);
  const { field, value } = body;

  if (year < 2020 || year > 2100) {
    return c.json({ error: "Invalid year" }, 400);
  }
  if (!isValidQuarter(quarter) || quarter === 0) {
    return c.json({ error: "Invalid quarter (must be 1–4)" }, 400);
  }
  if (!program_id || program_id < 1) {
    return c.json({ error: "Invalid program_id" }, 400);
  }
  if (!EDITABLE_FIELDS.has(field)) {
    return c.json({ error: `Field '${field}' is not editable` }, 400);
  }
  if (typeof value !== "string") {
    return c.json({ error: "Value must be a string" }, 400);
  }

  const program = await prisma.program.findUnique({ where: { id: program_id } });
  if (!program) {
    return c.json({ error: "Program not found" }, 404);
  }

  let note;
  try {
    note = await prisma.consolidationNote.upsert({
      where: { year_quarter_program_id: { year, quarter, program_id } },
      update: { [field]: value },
      create: { year, quarter, program_id, [field]: value },
    });
  } catch (e) {
    console.error('[consolidation-notes PUT]', e);
    return c.json({ error: 'Internal server error' }, 500);
  }

  await writeAuditLog(
    admin.id,
    "updated_consolidation_note",
    "ConsolidationNote",
    note.id,
    { year, quarter, program_id, field },
    { ctx: c },
  );

  return c.json({ note });
});

export default consolidationNotesRoutes;
