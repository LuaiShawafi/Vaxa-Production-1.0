# SKU master import mapping

Source: `SKU DATA FOR APP.xlsx` (41 rows). Importer: `scripts/import-sku-master-data.ts`.

| Spreadsheet column | Prisma model.field | Null / N/A handling |
|------------------|-------------------|---------------------|
| SKU | `Sku.code` | Required; unique upsert key |
| DESCRIPTION | `Sku.description` | Blank → `null` |
| CATEGORY | `Sku.category` | Blank → `null` |
| Growing_method | `Sku.growingMethod` | Blank → `null` |
| Nursery Density (per m2) | `Sku.nurseryDensityPerM2` | Blank → `null`; numeric preserved |
| Final Density (per m2) | `Sku.finalDensityPerM2` | Blank → `null` |
| Average unit weight (grams) | `Sku.averageUnitWeightGrams` | Blank → `null`; literal `N/A` → `null` (documented: not a numeric value) |
| Seed_type | `SeedVariety.name` + `Sku.primarySeedVarietyId` | Exact string preserved (including trailing spaces); variety upserted by exact `name` |
| Seed supplier | `Sku.seedSupplierName` | Blank → `null` |
| Seeds per unit | `Sku.seedsPerUnit` | Blank / missing column → `null` (e.g. PU_CORIANDER) |
| Seed measure | `Sku.seedMeasure` | Blank → `null` |
| DAYS IN GERMINATION | `Sku.germinationDays` | Required integer in sheet |
| DAYS IN NURSERY | `Sku.nurseryDays` | Blank / missing → `null` (e.g. punnet rows without nursery) |
| DAYS GROWING | `Sku.growingDays` | Required integer in sheet |
| DTM TOTAL | `Sku.dtmTotalDays` | Stored as supplied; importer logs warning if ≠ germ + nursery + growing |
| Total Harvests/year | `Sku.harvestsPerYear` | Blank → `null` |

**Not imported:** Seed lots, material lots, BOMs, inventory (workbook has no lot identities).

**Idempotency:** Upsert `Sku` by `code`; find-or-create `SeedVariety` by exact `name`.
