import { prisma } from "../db/client.ts";

async function main() {
  console.log("Fixing database sequences...");
  
  try {
    const sequences = [
      { table: 'schools', seq: 'schools_id_seq' },
      { table: 'clusters', seq: 'clusters_id_seq' },
      { table: 'programs', seq: 'programs_id_seq' },
      { table: '"User"', seq: '"User_id_seq"' },
      { table: '"AIP"', seq: '"AIP_id_seq"' },
      { table: '"PIR"', seq: '"PIR_id_seq"' }
    ];

    for (const { table, seq } of sequences) {
      await prisma.$executeRawUnsafe(`SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM ${table}), 1));`);
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
