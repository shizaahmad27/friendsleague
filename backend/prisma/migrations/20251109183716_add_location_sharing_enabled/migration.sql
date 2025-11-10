-- AlterTable
-- Check if column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'locationSharingEnabled'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "locationSharingEnabled" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;


