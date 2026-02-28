import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("Starting to seed the database...");

  // Clear existing data
  await prisma.parkingSession.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.sensorLog.deleteMany({});
  await prisma.parkingSlot.deleteMany({});
  await prisma.pricingRule.deleteMany({});

  console.log("Cleared existing data");

  // Create pricing rules
  const pricingRules = await Promise.all([
    prisma.pricingRule.create({
      data: {
        rate_per_hour: 20.0,
      },
    }),
    prisma.pricingRule.create({
      data: {
        rate_per_hour: 15.0,
      },
    }),
  ]);

  console.log(`Created ${pricingRules.length} pricing rules`);

  // Create parking slots (4 rows x 5 columns = 20 slots)
  const slots = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const slotId = String.fromCharCode(65 + row) + (col + 1); // A1, A2, ..., D5
      slots.push(
        prisma.parkingSlot.create({
          data: {
            slot_id: slotId,
            location_coordinates: JSON.stringify({
              x: col * 10,
              y: row * 10,
              z: 0,
            }),
            is_active: true,
            status: col % 3 === 0 ? "OCCUPIED" : "FREE", // Some slots occupied
          },
        })
      );
    }
  }

  const parkingSlots = await Promise.all(slots);
  console.log(`Created ${parkingSlots.length} parking slots`);

  // Create sensor logs
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

  // Create reservations
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reservations = [];
  for (let i = 0; i < 3; i++) {
    reservations.push(
      prisma.reservation.create({
        data: {
          slot_id: parkingSlots[i]!.slot_id,
          license_plate: `ABC-${1000 + i}`,
          reservation_time: new Date(now.getTime() + i * 3600000),
          status: i === 0 ? "ACTIVE" : "COMPLETED",
        },
      })
    );
  }

  const createdReservations = await Promise.all(reservations);
  console.log(`Created ${createdReservations.length} reservations`);

  // Create parking sessions
  const sessions = [];
  for (let i = 0; i < 5 && i < parkingSlots.length; i++) {
    const entryTime = new Date(now.getTime() - (5 - i) * 3600000);
    const exitTime = i < 3 ? new Date(entryTime.getTime() + 3600000) : null;

    sessions.push(
      prisma.parkingSession.create({
        data: {
          slot_id: parkingSlots[i]!.slot_id,
          reservation_id: i < 3 ? createdReservations[i]!.reservation_id : null,
          license_plate: `XYZ-${2000 + i}`,
          entry_time: entryTime,
          exit_time: exitTime,
          duration_minutes: exitTime
            ? (exitTime.getTime() - entryTime.getTime()) / 60000
            : null,
          total_fee: exitTime ? 20.0 : null,
          payment_status: exitTime ? "PAID" : "PENDING",
        },
      })
    );
  }

  await Promise.all(sessions);
  console.log(`Created 5 parking sessions`);

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
