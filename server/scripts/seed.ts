import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import bcrypt from "bcrypt";

const connectionString = Deno.env.get("DATABASE_URL");
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function parseCSV(filePath: string) {
  const text = await Deno.readTextFile(filePath);
  return parse(text, { skipFirstRow: true });
}

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Use current working directory to resolve relative paths properly
  const cwd = Deno.cwd();
  const dataDir = path.resolve(cwd, '..', 'data');

  // 1. Seed Clusters
  try {
    const clustersFile = path.join(dataDir, 'clusters.csv');
    console.log(`Loading ${clustersFile}...`);
    const clusters = await parseCSV(clustersFile);
    for (const cluster of clusters) {
      await prisma.cluster.upsert({
        where: { cluster_number: parseInt(cluster.cluster_number as string) },
        update: { name: cluster.name as string },
        create: {
          id: parseInt(cluster.id as string),
          cluster_number: parseInt(cluster.cluster_number as string),
          name: cluster.name as string,
        },
      });
    }
    console.log('✅ Clusters seeded.');
  } catch (e) {
    console.log(`⚠️ clusters.csv not found or error parsing: ${e}`);
  }

  // 2. Seed Programs
  try {
    const programsFile = path.join(dataDir, 'programs.csv');
    console.log(`Loading ${programsFile}...`);
    const programs = await parseCSV(programsFile);
    for (const program of programs) {
      const title = program.title as string;
      const schoolLevelRequirement = program.school_level_requirement as string;

      await prisma.program.upsert({
        where: {
          title_school_level_requirement: {
            title,
            school_level_requirement: schoolLevelRequirement,
          },
        },
        update: { school_level_requirement: schoolLevelRequirement },
        create: {
          id: parseInt(program.id as string),
          title,
          school_level_requirement: schoolLevelRequirement,
        },
      });
    }
    console.log('✅ Programs seeded.');
  } catch (e) {
    console.log(`⚠️ programs.csv not found or error parsing: ${e}`);
  }

  // 3. Seed Schools
  try {
    const schoolsFile = path.join(dataDir, 'schools.csv');
    console.log(`Loading ${schoolsFile}...`);
    const schools = await parseCSV(schoolsFile);
    for (const school of schools) {
      await prisma.school.upsert({
        where: { id: parseInt(school.id as string) },
        update: {
          name: school.name as string,
          level: school.level as string,
          cluster_id: parseInt(school.cluster_id as string),
        },
        create: {
          id: parseInt(school.id as string),
          name: school.name as string,
          level: school.level as string,
          cluster_id: parseInt(school.cluster_id as string),
        },
      });
    }
    console.log('✅ Schools seeded.');
  } catch (e) {
    console.log(`⚠️ schools.csv not found or error parsing: ${e}`);
  }

  // 4. Seed default Admin user (bootstrap)
  try {
    const adminEmail = 'admin@qpir.local';
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'Admin',
          name: 'System Administrator',
        },
      });
      console.log('✅ Default admin user created (admin@qpir.local / admin123)');
    } else {
      console.log('ℹ️ Admin user already exists, skipping.');
    }
  } catch (e) {
    console.log(`⚠️ Error seeding admin user: ${e}`);
  }

  console.log('🥳 Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    Deno.exit(1);
  });
