import { afterAll, describe, expect, it } from "vitest";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import { importSkuMasterData } from "@/lib/import/skuMasterData";
import { importProductionBoms } from "@/lib/import/productionBomData";

const hasDb = Boolean(process.env.DATABASE_URL);
const workbook = path.join(
  process.cwd(),
  "data",
  "master",
  "Vaxa_SKU_Master_and_BOM_Import_v1.xlsx",
);

describe.skipIf(!hasDb)("SKU + PROD BOM master import", () => {
  const prisma = new PrismaClient();

  it("imports 46 SKUs and 42 active PROD BOMs idempotently", async () => {
    const skuFirst = await importSkuMasterData(prisma, workbook);
    const bomFirst = await importProductionBoms(prisma, workbook);
    await importSkuMasterData(prisma, workbook);
    const bomSecond = await importProductionBoms(prisma, workbook);

    expect(skuFirst.rowsRead).toBe(46);
    expect(skuFirst.activeSkus).toBe(42);
    expect(skuFirst.discontinuedSkus).toBe(4);
    expect(bomFirst.sourceItemLines).toBe(108);
    expect(bomFirst.activeBomSkus).toBe(42);
    expect(bomFirst.bomsUpserted).toBe(42);
    expect(bomSecond.bomsUpserted).toBe(42);

    const totalSkus = await prisma.sku.count();
    expect(totalSkus).toBeGreaterThanOrEqual(46);

    const activeSkus = await prisma.sku.count({ where: { active: true } });
    const activeBoms = await prisma.bom.count({
      where: { type: "PROD", active: true, ready: true },
    });
    expect(activeSkus).toBe(42);
    expect(activeBoms).toBe(42);

    const mint = await prisma.sku.findUnique({ where: { code: "PU_MINT" } });
    expect(mint?.active).toBe(true);
    expect(mint?.germinationDays).toBe(14);
    expect(mint?.growingDays).toBe(27);
    expect(mint?.dtmTotalDays).toBe(41);

    const puRadish = await prisma.sku.findUnique({
      where: { code: "PU_RED_RADISH" },
      include: {
        boms: {
          where: { type: "PROD", active: true },
          include: { lines: true },
        },
      },
    });
    const seedLine = puRadish?.boms[0]?.lines.find((l) => l.seedVarietyId);
    expect(Number(seedLine?.qtyPerUnit)).toBe(2.43);
    expect(seedLine?.unitOfMeasure).toBe("g");
    expect(Number(puRadish?.seedsPerUnit)).toBe(1.8);

    const nita = await prisma.bom.findFirst({
      where: { sku: { code: "PL_NITAFLASH" }, type: "PROD", active: true },
    });
    expect(nita).toBeNull();

    const chives = await prisma.sku.findUnique({
      where: { code: "PL_CHIVES" },
      include: { primarySeedVariety: true },
    });
    expect(chives?.primarySeedVariety?.name).toBe(
      "Chives, Thick Leaf CN CHI 5854",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
