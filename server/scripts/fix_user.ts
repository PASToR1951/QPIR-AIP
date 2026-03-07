import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = Deno.env.get("DATABASE_URL");
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixUser() {
  try {
    const updatedUser = await prisma.user.update({
      where: { email: "120233@deped.gov.ph" },
      data: {
        school_id: 44, // Antibalas ES ID
        name: null     // Removing the redundant name
      }
    });
    console.log("✅ User updated to Antibalas ES and redundant Name removed.");
    console.log(updatedUser);
  } catch (error) {
    console.error("❌ Error updating user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
