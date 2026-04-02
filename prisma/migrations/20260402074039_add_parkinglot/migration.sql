/*
  Warnings:

  - You are about to drop the column `slot_type` on the `parking_slots` table. All the data in the column will be lost.
  - Added the required column `lot_id` to the `parking_slots` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "parking_sessions" DROP CONSTRAINT "parking_sessions_slot_id_fkey";

-- AlterTable
ALTER TABLE "parking_sessions" ALTER COLUMN "slot_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "parking_slots" DROP COLUMN "slot_type",
ADD COLUMN     "lot_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SlotType";

-- CreateTable
CREATE TABLE "parking_lots" (
    "lot_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "parking_lots_pkey" PRIMARY KEY ("lot_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parking_lots_name_key" ON "parking_lots"("name");

-- AddForeignKey
ALTER TABLE "parking_slots" ADD CONSTRAINT "parking_slots_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "parking_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "parking_slots"("slot_id") ON DELETE SET NULL ON UPDATE CASCADE;
