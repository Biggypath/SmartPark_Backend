/*
  Warnings:

  - A unique constraint covering the columns `[parkinglot_id]` on the table `pricing_rules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,bin,last_four]` on the table `user_cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `parkinglot_id` to the `pricing_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bin` to the `user_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiry_month` to the `user_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiry_year` to the `user_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_four` to the `user_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `network` to the `user_cards` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardNetwork" AS ENUM ('VISA', 'MASTERCARD', 'JCB', 'AMEX', 'UNIONPAY', 'OTHER');

-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "parkinglot_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "privilege_programs" ADD COLUMN     "eligible_bins" TEXT[];

-- AlterTable
ALTER TABLE "user_cards" ADD COLUMN     "bin" TEXT NOT NULL,
ADD COLUMN     "expiry_month" INTEGER NOT NULL,
ADD COLUMN     "expiry_year" INTEGER NOT NULL,
ADD COLUMN     "last_four" TEXT NOT NULL,
ADD COLUMN     "network" "CardNetwork" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_parkinglot_id_key" ON "pricing_rules"("parkinglot_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_cards_user_id_bin_last_four_key" ON "user_cards"("user_id", "bin", "last_four");

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_parkinglot_id_fkey" FOREIGN KEY ("parkinglot_id") REFERENCES "parking_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;
