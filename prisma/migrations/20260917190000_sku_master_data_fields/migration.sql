-- SKU master-data columns from SKU DATA FOR APP.xlsx (docs/domain/MASTER_DATA_AND_BOM.md).

ALTER TABLE "skus" ADD COLUMN "category" TEXT;
ALTER TABLE "skus" ADD COLUMN "growing_method" TEXT;
ALTER TABLE "skus" ADD COLUMN "nursery_density_per_m2" DECIMAL(14,6);
ALTER TABLE "skus" ADD COLUMN "final_density_per_m2" DECIMAL(14,6);
ALTER TABLE "skus" ADD COLUMN "average_unit_weight_grams" DECIMAL(12,3);
ALTER TABLE "skus" ADD COLUMN "seeds_per_unit" DECIMAL(14,6);
ALTER TABLE "skus" ADD COLUMN "seed_measure" TEXT;
ALTER TABLE "skus" ADD COLUMN "seed_supplier_name" TEXT;
ALTER TABLE "skus" ADD COLUMN "harvests_per_year" INTEGER;
ALTER TABLE "skus" ADD COLUMN "dtm_total_days" INTEGER;

ALTER TABLE "skus" ALTER COLUMN "nursery_days" DROP NOT NULL;
