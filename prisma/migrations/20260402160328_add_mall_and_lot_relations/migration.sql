/*
  Warnings:

  - Added the required column `mall_id` to the `parking_lots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program_id` to the `parking_lots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "parking_lots" ADD COLUMN     "mall_id" TEXT NOT NULL,
ADD COLUMN     "program_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "malls" (
    "mall_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "malls_pkey" PRIMARY KEY ("mall_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "malls_name_key" ON "malls"("name");

-- AddForeignKey
ALTER TABLE "parking_lots" ADD CONSTRAINT "parking_lots_mall_id_fkey" FOREIGN KEY ("mall_id") REFERENCES "malls"("mall_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_lots" ADD CONSTRAINT "parking_lots_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "privilege_programs"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;
