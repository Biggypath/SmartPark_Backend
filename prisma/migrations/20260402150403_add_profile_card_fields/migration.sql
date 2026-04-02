-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "user_cards" ADD COLUMN     "cardholder_name" TEXT,
ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birthday" DATE,
ADD COLUMN     "gender" "Gender";
