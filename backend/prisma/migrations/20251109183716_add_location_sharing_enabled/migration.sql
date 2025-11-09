-- AlterTable
ALTER TABLE IF NOT EXISTS "users" ADD COLUMN "locationSharingEnabled" BOOLEAN NOT NULL DEFAULT false;

