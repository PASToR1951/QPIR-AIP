import pkg from "npm:@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "npm:@prisma/adapter-pg";
import pg from "npm:pg";

const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgresql://postgres:password@localhost:5432/pir_system?schema=public";
const TOKEN_FILE = new URL(".audit_tokens.json", import.meta.url).pathname;

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹  Cleaning up AASSA Audit Data...");

  const auditEmails = ["audit-admin@local", "audit-school-a@local", "audit-school-b@local"];

  const users = await prisma.user.findMany({
    where: { email: { in: auditEmails } },
  });
  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) {
    console.log("ℹ️  No audit identities found to purge.");
  } else {
    // PIRActivityReview and PIRFactor cascade-delete from PIR (onDelete: Cascade in schema),
    // and PIR cascades from AIP, and AIP cascades from User — but we delete explicitly
    // here for clarity and to get accurate counts.

    const pirResult = await prisma.pIR.deleteMany({
      where: { created_by_user_id: { in: userIds } },
    });

    const aipResult = await prisma.aIP.deleteMany({
      where: { created_by_user_id: { in: userIds } },
    });

    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log(`✅ Purged ${userIds.length} audit user(s), ${pirResult.count} PIR(s), ${aipResult.count} AIP(s).`);
  }

  // Remove the token cache file if it exists
  try {
    await Deno.remove(TOKEN_FILE);
    console.log(`🗑️  Removed token cache: ${TOKEN_FILE}`);
  } catch {
    // File doesn't exist — nothing to remove
  }

  await prisma.$disconnect();
  await pool.end();
  console.log("✨ Cleanup complete.");
}

main().catch(console.error);
