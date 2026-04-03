import { prisma } from "./db/client.ts";

async function main() {
  const res = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'division_programs' AND column_name = 'division'`;
  console.log(res);
}

main().finally(() => Deno.exit(0));
