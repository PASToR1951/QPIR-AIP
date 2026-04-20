import { Hono } from "hono";
import { prisma } from "../../../db/client.ts";
import { adminOnly } from "../shared/guards.ts";
import { resolveEntityLabels } from "./entityResolver.ts";
import { buildLogDetailQuery } from "./query.ts";
import { buildAdminLogRow, type RawAdminLogRow } from "./shared.ts";

export const detailRoutes = new Hono();

detailRoutes.use("/logs/:source/:id", adminOnly);

detailRoutes.get("/logs/:source/:id", async (c) => {
  const source = c.req.param("source");
  const id = Number(c.req.param("id"));

  if ((source !== "admin" && source !== "user") || !Number.isInteger(id) || id < 1) {
    return c.json({ error: "Invalid log reference." }, 400);
  }

  try {
    const rows = await prisma.$queryRaw<RawAdminLogRow[]>(
      buildLogDetailQuery(source, id),
    );
    const row = rows[0];
    if (!row) return c.json({ error: "Log entry not found." }, 404);

    const entityLabels = await resolveEntityLabels([row]);
    return c.json(buildAdminLogRow(row, {
      entityLabels,
      includeDetails: true,
    }));
  } catch (error) {
    console.error("[admin logs detail]", error);
    return c.json({ error: "Failed to load log entry." }, 500);
  }
});
