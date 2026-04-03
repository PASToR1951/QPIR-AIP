import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = Deno.env.get("DATABASE_URL");
// L-3: Bounded pool — prevents connection exhaustion under load
const pool = new pg.Pool({
  connectionString,
  max: 10,                // max concurrent connections
  connectionTimeoutMillis: 5000,  // fail fast if no connection available within 5s
  idleTimeoutMillis: 30000,       // release idle connections after 30s
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
