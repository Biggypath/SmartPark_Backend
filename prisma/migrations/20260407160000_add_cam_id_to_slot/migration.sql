-- AlterTable
ALTER TABLE "parking_slots" ADD COLUMN "cam_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "parking_slots_cam_id_key" ON "parking_slots"("cam_id");
