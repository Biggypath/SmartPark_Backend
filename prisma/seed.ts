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
  await prisma.pricingRule.deleteMany({}); // Must delete PricingRule before PrivilegeParking
  await prisma.privilegeParking.deleteMany({}); // Renamed from parkingLot
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
        eligible_bins: ["412345", "543210"],
        free_hours: 5,
        max_vehicles: 3,
      },
    }),
    prisma.privilegeProgram.create({
      data: {
        provider_name: "The 1 Card",
        tier: "Gold",
        eligible_bins: ["456789"], 
        free_hours: 2,
        max_vehicles: 2,
      },
    }),
    prisma.privilegeProgram.create({
      data: {
        provider_name: "The 1 Card",
        tier: "Platinum",
        eligible_bins: ["371234"], 
        free_hours: 3,
        max_vehicles: 3,
      },
    }),
  ]);

  console.log(`Created 3 privilege programs`);

  // Create user cards
  const [card1, card2, card3] = await Promise.all([
    prisma.userCard.create({
      data: { 
        user_id: user1!.user_id, 
        program_id: scbFirst!.program_id,
        network: "VISA",
        bin: "412345",
        last_four: "1234",
        expiry_month: 12,
        expiry_year: 2028
      },
    }),
    prisma.userCard.create({
      data: { 
        user_id: user1!.user_id, 
        program_id: the1Gold!.program_id,
        network: "MASTERCARD",
        bin: "456789",
        last_four: "5678",
        expiry_month: 10,
        expiry_year: 2026
      },
    }),
    prisma.userCard.create({
      data: { 
        user_id: user2!.user_id, 
        program_id: the1Plat!.program_id,
        network: "AMEX",
        bin: "371234",
        last_four: "9012",
        expiry_month: 5,
        expiry_year: 2029
      },
    }),
  ]);

  console.log(`Created 3 user cards`);

  // Create registered vehicles
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

  // Create Privilege Parking Lots AND their linked Pricing Rules using nested writes
  const [lotCW1, lotCWSCB, lotParagonSCB] = await Promise.all([
    prisma.privilegeParking.create({
      data: { 
        name: "CentralWorld The 1 Card", 
        location: "CentralWorld, Bangkok",
        pricingRule: { create: { rate_per_hour: 20.0 } }
      },
    }),
    prisma.privilegeParking.create({
      data: { 
        name: "CentralWorld SCB First", 
        location: "CentralWorld, Bangkok",
        pricingRule: { create: { rate_per_hour: 25.0 } }
      },
    }),
    prisma.privilegeParking.create({
      data: { 
        name: "Paragon SCB First", 
        location: "Siam Paragon, Bangkok",
        pricingRule: { create: { rate_per_hour: 30.0 } }
      },
    }),
  ]);

  console.log(`Created 3 privilege parking lots with their associated pricing rules`);

  // Create parking slots (5 slots per lot = 15 slots total)
  const lots = [lotCW1!, lotCWSCB!, lotParagonSCB!];
  const slots = [];
  for (let lotIdx = 0; lotIdx < lots.length; lotIdx++) {
    const lot = lots[lotIdx]!;
    for (let col = 0; col < 5; col++) {
      const label = String.fromCharCode(65 + lotIdx) + (col + 1);

      slots.push(
        prisma.parkingSlot.create({
          data: {
            slot_id: label,
            lot_id: lot.lot_id, // Links to the PrivilegeParking lot_id
            status: "FREE",
            location_coordinates: JSON.stringify({ x: col * 10, y: lotIdx * 10, z: 0 }),
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

  // Create parking sessions
  const now = new Date();

  const sessions = await Promise.all([
    prisma.parkingSession.create({
      data: {
        slot_id: parkingSlots[0]!.slot_id,
        registration: vehicle1!.registration,
        province: "กรุงเทพมหานคร",
        vehicle_id: vehicle1!.vehicle_id,
        entry_time: new Date(now.getTime() - 4 * 3600000),
        exit_time: new Date(now.getTime() - 1 * 3600000),
        duration_minutes: 180,
        total_fee: 0, 
        payment_status: "PAID",
      },
    }),
    prisma.parkingSession.create({
      data: {
        registration: "9ดจ 4444",
        province: "ชลบุรี",
        vehicle_id: null,
        entry_time: new Date(now.getTime() - 3 * 3600000),
        exit_time: new Date(now.getTime() - 0.5 * 3600000),
        duration_minutes: 150,
        total_fee: 60, 
        payment_status: "PAID",
      },
    }),
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
    prisma.parkingSession.create({
      data: {
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