import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting to seed the database...");

  // Clear existing data (order matters due to FK constraints)
  await prisma.parkingSession.deleteMany({});
  await prisma.sensorLog.deleteMany({});
  await prisma.parkingSlot.deleteMany({});
  await prisma.road.deleteMany({});
  await prisma.pricingRule.deleteMany({});
  await prisma.privilegeParking.deleteMany({});
  await prisma.mall.deleteMany({});
  await prisma.registeredVehicle.deleteMany({});
  await prisma.userCard.deleteMany({});
  await prisma.privilegeProgram.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleared existing data");

  // ---------------------------------------------------------
  // Admin User
  // ---------------------------------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@smartpark.com",
      password_hash: passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log("Created admin user");

  // ---------------------------------------------------------
  // Privilege Programs
  // ---------------------------------------------------------
  await Promise.all([
    prisma.privilegeProgram.create({
      data: {
        provider_name: "SCB First",
        tier: "Private Banking",
        eligible_bins: ["541000"],
        max_vehicles: 3,
      },
    }),
    prisma.privilegeProgram.create({
      data: {
        provider_name: "The 1 Card",
        tier: "Black",
        eligible_bins: ["528500"],
        max_vehicles: 2,
      },
    }),
    prisma.privilegeProgram.create({
      data: {
        provider_name: "Kasikorn The Wisdom",
        tier: "Platinum",
        eligible_bins: ["488800"],
        max_vehicles: 3,
      },
    }),
    prisma.privilegeProgram.create({
      data: {
        provider_name: "KTC Ultimate",
        tier: "ULTIMATE",
        eligible_bins: ["356300"],
        max_vehicles: 1,
      },
    }),
  ]);
  console.log("Created privilege programs");

  // Done
  console.log("Seeding complete.");
  return;

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
