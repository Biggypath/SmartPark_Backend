/*
  Warnings:

  - The values [RESERVED] on the enum `SlotStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `license_plate` on the `parking_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `reservation_id` on the `parking_sessions` table. All the data in the column will be lost.
  - You are about to drop the `reservations` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('GENERAL', 'VIP');

-- AlterEnum
BEGIN;
CREATE TYPE "SlotStatus_new" AS ENUM ('FREE', 'OCCUPIED', 'ASSIGNED');
ALTER TABLE "public"."parking_slots" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "parking_slots" ALTER COLUMN "status" TYPE "SlotStatus_new" USING ("status"::text::"SlotStatus_new");
ALTER TYPE "SlotStatus" RENAME TO "SlotStatus_old";
ALTER TYPE "SlotStatus_new" RENAME TO "SlotStatus";
DROP TYPE "public"."SlotStatus_old";
ALTER TABLE "parking_slots" ALTER COLUMN "status" SET DEFAULT 'FREE';
COMMIT;

-- DropForeignKey
ALTER TABLE "parking_sessions" DROP CONSTRAINT "parking_sessions_reservation_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_slot_id_fkey";

-- AlterTable
ALTER TABLE "parking_sessions" DROP COLUMN "license_plate",
DROP COLUMN "reservation_id",
ADD COLUMN     "province" TEXT,
ADD COLUMN     "registration" TEXT,
ADD COLUMN     "vehicle_id" TEXT;

-- AlterTable
ALTER TABLE "parking_slots" ADD COLUMN     "slot_type" "SlotType" NOT NULL DEFAULT 'GENERAL';

-- DropTable
DROP TABLE "reservations";

-- DropEnum
DROP TYPE "ReservationStatus";

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "privilege_programs" (
    "program_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "tier" TEXT,
    "free_hours" INTEGER NOT NULL DEFAULT 0,
    "max_vehicles" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "privilege_programs_pkey" PRIMARY KEY ("program_id")
);

-- CreateTable
CREATE TABLE "user_cards" (
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "registered_vehicles" (
    "vehicle_id" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registered_vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "_RegisteredVehicleToUserCard" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RegisteredVehicleToUserCard_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "registered_vehicles_registration_province_key" ON "registered_vehicles"("registration", "province");

-- CreateIndex
CREATE INDEX "_RegisteredVehicleToUserCard_B_index" ON "_RegisteredVehicleToUserCard"("B");

-- AddForeignKey
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "privilege_programs"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "registered_vehicles"("vehicle_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegisteredVehicleToUserCard" ADD CONSTRAINT "_RegisteredVehicleToUserCard_A_fkey" FOREIGN KEY ("A") REFERENCES "registered_vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegisteredVehicleToUserCard" ADD CONSTRAINT "_RegisteredVehicleToUserCard_B_fkey" FOREIGN KEY ("B") REFERENCES "user_cards"("card_id") ON DELETE CASCADE ON UPDATE CASCADE;
