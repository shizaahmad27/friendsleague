-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "isEphemeral" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "ephemeralViewDuration" INTEGER;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "ephemeralViewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "ephemeralViewedBy" TEXT;
