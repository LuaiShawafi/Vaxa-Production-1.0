/**
 * Idempotent PROD BOM import from Vaxa_SKU_Master_and_BOM_Import_v1.xlsx
 *
 * Run after SKU import:
 *   npm run db:import-skus
 *   npm run db:import-boms
 */
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_MASTER_WORKBOOK } from "@/lib/import/workbook";
import { importProductionBoms } from "@/lib/import/productionBomData";

const prisma = new PrismaClient();

function workbookPathFromArgs(): string {
  const idx = process.argv.indexOf("--file");
  if (idx >= 0 && process.argv[idx + 1]) {
    return path.resolve(process.argv[idx + 1]!);
  }
  return path.join(process.cwd(), DEFAULT_MASTER_WORKBOOK);
}

async function main() {
  const filePath = workbookPathFromArgs();
  console.log(`Importing PROD BOMs from:\n  ${filePath}\n`);

  const result = await importProductionBoms(prisma, filePath, {
    logEachSku: true,
  });

  console.log("\nBOM import complete:");
  console.log(`  Source BOM SKUs: ${result.sourceBomSkus}`);
  console.log(`  Active PROD BOMs: ${result.bomsUpserted}`);
  console.log(`  Reference-only SKUs (BOM deactivated): ${result.referenceOnlyBomSkus}`);
  console.log(`  Source item lines: ${result.sourceItemLines}`);
  console.log(`  Active BOM lines written: ${result.activeBomLinesWritten}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
