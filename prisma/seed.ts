import {
  LotInventoryTransactionType,
  LotKind,
  Prisma,
  PrismaClient,
  SeedLotStatus,
} from "@prisma/client";

const TEAM_402_NAME = "402";

const prisma = new PrismaClient();

/** SKU codes that existed only in old demo seed — removed from seed; safe to drop when unused. */
const LEGACY_DEMO_ONLY_SKU_CODES = ["PU_MUSTARD"] as const;

/**
 * Development fixtures: team, workers, materials, material lots, and (when SKUs
 * exist) traceability lots + PROD BOM for workflow testing.
 *
 * SKU + PROD BOM master data is **not** seeded here. Run after migrations:
 *   npm run db:import-master
 *
 * Then `npm run db:seed` for team/workers, demo lots, and inventory receipts.
 */
async function main() {
  const team = await prisma.team.upsert({
    where: { id: "00000000-0000-4000-8000-000000000402" },
    update: { name: TEAM_402_NAME, active: true },
    create: {
      id: "00000000-0000-4000-8000-000000000402",
      name: TEAM_402_NAME,
      active: true,
    },
  });

  const workerNames = ["Alex Kim", "Elena Svensson", "Jonas Berg", "Mia Lindqvist"];
  const workers = [];
  for (const [i, name] of workerNames.entries()) {
    const id = `00000000-0000-4000-8000-0000000004${(10 + i).toString().padStart(2, "0")}`;
    const user = await prisma.user.upsert({
      where: { id },
      update: { name, active: true },
      create: { id, name, active: true },
    });
    await prisma.userTeam.upsert({
      where: { userId_teamId: { userId: user.id, teamId: team.id } },
      update: { active: true },
      create: { userId: user.id, teamId: team.id, active: true },
    });
    workers.push(user);
  }

  const matSubstrate = await prisma.material.findFirst({
    where: { code: "RM-G-001" },
  });
  const matPunnet = await prisma.material.findFirst({
    where: { code: "RM-G-003" },
  });
  if (!matSubstrate || !matPunnet) {
    console.warn(
      "RM-G-001 / RM-G-003 materials not found — run npm run db:import-master before db:seed for material lots.",
    );
  }

  const materialLots = matSubstrate && matPunnet
    ? [
        {
          id: "00000000-0000-4000-8000-000000000901",
          materialId: matSubstrate.id,
          lotNumber: "SUB-2026-018",
          uom: matSubstrate.unitOfMeasure,
        },
        {
          id: "00000000-0000-4000-8000-000000000902",
          materialId: matPunnet.id,
          lotNumber: "PUN-2026-007",
          uom: matPunnet.unitOfMeasure,
        },
      ]
    : [];
  const materialReceiptIds = [
    "00000000-0000-4000-8000-000000000a11",
    "00000000-0000-4000-8000-000000000a12",
  ];
  for (const [i, lot] of materialLots.entries()) {
    await prisma.materialLot.upsert({
      where: { id: lot.id },
      update: { lotNumber: lot.lotNumber, materialId: lot.materialId },
      create: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        materialId: lot.materialId,
        status: "AVAILABLE",
      },
    });
    const uom = lot.uom;
    await prisma.lotInventoryTransaction.upsert({
      where: { id: materialReceiptIds[i]! },
      update: {
        quantityDelta: new Prisma.Decimal(10_000),
        unitOfMeasure: uom,
      },
      create: {
        id: materialReceiptIds[i]!,
        lotKind: LotKind.MATERIAL,
        materialLotId: lot.id,
        transactionType: LotInventoryTransactionType.RECEIPT,
        quantityDelta: new Prisma.Decimal(10_000),
        unitOfMeasure: uom,
        createdByUserId: workers[0]!.id,
      },
    });
  }

  await removeLegacyDemoOnlySkus();

  const redRadish = await prisma.sku.findUnique({
    where: { code: "PU_RED_RADISH" },
    select: { id: true, primarySeedVarietyId: true },
  });

  if (!redRadish?.primarySeedVarietyId) {
    console.warn(
      "PU_RED_RADISH (with primary seed variety) not found — skipped dev seed lots and BOM. Run: npm run db:import-skus",
    );
    console.log(
      `Seeded team ${team.name}, ${workers.length} workers, materials and material lots.`,
    );
    return;
  }

  const seedLots = [
    {
      id: "00000000-0000-4000-8000-000000000701",
      lotNumber: "RDR-2026-041",
    },
    {
      id: "00000000-0000-4000-8000-000000000702",
      lotNumber: "RDR-2026-052",
    },
  ];
  const seedReceiptIds = [
    "00000000-0000-4000-8000-000000000a01",
    "00000000-0000-4000-8000-000000000a02",
  ];
  for (const [i, lot] of seedLots.entries()) {
    await prisma.seedLot.upsert({
      where: { id: lot.id },
      update: {
        lotNumber: lot.lotNumber,
        status: SeedLotStatus.AVAILABLE,
        seedVarietyId: redRadish.primarySeedVarietyId,
      },
      create: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        status: SeedLotStatus.AVAILABLE,
        seedVarietyId: redRadish.primarySeedVarietyId,
        supplierName: "Nordic Seeds",
      },
    });
    await prisma.lotInventoryTransaction.upsert({
      where: { id: seedReceiptIds[i]! },
      update: {
        quantityDelta: new Prisma.Decimal(50_000),
        unitOfMeasure: "g",
      },
      create: {
        id: seedReceiptIds[i]!,
        lotKind: LotKind.SEED,
        seedLotId: lot.id,
        transactionType: LotInventoryTransactionType.RECEIPT,
        quantityDelta: new Prisma.Decimal(50_000),
        unitOfMeasure: "g",
        createdByUserId: workers[0]!.id,
      },
    });
  }

  const prodBom = await prisma.bom.findFirst({
    where: { skuId: redRadish.id, type: "PROD", active: true },
  });
  if (!prodBom) {
    console.warn(
      "No active PROD BOM for PU_RED_RADISH — run npm run db:import-boms after SKU import.",
    );
  }

  console.log(
    `Seeded team ${team.name}, ${workers.length} workers, demo seed/material lots ` +
      `(master SKU/BOM via db:import-master).`,
  );
}

async function removeLegacyDemoOnlySkus() {
  for (const code of LEGACY_DEMO_ONLY_SKU_CODES) {
    const sku = await prisma.sku.findUnique({
      where: { code },
      select: {
        id: true,
        _count: {
          select: {
            planItems: true,
            batches: true,
            boms: true,
          },
        },
      },
    });
    if (!sku) {
      continue;
    }
    const inUse =
      sku._count.planItems > 0 || sku._count.batches > 0;
    if (inUse) {
      await prisma.sku.update({
        where: { id: sku.id },
        data: { active: false },
      });
      console.warn(
        `Legacy demo SKU ${code} still referenced by plans/batches — deactivated (not deleted).`,
      );
      continue;
    }
    await prisma.bomLine.deleteMany({
      where: { bom: { skuId: sku.id } },
    });
    await prisma.bom.deleteMany({ where: { skuId: sku.id } });
    await prisma.sku.delete({ where: { id: sku.id } });
    console.log(`Removed legacy demo-only SKU ${code}.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
