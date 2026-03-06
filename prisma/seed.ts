import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@satisfycam.com" },
    update: {},
    create: {
      email: "admin@satisfycam.com",
      password: hashedPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  console.log("Seed completed: admin@satisfycam.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
