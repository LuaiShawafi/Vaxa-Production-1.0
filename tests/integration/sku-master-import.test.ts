import { afterAll, describe, expect, it } from "vitest";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import { importSkuMasterData } from "@/lib/import/skuMasterData";

const hasDb = Boolean(process.env.DATABASE_URL);
const workbook = path.join(
  process.cwd(),
  "data",
  "master",
  "SKU_DATA_FOR_APP.xlsx",
);

describe.skipIf(!hasDb)("SKU master import", () => {
  const prisma = new PrismaClient();

  it("imports 41 SKUs idempotently with expected sample values", async () => {
    const first = await importSkuMasterData(prisma, workbook);
    const second = await importSkuMasterData(prisma, workbook);

    expect(first.rowsRead).toBe(41);
    expect(first.skuUpserts).toBe(41);
    expect(second.skuUpserts).toBe(41);

    const activeCodes = await prisma.sku.findMany({
      where: { active: true },
      select: { code: true },
    });
    expect(activeCodes.length).toBe(41);
    expect(new Set(activeCodes.map((c) => c.code)).size).toBe(41);

    const legacyDemo = await prisma.sku.findUnique({
      where: { code: "PU_MUSTARD" },
    });
    expect(legacyDemo === null || legacyDemo.active === false).toBe(true);

    const puCoriander = await prisma.sku.findUnique({
      where: { code: "PU_CORIANDER" },
    });
    expect(puCoriander).not.toBeNull();
    expect(puCoriander!.seedsPerUnit).toBeNull();
    expect(puCoriander!.seedMeasure).toBe("g");

    const puRadish = await prisma.sku.findUnique({
      where: { code: "PU_RED_RADISH" },
    });
    expect(puRadish!.averageUnitWeightGrams).toBeNull();
    expect(puRadish!.germinationDays).toBe(2);
    expect(puRadish!.nurseryDays).toBeNull();
    expect(puRadish!.growingDays).toBe(5);
    expect(puRadish!.dtmTotalDays).toBe(7);

    const plLollo = await prisma.sku.findUnique({
      where: { code: "PL_LOLLO_BIONDO" },
    });
    expect(plLollo!.averageUnitWeightGrams).toBeNull();
    expect(plLollo!.category).toBe("Salad");

    const plMint = await prisma.sku.findUnique({
      where: { code: "PL_MINT" },
    });
    expect(plMint!.germinationDays).toBe(0);

    const lotsAfter = await prisma.seedLot.count();
    expect(lotsAfter).toBe(first.seedLotCount);
    expect(second.varietiesCreated).toBe(0);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
