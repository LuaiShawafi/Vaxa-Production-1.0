/**
 * Idempotent SKU master import from SKU DATA FOR APP.xlsx
 *
 * Usage:
 *   npm run db:import-skus
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/import-sku-master-data.ts --file "path/to/workbook.xlsx"
 *
 * Mapping: docs/data/SKU_IMPORT_MAPPING.md
 */
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import { importSkuMasterData } from "@/lib/import/skuMasterData";

const prisma = new PrismaClient();

const DEFAULT_WORKBOOK = path.join(
  process.cwd(),
  "data",
  "master",
  "SKU_DATA_FOR_APP.xlsx",
);

function workbookPathFromArgs(): string {
  const idx = process.argv.indexOf("--file");
  if (idx >= 0 && process.argv[idx + 1]) {
    return path.resolve(process.argv[idx + 1]!);
  }
  return DEFAULT_WORKBOOK;
}

async function main() {
  const filePath = workbookPathFromArgs();
  console.log(`Importing SKU master data from:\n  ${filePath}\n`);

  const result = await importSkuMasterData(prisma, filePath, {
    logEachRow: true,
  });

  console.log("\nImport complete:");
  console.log(`  SKU rows processed: ${result.skuUpserts}`);
  console.log(
    `  Seed varieties (distinct names): ${result.seedVarietiesTouched}`,
  );
  console.log(`  Seed varieties created: ${result.varietiesCreated}`);
  console.log(`  Seed varieties reactivated: ${result.varietiesUpdated}`);
  console.log(`  Seed lots in DB (unchanged by import): ${result.seedLotCount}`);
  console.log(
    `  Material lots in DB (unchanged by import): ${result.materialLotCount}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
