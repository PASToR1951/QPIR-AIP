import { prisma } from "../db/client.ts";

async function main() {
  console.log("Fixing database sequences...");

  try {
    const sequences = [
      { table: "public.schools", seq: "public.schools_id_seq" },
      { table: "public.clusters", seq: "public.clusters_id_seq" },
      { table: "public.programs", seq: "public.programs_id_seq" },
      { table: 'public."User"', seq: '"User_id_seq"' },
      { table: 'public."AIP"', seq: '"AIP_id_seq"' },
      { table: 'public."PIR"', seq: '"PIR_id_seq"' },
    ];

    for (const { table, seq } of sequences) {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          '${seq}'::regclass,
          COALESCE((SELECT MAX(id) FROM ${table}), 1),
          (SELECT MAX(id) IS NOT NULL FROM ${table})
        );
      `);
      console.log(`Synced sequence for ${table}`);
    }

    console.log("All sequences synced successfully.");
  } catch (error) {
    console.error("Error syncing sequences:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
