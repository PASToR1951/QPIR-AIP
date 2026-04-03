import pkg from "npm:@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "npm:@prisma/adapter-pg";
import pg from "npm:pg";
import bcrypt from "npm:bcryptjs";
import jwt from "npm:jsonwebtoken";

const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgresql://postgres:password@localhost:5432/pir_system?schema=public";
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-secret-key-change-in-production";
const TOKEN_FILE = new URL(".audit_tokens.json", import.meta.url).pathname;

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🛠️  Setting up AASSA Audit Identities...");

  // Verify that the schools we need actually exist before creating users
  const school1 = await prisma.school.findUnique({ where: { id: 1 } });
  const school2 = await prisma.school.findUnique({ where: { id: 2 } });

  if (!school1) {
    console.error("❌ School with id=1 not found. Cannot create audit-school-a@local.");
    await prisma.$disconnect();
    await pool.end();
    Deno.exit(1);
  }
  if (!school2) {
    console.error("❌ School with id=2 not found. Cannot create audit-school-b@local.");
    await prisma.$disconnect();
    await pool.end();
    Deno.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("AuditPass123!", salt);

  const auditUsers = [
    { email: "audit-admin@local", role: "Admin", school_id: undefined, name: "Audit Administrator" },
    { email: "audit-school-a@local", role: "School", school_id: 1, name: "Audit School A" },
    { email: "audit-school-b@local", role: "School", school_id: 2, name: "Audit School B" },
  ];

  const results: Record<string, { id: number; token: string }> = {};

  for (const u of auditUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPassword, role: u.role, school_id: u.school_id ?? null, is_active: true },
      create: {
        email: u.email,
        password: hashedPassword,
        role: u.role,
        name: u.name,
        school_id: u.school_id ?? null,
        is_active: true,
      },
      include: { school: true },
    });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        school_id: user.school_id,
        cluster_id: (user.school as any)?.cluster_id ?? null,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    results[u.email] = { id: user.id, token };
    console.log(`✅ ${u.email} (id=${user.id}) created/updated.`);
  }

  // Write tokens to file so adversarial_audit.ts can load them without manual copy-paste
  await Deno.writeTextFile(TOKEN_FILE, JSON.stringify(results, null, 2));
  console.log(`\n🔑 Tokens written to ${TOKEN_FILE}`);
  console.log("   Run adversarial_audit.ts within 24h before they expire.\n");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
