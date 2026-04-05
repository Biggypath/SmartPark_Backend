-- Update any rows using ASSIGNED to FREE before removing the enum value
UPDATE "parking_slots" SET "status" = 'FREE' WHERE "status" = 'ASSIGNED';

-- AlterEnum: remove ASSIGNED from SlotStatus
CREATE TYPE "SlotStatus_new" AS ENUM ('FREE', 'OCCUPIED');
ALTER TABLE "parking_slots" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "parking_slots" ALTER COLUMN "status" TYPE "SlotStatus_new" USING ("status"::text::"SlotStatus_new");
ALTER TYPE "SlotStatus" RENAME TO "SlotStatus_old";
ALTER TYPE "SlotStatus_new" RENAME TO "SlotStatus";
DROP TYPE "SlotStatus_old";
ALTER TABLE "parking_slots" ALTER COLUMN "status" SET DEFAULT 'FREE';

-- AlterTable: add rotation column with default 0 for existing rows
ALTER TABLE "parking_slots" ADD COLUMN "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Remove the default so it matches the schema (no @default)
ALTER TABLE "parking_slots" ALTER COLUMN "rotation" DROP DEFAULT;
