import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

// Simple SHA-256 hashing (matches auth.routes.ts)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      email: "admin@profroid.local",
      name: "Admin User",
      password: "Admin123!",
      role: "admin",
      employeeType: null,
    },
    {
      email: "tech@profroid.local",
      name: "Tech User",
      password: "Tech123!",
      role: "employee",
      employeeType: "TECHNICIAN",
    },
    {
      email: "customer@profroid.local",
      name: "Customer User",
      password: "Customer123!",
      role: "customer",
      employeeType: null,
    },
  ];

  for (const u of users) {
    // Upsert user record
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
      },
      create: {
        id: crypto.randomUUID(),
        email: u.email,
        name: u.name,
        emailVerified: true,
      },
    });

    // Upsert profile with role and employeeType
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        role: u.role,
        employeeType: u.employeeType,
        isActive: true,
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        role: u.role,
        employeeType: u.employeeType,
        isActive: true,
      },
    });

    // Upsert account with hashed password
    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: "email", providerAccountId: u.email } },
      update: {
        accessToken: hashPassword(u.password),
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "email",
        provider: "email",
        providerAccountId: u.email,
        accessToken: hashPassword(u.password),
      },
    });

    console.log(`Seeded user ${u.email} with role ${u.role}${u.employeeType ? ` and type ${u.employeeType}` : ''}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });