-- AlterEnum
ALTER TYPE "WeeklyPlanStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
ALTER TYPE "ProductionEventType" ADD VALUE 'DESTINATION_CHANGED';

-- AlterTable
ALTER TABLE "weekly_plans" ADD COLUMN "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "batches" ADD COLUMN "current_destination" TEXT;

UPDATE "batches" SET "current_destination" = "original_assigned_destination" WHERE "current_destination" IS NULL;

ALTER TABLE "batches" ALTER COLUMN "current_destination" SET NOT NULL;

-- AlterTable
ALTER TABLE "production_events" ADD COLUMN "destination_before" TEXT,
ADD COLUMN "destination_after" TEXT,
ADD COLUMN "change_reason_code" TEXT,
ADD COLUMN "change_explanation" TEXT;

