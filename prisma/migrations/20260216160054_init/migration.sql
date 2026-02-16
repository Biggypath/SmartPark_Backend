-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('FREE', 'OCCUPIED', 'RESERVED');

-- CreateEnum
CREATE TYPE "LogEventType" AS ENUM ('ENTRY', 'EXIT', 'OBSTRUCTION');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "parking_slots" (
    "slot_id" TEXT NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'FREE',
    "location_coordinates" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "parking_slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "rule_id" TEXT NOT NULL,
    "rate_per_hour" DOUBLE PRECISION NOT NULL DEFAULT 20.00,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "sensor_logs" (
    "log_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" "LogEventType" NOT NULL,
    "raw_data" TEXT,

    CONSTRAINT "sensor_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "reservation_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "parking_sessions" (
    "session_id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "slot_id" TEXT NOT NULL,
    "license_plate" TEXT,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "duration_minutes" DOUBLE PRECISION,
    "total_fee" DECIMAL(10,2),
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "parking_sessions_pkey" PRIMARY KEY ("session_id")
);

-- AddForeignKey
ALTER TABLE "sensor_logs" ADD CONSTRAINT "sensor_logs_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "parking_slots"("slot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "parking_slots"("slot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "parking_slots"("slot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("reservation_id") ON DELETE SET NULL ON UPDATE CASCADE;
