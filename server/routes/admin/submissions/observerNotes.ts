import { Hono } from "hono";
import pkg from "@prisma/client";
import { prisma } from "../../../db/client.ts";

const { Prisma } = pkg;
import { getUserFromToken } from "../../../lib/auth.ts";
import { safeParseInt } from "../../../lib/safeParseInt.ts";
import { sanitizeObject } from "../../../lib/sanitize.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { canUpdateObserverNotes } from "../shared/observerAccess.ts";
import { MAX_TEXT_LENGTH, validateTextLength } from "./validation.ts";

export const observerNotesRouter = new Hono();

function isRecordNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025";
}

// PATCH /submissions/:id/observer-notes
observerNotesRouter.patch("/submissions/:id/observer-notes", async (c) => {
  const actor = (await getUserFromToken(c))!;
  if (!canUpdateObserverNotes(actor)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = safeParseInt(c.req.param("id"), 0);
  const body = sanitizeObject(await c.req.json());
  const type = typeof body.type === "string"
    ? body.type.toLowerCase()
    : c.req.query("type")?.toLowerCase();
  const notes = typeof body.notes === "string" ? body.notes : "";

  if (type !== "aip" && type !== "pir") {
    return c.json({ error: "type must be aip or pir" }, 400);
  }

  const lengthError = validateTextLength(notes, "Observer notes");
  if (lengthError) return c.json({ error: lengthError }, 400);

  if (type === "pir") {
    try {
      const pir = await prisma.pIR.update({
        where: { id },
        data: { observer_notes: notes } as Parameters<
          typeof prisma.pIR.update
        >[0]["data"],
      });
      await writeAuditLog(actor.id, "updated_observer_notes", "PIR", id, {
        actor_role: actor.role,
        notes_length: notes.length,
      }, { ctx: c });
      return c.json({
        success: true,
        observer_notes: (pir as Record<string, unknown>).observer_notes ??
          notes,
      });
    } catch (err) {
      if (isRecordNotFound(err)) return c.json({ error: "Not found" }, 404);
      throw err;
    }
  }

  try {
    const aip = await prisma.aIP.update({
      where: { id },
      data: { observer_notes: notes } as Parameters<
        typeof prisma.aIP.update
      >[0]["data"],
    });
    await writeAuditLog(actor.id, "updated_observer_notes", "AIP", id, {
      actor_role: actor.role,
      notes_length: notes.length,
    }, { ctx: c });
    return c.json({
      success: true,
      observer_notes: (aip as Record<string, unknown>).observer_notes ?? notes,
    });
  } catch (err) {
    if (isRecordNotFound(err)) return c.json({ error: "Not found" }, 404);
    throw err;
  }
});

export { MAX_TEXT_LENGTH };
