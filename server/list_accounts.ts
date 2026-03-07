
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = Deno.env.get("DATABASE_URL");
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  Deno.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listUsers() {
  console.log("Fetching registered accounts...\n");

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        created_at: true,
        school: {
          select: {
            name: true
          }
        }
      }
    });

    if (users.length === 0) {
      console.log("No accounts found in the database.");
    } else {
      console.table(users.map(u => ({
        ID: u.id,
        Name: u.name || "N/A",
        Email: u.email,
        Role: u.role,
        School: (u as any).school?.name || "N/A",
        Created: u.created_at
      })));
    }

  } catch (error) {
    console.error("❌ Failed to fetch users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
