import { prisma } from "../db/client.ts";

async function main() {
    console.log("Starting migration of Program personnel to focal_persons...");

    const programs = await prisma.program.findMany({
        include: {
            personnel: true,
            focal_persons: true,
        },
    });

    let migratedCount = 0;

    for (const program of programs) {
        if (program.personnel.length > 0) {
            // Find personnel who are not yet in focal_persons
            const newFocalPersons = program.personnel.filter(
                (person) => !program.focal_persons.some((fp) => fp.user_id === person.id)
            );

            if (newFocalPersons.length > 0) {
                console.log(`Migrating ${newFocalPersons.length} focal persons for program: ${program.title}`);
                await prisma.programFocalPerson.createMany({
                    data: newFocalPersons.map((person) => ({
                        program_id: program.id,
                        user_id: person.id,
                    })),
                    skipDuplicates: true,
                });
                migratedCount += newFocalPersons.length;
            }
        }
    }

    console.log(`Migration complete. Successfully assigned ${migratedCount} new focal persons.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
