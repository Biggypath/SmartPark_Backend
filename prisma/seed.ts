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
  // Identity & Privilege Data
  // ---------------------------------------------------------

  const passwordHash = await bcrypt.hash("password123", 10);

  // Users
  const [user1, user2] = await Promise.all([
    prisma.user.create({
      data: {
        email: "somchai@example.com",
        password_hash: passwordHash,
        name: "Somchai Jaidee",
        birthday: new Date("1990-05-15"),
        gender: "MALE",
      },
    }),
    prisma.user.create({
      data: {
        email: "malee@example.com",
        password_hash: passwordHash,
        name: "Malee Suksri",
        birthday: new Date("1995-08-22"),
        gender: "FEMALE",
      },
    }),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: "admin@smartpark.com",
      password_hash: passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Created 2 users + 1 admin");

  // Privilege Programs
  const [scbFirst, the1Gold, the1Plat] = await Promise.all([
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

  console.log("Created 3 privilege programs");

  // User Cards
  const [card1, card2, card3] = await Promise.all([
    prisma.userCard.create({
      data: {
        user_id: user1!.user_id,
        program_id: scbFirst!.program_id,
        cardholder_name: "SOMCHAI JAIDEE",
        label: "Personal Card",
        network: "VISA",
        bin: "412345",
        last_four: "1234",
        expiry_month: 12,
        expiry_year: 2028,
      },
    }),
    prisma.userCard.create({
      data: {
        user_id: user1!.user_id,
        program_id: the1Gold!.program_id,
        cardholder_name: "SOMCHAI JAIDEE",
        label: "Shopping Card",
        network: "MASTERCARD",
        bin: "456789",
        last_four: "5678",
        expiry_month: 10,
        expiry_year: 2026,
      },
    }),
    prisma.userCard.create({
      data: {
        user_id: user2!.user_id,
        program_id: the1Plat!.program_id,
        cardholder_name: "MALEE SUKSRI",
        label: "Work Card",
        network: "AMEX",
        bin: "371234",
        last_four: "9012",
        expiry_month: 5,
        expiry_year: 2029,
      },
    }),
  ]);

  console.log("Created 3 user cards");

  // Registered Vehicles (now includes brand / model / color)
  const [vehicle1, vehicle2, vehicle3] = await Promise.all([
    prisma.registeredVehicle.create({
      data: {
        registration: "1กข 1234",
        province: "กรุงเทพมหานคร",
        brand: "Toyota",
        model: "Camry",
        color: "White",
        cards: { connect: [{ card_id: card1!.card_id }, { card_id: card2!.card_id }] },
      },
    }),
    prisma.registeredVehicle.create({
      data: {
        registration: "2ขค 5678",
        province: "เชียงใหม่",
        brand: "Honda",
        model: "Civic",
        color: "Black",
        cards: { connect: [{ card_id: card1!.card_id }] },
      },
    }),
    prisma.registeredVehicle.create({
      data: {
        registration: "3คง 9012",
        province: "กรุงเทพมหานคร",
        brand: "BMW",
        model: "320d",
        color: "Blue",
        cards: { connect: [{ card_id: card3!.card_id }] },
      },
    }),
  ]);

  console.log("Created 3 registered vehicles");

  // ---------------------------------------------------------
  // Core Parking Data
  // ---------------------------------------------------------

  // Malls
  const [centralWorld, siamParagon] = await Promise.all([
    prisma.mall.create({ data: { name: "CentralWorld" } }),
    prisma.mall.create({ data: { name: "Siam Paragon" } }),
  ]);

  console.log("Created 2 malls");

  // Parking Lots + Pricing Rules (nested create)
  const [lotCW1, lotCWSCB, lotParagonSCB] = await Promise.all([
    prisma.privilegeParking.create({
      data: {
        name: "The 1 Card",
        mall_id: centralWorld!.mall_id,
        program_id: the1Gold!.program_id,
        location: "CentralWorld, Bangkok",
        pricingRule: { create: { rate_per_hour: 20.0 } },
      },
    }),
    prisma.privilegeParking.create({
      data: {
        name: "SCB First",
        mall_id: centralWorld!.mall_id,
        program_id: scbFirst!.program_id,
        location: "CentralWorld, Bangkok",
        pricingRule: { create: { rate_per_hour: 25.0 } },
      },
    }),
    prisma.privilegeParking.create({
      data: {
        name: "Paragon SCB First",
        mall_id: siamParagon!.mall_id,
        program_id: scbFirst!.program_id,
        location: "Siam Paragon, Bangkok",
        pricingRule: { create: { rate_per_hour: 30.0 } },
      },
    }),
  ]);

  console.log("Created 3 parking lots with pricing rules");

  // Parking Slots (5 per lot = 15 total)
  const lots = [lotCW1!, lotCWSCB!, lotParagonSCB!];
  const slotPromises = [];
  for (let lotIdx = 0; lotIdx < lots.length; lotIdx++) {
    const lot = lots[lotIdx]!;
    for (let col = 0; col < 5; col++) {
      const label = String.fromCharCode(65 + lotIdx) + (col + 1);
      slotPromises.push(
        prisma.parkingSlot.create({
          data: {
            slot_id: label,
            lot_id: lot.lot_id,
            status: "FREE",
            location_coordinates: JSON.stringify({ x: col * 10, y: lotIdx * 10, z: 0 }),
            rotation: 0,
            is_active: true,
          },
        })
      );
    }
  }

  const parkingSlots = await Promise.all(slotPromises);
  console.log(`Created ${parkingSlots.length} parking slots`);

  // Roads (road patches for each lot)
  const roadPromises = [];
  for (const lot of lots) {
    // Horizontal road running across the lot
    roadPromises.push(
      prisma.road.create({
        data: { lot_id: lot.lot_id, cx: 20, cy: 0, w: 60, d: 8, horizontal: true, connections: Prisma.JsonNull },
      })
    );
    // Vertical road on the left side
    roadPromises.push(
      prisma.road.create({
        data: { lot_id: lot.lot_id, cx: -5, cy: 0, w: 8, d: 40, horizontal: false, connections: Prisma.JsonNull },
      })
    );
    // Intersection patch where roads cross
    roadPromises.push(
      prisma.road.create({
        data: { lot_id: lot.lot_id, cx: -5, cy: 0, w: 8, d: 8, horizontal: true, connections: { top: true, bottom: true, left: true, right: true } },
      })
    );
  }
  const roads = await Promise.all(roadPromises);
  console.log(`Created ${roads.length} road segments`);

  // Sensor Logs (5 entries for the first lot's slots)
  const logPromises = parkingSlots.slice(0, 5).map((slot) =>
    prisma.sensorLog.create({
      data: {
        slot_id: slot.slot_id,
        event_type: "ENTRY",
        raw_data: JSON.stringify({ sensor_value: 1023 }),
      },
    })
  );

  const logs = await Promise.all(logPromises);
  console.log(`Created ${logs.length} sensor logs`);

  // Parking Sessions
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
        total_fee: 0,
        payment_status: "PAID",
      },
    }),
    // Completed session — guest vehicle (no slot, no vehicle_id)
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
    // Active session — registered vehicle (slot occupied)
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
    // Active session — guest vehicle (no slot)
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

  // Mark active-session slots as OCCUPIED
  await prisma.parkingSlot.update({
    where: { slot_id: parkingSlots[1]!.slot_id },
    data: { status: "OCCUPIED" },
  });

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