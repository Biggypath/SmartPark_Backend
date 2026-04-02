/*
  Warnings:

  - You are about to drop the column `free_hours` on the `privilege_programs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "privilege_programs" DROP COLUMN "free_hours";

-- AlterTable
ALTER TABLE "registered_vehicles" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "model" TEXT;
