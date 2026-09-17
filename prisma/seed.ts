import { PrismaClient, SeedLotStatus } from "@prisma/client";

const TEAM_402_NAME = "402";

const prisma = new PrismaClient();

/** SKU codes that existed only in old demo seed — removed from seed; safe to drop when unused. */
const LEGACY_DEMO_ONLY_SKU_CODES = ["PU_MUSTARD"] as const;

/**
 * Development fixtures: team, workers, materials, material lots, and (when SKUs
 * exist) traceability lots + PROD BOM for workflow testing.
 *
 * SKU master data is **not** seeded here. Run after migrations:
 *   npm run db:import-skus
 *
 * Then (or re-run) `npm run db:seed` for non-SKU fixtures and PU_RED_RADISH BOM/lots.
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

  const materials = [
    {
      id: "00000000-0000-4000-8000-000000000801",
      name: "Substrate mat",
      category: "substrate",
      uom: "mats",
    },
    {
      id: "00000000-0000-4000-8000-000000000802",
      name: "Punnet",
      category: "packaging",
      uom: "units",
    },
  ];
  for (const m of materials) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: {
        name: m.name,
        category: m.category,
        unitOfMeasure: m.uom,
        active: true,
      },
      create: {
        id: m.id,
        name: m.name,
        category: m.category,
        unitOfMeasure: m.uom,
        active: true,
      },
    });
  }

  const materialLots = [
    {
      id: "00000000-0000-4000-8000-000000000901",
      materialId: materials[0]!.id,
      lotNumber: "SUB-2026-018",
    },
    {
      id: "00000000-0000-4000-8000-000000000902",
      materialId: materials[1]!.id,
      lotNumber: "PUN-2026-007",
    },
  ];
  for (const lot of materialLots) {
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
  }

  await removeLegacyDemoOnlySkus();

  const redRadish = await prisma.sku.findUnique({
    where: { code: "PU_RED_RADISH" },
    select: { id: true, primarySeedVarietyId: true },
  });

  if (!redRadish) {
    console.warn(
      "PU_RED_RADISH not found — skipped dev seed lots and BOM. Run: npm run db:import-skus",
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
  for (const lot of seedLots) {
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
  }

  const bomId = "00000000-0000-4000-8000-000000000b01";
  await prisma.bom.upsert({
    where: { id: bomId },
    update: { active: true, ready: true, skuId: redRadish.id, type: "PROD" },
    create: {
      id: bomId,
      skuId: redRadish.id,
      type: "PROD",
      active: true,
      ready: true,
    },
  });

  await prisma.bomLine.deleteMany({ where: { bomId } });
  await prisma.bomLine.createMany({
    data: [
      {
        bomId,
        materialId: materials[0]!.id,
        qtyPerUnit: 2,
        unitOfMeasure: "mats",
        sortIndex: 0,
      },
      {
        bomId,
        materialId: materials[1]!.id,
        qtyPerUnit: 42,
        unitOfMeasure: "units",
        sortIndex: 1,
      },
    ],
  });

  console.log(
    `Seeded team ${team.name}, ${workers.length} workers, materials, material lots, ` +
      `2 seed lots and PROD BOM for PU_RED_RADISH (SKU master via db:import-skus).`,
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
