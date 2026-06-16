const { PrismaClient } = require("../../server/node_modules/@prisma/client/index.js");
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({where: {role: "CES Reviewer"}});
  console.log("CES Users:", users.map(u => u.email));
}
run().catch(console.error).finally(() => prisma.$disconnect());
