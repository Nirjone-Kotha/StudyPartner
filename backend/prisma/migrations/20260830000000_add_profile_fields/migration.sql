-- AlterTable: add optional profile fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coverPhoto" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
