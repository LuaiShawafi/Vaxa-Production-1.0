-- Production format + BOM XOR + lot inventory ledger

CREATE TYPE "ProductionFormat" AS ENUM ('PU', 'PL', 'TR');
CREATE TYPE "MaterialLotStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'DEACTIVATED');
CREATE TYPE "LotKind" AS ENUM ('SEED', 'MATERIAL');
CREATE TYPE "LotInventoryTransactionType" AS ENUM ('RECEIPT', 'PRODUCTION_CONSUMPTION', 'ADJUSTMENT');

ALTER TABLE "skus" ADD COLUMN "production_format" "ProductionFormat";

UPDATE "skus" SET "production_format" = 'PU' WHERE lower(trim("growing_method")) IN ('punnet');
UPDATE "skus" SET "production_format" = 'PL' WHERE lower(trim("growing_method")) IN ('plug transplanted', 'plugs transplanted');
UPDATE "skus" SET "production_format" = 'TR' WHERE lower(trim("growing_method")) IN ('flat tray');

UPDATE "skus" SET "production_format" = 'PU' WHERE "production_format" IS NULL AND "code" LIKE 'PU\_%';
UPDATE "skus" SET "production_format" = 'PL' WHERE "production_format" IS NULL AND "code" LIKE 'PL\_%';
UPDATE "skus" SET "production_format" = 'TR' WHERE "production_format" IS NULL AND "code" LIKE 'TR\_%';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "skus" WHERE "production_format" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill production_format for all SKUs';
  END IF;
END $$;

ALTER TABLE "skus" ALTER COLUMN "production_format" SET NOT NULL;

ALTER TYPE "SeedLotStatus" RENAME VALUE 'FINISHED' TO 'UNAVAILABLE';
ALTER TYPE "SeedLotStatus" RENAME VALUE 'DISCONTINUED' TO 'DEACTIVATED';

ALTER TABLE "material_lots" ADD COLUMN "status_new" "MaterialLotStatus";

UPDATE "material_lots" SET "status_new" = 'AVAILABLE' WHERE "status" IS NULL OR upper(trim("status")) = 'AVAILABLE';
UPDATE "material_lots" SET "status_new" = 'UNAVAILABLE' WHERE upper(trim("status")) IN ('UNAVAILABLE', 'FINISHED');
UPDATE "material_lots" SET "status_new" = 'DEACTIVATED' WHERE upper(trim("status")) IN ('DEACTIVATED', 'DISCONTINUED');

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "material_lots" WHERE "status_new" IS NULL) THEN
    RAISE EXCEPTION 'Unexpected material_lots.status values; migrate manually';
  END IF;
END $$;

ALTER TABLE "material_lots" DROP COLUMN "status";
ALTER TABLE "material_lots" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "material_lots" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
ALTER TABLE "material_lots" ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "bom_lines" ALTER COLUMN "material_id" DROP NOT NULL;
ALTER TABLE "bom_lines" ADD COLUMN "seed_variety_id" UUID;

ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_seed_variety_id_fkey"
  FOREIGN KEY ("seed_variety_id") REFERENCES "seed_varieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bom_lines"
  ADD CONSTRAINT "bom_lines_material_xor_seed"
  CHECK ((material_id IS NULL) <> (seed_variety_id IS NULL));

ALTER TABLE "event_lot_allocations"
  ADD COLUMN "bom_line_key" TEXT,
  ADD COLUMN "consumed_quantity" DECIMAL(14,6),
  ADD COLUMN "consumed_uom" TEXT;

CREATE TABLE "lot_inventory_transactions" (
  "id" UUID NOT NULL,
  "lot_kind" "LotKind" NOT NULL,
  "seed_lot_id" UUID,
  "material_lot_id" UUID,
  "transaction_type" "LotInventoryTransactionType" NOT NULL,
  "quantity_delta" DECIMAL(14,6) NOT NULL,
  "unit_of_measure" TEXT NOT NULL,
  "production_event_id" UUID,
  "event_lot_allocation_id" UUID,
  "adjustment_reason" TEXT,
  "created_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lot_inventory_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lot_inventory_transactions_event_lot_allocation_id_transaction_type_key"
  ON "lot_inventory_transactions"("event_lot_allocation_id", "transaction_type");
CREATE INDEX "lot_inventory_transactions_seed_lot_id_idx" ON "lot_inventory_transactions"("seed_lot_id");
CREATE INDEX "lot_inventory_transactions_material_lot_id_idx" ON "lot_inventory_transactions"("material_lot_id");
CREATE INDEX "lot_inventory_transactions_production_event_id_idx" ON "lot_inventory_transactions"("production_event_id");

ALTER TABLE "lot_inventory_transactions" ADD CONSTRAINT "lot_inventory_transactions_seed_lot_id_fkey"
  FOREIGN KEY ("seed_lot_id") REFERENCES "seed_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lot_inventory_transactions" ADD CONSTRAINT "lot_inventory_transactions_material_lot_id_fkey"
  FOREIGN KEY ("material_lot_id") REFERENCES "material_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lot_inventory_transactions" ADD CONSTRAINT "lot_inventory_transactions_production_event_id_fkey"
  FOREIGN KEY ("production_event_id") REFERENCES "production_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lot_inventory_transactions" ADD CONSTRAINT "lot_inventory_transactions_event_lot_allocation_id_fkey"
  FOREIGN KEY ("event_lot_allocation_id") REFERENCES "event_lot_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lot_inventory_transactions" ADD CONSTRAINT "lot_inventory_transactions_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lot_inventory_transactions"
  ADD CONSTRAINT "lot_inventory_transactions_lot_xor"
  CHECK ((seed_lot_id IS NULL) <> (material_lot_id IS NULL));
