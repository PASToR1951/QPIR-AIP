import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import { getUserFromToken } from "../../../lib/auth.ts";
import { writeAuditLog } from "../shared/audit.ts";
import { documentWhereFromRef } from "../shared/documentRefs.ts";
import {
  SUBMISSION_DETAIL_AIP_INCLUDE,
  SUBMISSION_DETAIL_PIR_INCLUDE,
} from "../shared/prismaSelects.ts";

export const detailRouter = new Hono();

// GET /submissions/:id
detailRouter.get("/submissions/:id", async (c) => {
  const actor = (await getUserFromToken(c))!;
  const ref = c.req.param("id");
  const type = c.req.query("type") || "aip";

  if (type === "pir") {
    const pir = await prisma.pIR.findUnique({
      where: documentWhereFromRef(ref),
      include: SUBMISSION_DETAIL_PIR_INCLUDE,
    });
    if (!pir) return c.json({ error: "Not found" }, 404);

    await writeAuditLog(actor.id, "read_pir", "PIR", pir.id, {
      quarter: pir.quarter,
      actor_role: actor.role,
    }, { ctx: c });

    return c.json(pir);
  }

  const aip = await prisma.aIP.findUnique({
    where: documentWhereFromRef(ref),
    include: SUBMISSION_DETAIL_AIP_INCLUDE,
  });
  if (!aip) return c.json({ error: "Not found" }, 404);
  return c.json(aip);
});
