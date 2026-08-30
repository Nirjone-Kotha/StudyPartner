-- Add institution and isPublic fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institution" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT true;
