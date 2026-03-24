// server/lib/loadTermConfig.ts
// Loads the active term config from the database.
// Called once per request — no caching needed (primary-key lookup is sub-ms).

import { prisma } from "../db/client.ts";
import { getTermConfig, type TermConfig, type TermType } from "./termConfig.ts";

export async function loadTermConfig(): Promise<TermConfig> {
  const row = await prisma.systemConfig.findUnique({ where: { key: "term_type" } });
  const type = (row?.value ?? "Trimester") as TermType;
  return getTermConfig(type);
}
