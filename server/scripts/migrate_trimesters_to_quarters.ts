import { prisma } from "../db/client.ts";

async function main() {
    console.log("Starting migration: Trimesters to Quarters...");

    // Find all PIRs that have "Trimester" in their quarter field
    const pirs = await (prisma as any).pIR.findMany({
        where: {
            quarter: {
                contains: "Trimester",
            },
        },
    });

    console.log(`Found ${pirs.length} PIRs to migrate.`);

    let migratedCount = 0;

    for (const pir of pirs) {
        const match = pir.quarter.match(/^([1-3])(?:st|nd|rd)\s+Trimester\s+CY\s+(\d{4})$/i);
        if (match) {
            const trimesterNum = parseInt(match[1], 10);
            const year = match[2];

            const ordinals = { 1: "1st", 2: "2nd", 3: "3rd" };
            const newQuarterString = `${ordinals[trimesterNum as keyof typeof ordinals]} Quarter CY ${year}`;

            await (prisma as any).pIR.update({
                where: { id: pir.id },
                data: { quarter: newQuarterString },
            });
            migratedCount++;
        }
    }

    console.log(`Successfully migrated ${migratedCount} PIRs.`);
}

main()
    .catch((e) => {
        console.error("Migration failed:");
        console.error(e);
        Deno.exit(1);
    })
    .finally(() => {
        Deno.exit(0);
    });
