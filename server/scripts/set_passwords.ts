import { prisma } from "../db/client.ts";
import bcrypt from "npm:bcryptjs@^2.4.3";

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("123456", salt);
  
  await prisma.user.updateMany({
    where: { email: { in: ['pir-demo-gscs@local', 'pir-demo-gnhs-p@local', 'pir-demo-division@local'] } },
    data: { password: hashedPassword }
  });
  console.log("Passwords set to 123456 for demo accounts.");
}

main().finally(() => prisma.$disconnect());
