import { prisma } from "../db/client.ts";
import bcrypt from "npm:bcryptjs@^2.4.3";

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("123456", salt);
  
  await prisma.user.upsert({
    where: { email: "ces@qpir.local" },
    update: {},
    create: {
      email: "ces@qpir.local",
      password: hashedPassword,
      role: "CES Reviewer",
      name: "Demo CES Reviewer",
      is_active: true
    }
  });
  console.log("CES user created: ces@qpir.local / 123456");
}

main().finally(() => prisma.$disconnect());
