import "dotenv/config";
import { PrismaClient } from "@prisma/client";
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
  await prisma.pricingRule.deleteMany({});
  await prisma.registeredVehicle.deleteMany({});
  await prisma.userCard.deleteMany({});
  await prisma.privilegeProgram.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleared existing data");

  // --- Identity & Privilege Data ---

  // Create users
  const passwordHash = await bcrypt.hash("password123", 10);

  const [user1, user2] = await Promise.all([
    prisma.user.create({
      data: {
        email: "somchai@example.com",
        password_hash: passwordHash,
        name: "Somchai Jaidee",
      },
    }),
    prisma.user.create({
      data: {
        email: "malee@example.com",
        password_hash: passwordHash,
        name: "Malee Suksri",
      },
    }),
  ]);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@smartpark.com",
      password_hash: passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log(`Created 2 users + 1 admin`);

  // Create privilege programs
  const [scbFirst, the1Gold, the1Plat] = await Promise.all([
    prisma.privilegeProgram.create({
      data: {
        provider_name: "SCB First",
        tier: "Private Banking",
        free_hours: 5,
        max_vehicles: 3,
      },
    }),
    prisma.privilegeProgram.create({
      data: {
        provider_name: "The 1 Card",
        tier: "Gold",
        free_hours: 2,
        max_vehicles: 2,
      },
    }),
    prisma.privilegeProgram.create({
      data: {
        provider_name: "The 1 Card",
        tier: "Platinum",
        free_hours: 3,
        max_vehicles: 3,
      },
    }),
  ]);

  console.log(`Created 3 privilege programs`);

  // Create user cards
  const [card1, card2, card3] = await Promise.all([
    prisma.userCard.create({
      data: { user_id: user1!.user_id, program_id: scbFirst!.program_id },
    }),
    prisma.userCard.create({
      data: { user_id: user1!.user_id, program_id: the1Gold!.program_id },
    }),
    prisma.userCard.create({
      data: { user_id: user2!.user_id, program_id: the1Plat!.program_id },
    }),
  ]);

  console.log(`Created 3 user cards`);

  // Create registered vehicles (linked to cards via M:N)
  const [vehicle1, vehicle2, vehicle3] = await Promise.all([
    prisma.registeredVehicle.create({
      data: {
        registration: "1กข 1234",
        province: "กรุงเทพมหานคร",
        cards: { connect: [{ card_id: card1!.card_id }, { card_id: card2!.card_id }] },
      },
    }),
    prisma.registeredVehicle.create({
      data: {
        registration: "2ขค 5678",
        province: "เชียงใหม่",
        cards: { connect: [{ card_id: card1!.card_id }] },
      },
    }),
    prisma.registeredVehicle.create({
      data: {
        registration: "3คง 9012",
        province: "กรุงเทพมหานคร",
        cards: { connect: [{ card_id: card3!.card_id }] },
      },
    }),
  ]);

  console.log(`Created 3 registered vehicles`);

  // --- Core Parking Data ---

  // Create pricing rules
  const pricingRules = await Promise.all([
    prisma.pricingRule.create({ data: { rate_per_hour: 20.0 } }),
    prisma.pricingRule.create({ data: { rate_per_hour: 15.0 } }),
  ]);

  console.log(`Created ${pricingRules.length} pricing rules`);

  // Create parking slots (VIP row + 3 GENERAL rows, 5 cols each = 20 slots)
  const slots = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const isVip = row === 0;
      const prefix = isVip ? "VIP" : "GEN";
      const label = String.fromCharCode(65 + row) + (col + 1);
      const slotId = `${prefix}-${label}`;

      slots.push(
        prisma.parkingSlot.create({
          data: {
            slot_id: slotId,
            slot_type: isVip ? "VIP" : "GENERAL",
            status: "FREE",
            location_coordinates: JSON.stringify({ x: col * 10, y: row * 10, z: 0 }),
            is_active: true,
          },
        })
      );
    }
  }

  const parkingSlots = await Promise.all(slots);
  console.log(`Created ${parkingSlots.length} parking slots`);

  // Create sensor logs for some slots
  const sensorLogs = [];
  for (const slot of parkingSlots.slice(0, 5)) {
    sensorLogs.push(
      prisma.sensorLog.create({
        data: {
          slot_id: slot.slot_id,
          event_type: "ENTRY",
          raw_data: JSON.stringify({ sensor_value: 1023 }),
        },
      })
    );
  }

  const logs = await Promise.all(sensorLogs);
  console.log(`Created ${logs.length} sensor logs`);

  // Create parking sessions (mix of registered vehicles and guests)
  const now = new Date();

  const sessions = await Promise.all([
    // Completed session — registered vehicle
    prisma.parkingSession.create({
      data: {
        slot_id: parkingSlots[0]!.slot_id,
        registration: vehicle1!.registration,
        province: "กรุงเทพมหานคร",
        vehicle_id: vehicle1!.vehicle_id,
        entry_time: new Date(now.getTime() - 4 * 3600000),
        exit_time: new Date(now.getTime() - 1 * 3600000),
        duration_minutes: 180,
        total_fee: 0, // Covered by SCB First (5 free hours)
        payment_status: "PAID",
      },
    }),
    // Completed session — guest
    prisma.parkingSession.create({
      data: {
        slot_id: parkingSlots[5]!.slot_id,
        registration: "9ดจ 4444",
        province: "ชลบุรี",
        vehicle_id: null,
        entry_time: new Date(now.getTime() - 3 * 3600000),
        exit_time: new Date(now.getTime() - 0.5 * 3600000),
        duration_minutes: 150,
        total_fee: 60, // 3 billable hours × 20
        payment_status: "PAID",
      },
    }),
    // Active session — registered vehicle (still parked)
    prisma.parkingSession.create({
      data: {
        slot_id: parkingSlots[1]!.slot_id,
        registration: vehicle3!.registration,
        province: "กรุงเทพมหานคร",
        vehicle_id: vehicle3!.vehicle_id,
        entry_time: new Date(now.getTime() - 1 * 3600000),
        payment_status: "PENDING",
      },
    }),
    // Active session — guest (still parked)
    prisma.parkingSession.create({
      data: {
        slot_id: parkingSlots[6]!.slot_id,
        registration: "7ฉช 8888",
        province: "นนทบุรี",
        vehicle_id: null,
        entry_time: new Date(now.getTime() - 2 * 3600000),
        payment_status: "PENDING",
      },
    }),
  ]);

  // Mark active session slots as OCCUPIED
  await Promise.all([
    prisma.parkingSlot.update({ where: { slot_id: parkingSlots[1]!.slot_id }, data: { status: "OCCUPIED" } }),
    prisma.parkingSlot.update({ where: { slot_id: parkingSlots[6]!.slot_id }, data: { status: "OCCUPIED" } }),
  ]);

  console.log(`Created ${sessions.length} parking sessions`);

  console.log("✅ Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
