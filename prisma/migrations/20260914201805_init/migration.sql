-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BatchStage" AS ENUM ('PLANNED', 'GERMINATION', 'NURSERY', 'IN_TRANSIT', 'IN_POOL', 'HARVESTED');

-- CreateEnum
CREATE TYPE "ProductionTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionEventType" AS ENUM ('SEEDING_COMPLETED');

-- CreateEnum
CREATE TYPE "BomType" AS ENUM ('PROD', 'FG');

-- CreateEnum
CREATE TYPE "WeeklyPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SeedLotStatus" AS ENUM ('AVAILABLE', 'FINISHED', 'DISCONTINUED');

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_teams" (
    "user_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_teams_pkey" PRIMARY KEY ("user_id","team_id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "primary_seed_variety_id" UUID NOT NULL,
    "germination_days" INTEGER NOT NULL,
    "nursery_days" INTEGER NOT NULL,
    "growing_days" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_varieties" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_varieties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_lots" (
    "id" UUID NOT NULL,
    "seed_variety_id" UUID NOT NULL,
    "lot_number" TEXT NOT NULL,
    "supplier_name" TEXT,
    "production_date" DATE,
    "delivery_date" DATE,
    "status" "SeedLotStatus" NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit_of_measure" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_lots" (
    "id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "lot_number" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boms" (
    "id" UUID NOT NULL,
    "sku_id" UUID NOT NULL,
    "type" "BomType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_lines" (
    "id" UUID NOT NULL,
    "bom_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "qty_per_unit" DECIMAL(12,3) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "sort_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_plans" (
    "id" UUID NOT NULL,
    "week" TEXT NOT NULL,
    "status" "WeeklyPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_items" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "sku_id" UUID NOT NULL,
    "assigned_team_id" UUID NOT NULL,
    "planned_date" DATE NOT NULL,
    "planned_quantity" DECIMAL(12,3) NOT NULL,
    "quantity_uom" TEXT NOT NULL,
    "destination_identity" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL,
    "sku_id" UUID NOT NULL,
    "origin_plan_item_id" UUID NOT NULL,
    "visible_batch_number" TEXT NOT NULL,
    "original_assigned_destination" TEXT NOT NULL,
    "current_stage" "BatchStage" NOT NULL DEFAULT 'PLANNED',
    "official_identity_locked_at" TIMESTAMP(3),
    "germination_days_snapshot" INTEGER,
    "nursery_days_snapshot" INTEGER,
    "growing_days_snapshot" INTEGER,
    "dtm_days_snapshot" INTEGER,
    "bom_snapshot" JSONB,
    "expected_germination_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_tasks" (
    "id" UUID NOT NULL,
    "plan_item_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "assigned_team_id" UUID NOT NULL,
    "starter_user_id" UUID,
    "status" "ProductionTaskStatus" NOT NULL DEFAULT 'OPEN',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "preselected_lots" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_events" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "production_task_id" UUID NOT NULL,
    "initiated_by_user_id" UUID NOT NULL,
    "event_type" "ProductionEventType" NOT NULL,
    "planned_quantity_snapshot" DECIMAL(12,3) NOT NULL,
    "actual_quantity" DECIMAL(12,3) NOT NULL,
    "quantity_uom" TEXT NOT NULL,
    "stage_before" "BatchStage" NOT NULL,
    "stage_after" "BatchStage" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "event_lot_allocations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "seed_lot_id" UUID,
    "material_lot_id" UUID,
    "quantity" DECIMAL(12,3) NOT NULL,
    "quantity_uom" TEXT NOT NULL,
    "change_from_preselected" BOOLEAN NOT NULL DEFAULT false,
    "change_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_lot_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deviations" (
    "id" UUID NOT NULL,
    "production_event_id" UUID NOT NULL,
    "reason_code" TEXT NOT NULL,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deviations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_teams_team_id_idx" ON "user_teams"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "skus_code_key" ON "skus"("code");

-- CreateIndex
CREATE INDEX "seed_lots_seed_variety_id_idx" ON "seed_lots"("seed_variety_id");

-- CreateIndex
CREATE INDEX "material_lots_material_id_idx" ON "material_lots"("material_id");

-- CreateIndex
CREATE INDEX "bom_lines_bom_id_idx" ON "bom_lines"("bom_id");

-- CreateIndex
CREATE INDEX "plan_items_assigned_team_id_planned_date_idx" ON "plan_items"("assigned_team_id", "planned_date");

-- CreateIndex
CREATE INDEX "plan_items_plan_id_idx" ON "plan_items"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "batches_origin_plan_item_id_key" ON "batches"("origin_plan_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "batches_sku_id_visible_batch_number_key" ON "batches"("sku_id", "visible_batch_number");

-- CreateIndex
CREATE INDEX "production_tasks_assigned_team_id_status_idx" ON "production_tasks"("assigned_team_id", "status");

-- CreateIndex
CREATE INDEX "production_tasks_batch_id_idx" ON "production_tasks"("batch_id");

-- CreateIndex
CREATE INDEX "production_events_batch_id_idx" ON "production_events"("batch_id");

-- CreateIndex
CREATE INDEX "production_events_production_task_id_idx" ON "production_events"("production_task_id");

-- CreateIndex
CREATE INDEX "event_lot_allocations_event_id_idx" ON "event_lot_allocations"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_lot_allocations_event_id_seed_lot_id_key" ON "event_lot_allocations"("event_id", "seed_lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_lot_allocations_event_id_material_lot_id_key" ON "event_lot_allocations"("event_id", "material_lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "deviations_production_event_id_key" ON "deviations"("production_event_id");

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skus" ADD CONSTRAINT "skus_primary_seed_variety_id_fkey" FOREIGN KEY ("primary_seed_variety_id") REFERENCES "seed_varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_lots" ADD CONSTRAINT "seed_lots_seed_variety_id_fkey" FOREIGN KEY ("seed_variety_id") REFERENCES "seed_varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_lots" ADD CONSTRAINT "material_lots_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boms" ADD CONSTRAINT "boms_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "weekly_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_assigned_team_id_fkey" FOREIGN KEY ("assigned_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_origin_plan_item_id_fkey" FOREIGN KEY ("origin_plan_item_id") REFERENCES "plan_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_plan_item_id_fkey" FOREIGN KEY ("plan_item_id") REFERENCES "plan_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_assigned_team_id_fkey" FOREIGN KEY ("assigned_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_starter_user_id_fkey" FOREIGN KEY ("starter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_production_task_id_fkey" FOREIGN KEY ("production_task_id") REFERENCES "production_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "production_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_lot_allocations" ADD CONSTRAINT "event_lot_allocations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "production_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_lot_allocations" ADD CONSTRAINT "event_lot_allocations_seed_lot_id_fkey" FOREIGN KEY ("seed_lot_id") REFERENCES "seed_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_lot_allocations" ADD CONSTRAINT "event_lot_allocations_material_lot_id_fkey" FOREIGN KEY ("material_lot_id") REFERENCES "material_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_production_event_id_fkey" FOREIGN KEY ("production_event_id") REFERENCES "production_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- Manual additions: constraints approved in the Prisma integrity gate that
-- `prisma migrate diff` cannot generate from schema.prisma. Do not remove.
-- =============================================================================

-- 1. Exactly one active BOM per SKU and type.
CREATE UNIQUE INDEX "boms_active_sku_type_key"
  ON "boms" ("sku_id", "type")
  WHERE "active";

-- 2. One successful seeding event per production task. Stays partial so future
--    workflows (e.g. transplant resume) can record several events of other
--    types, or several events in general, on one task.
CREATE UNIQUE INDEX "production_events_seeding_completed_task_key"
  ON "production_events" ("production_task_id")
  WHERE "event_type" = 'SEEDING_COMPLETED';

-- 2b. One successful seeding event per batch. Prevents a duplicate seeding
--    ProductionTask from double-seeding the same physical batch. Stays
--    partial so a batch can still accumulate many later tasks/events of
--    other event types.
CREATE UNIQUE INDEX "production_events_seeding_completed_batch_key"
  ON "production_events" ("batch_id")
  WHERE "event_type" = 'SEEDING_COMPLETED';

-- 3. EventLotAllocation XOR: exactly one of seed_lot_id / material_lot_id.
ALTER TABLE "event_lot_allocations"
  ADD CONSTRAINT "event_lot_allocations_lot_xor"
  CHECK (("seed_lot_id" IS NULL) <> ("material_lot_id" IS NULL));

-- 4. Positive-quantity checks.
ALTER TABLE "plan_items"
  ADD CONSTRAINT "plan_items_planned_quantity_positive"
  CHECK ("planned_quantity" > 0);

ALTER TABLE "production_events"
  ADD CONSTRAINT "production_events_planned_quantity_positive"
  CHECK ("planned_quantity_snapshot" > 0);

ALTER TABLE "production_events"
  ADD CONSTRAINT "production_events_actual_quantity_positive"
  CHECK ("actual_quantity" > 0);

ALTER TABLE "event_lot_allocations"
  ADD CONSTRAINT "event_lot_allocations_quantity_positive"
  CHECK ("quantity" > 0);

ALTER TABLE "bom_lines"
  ADD CONSTRAINT "bom_lines_qty_per_unit_positive"
  CHECK ("qty_per_unit" > 0);
