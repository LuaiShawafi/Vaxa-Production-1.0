import type { PrismaClient } from "@prisma/client";
import type { PreselectedLotEntry } from "@/lib/validation/seeding";
import {
  materialBomLineKey,
  seedBomLineKey,
} from "@/lib/domain/inventory/bomLineKey";

type Db = Pick<
  PrismaClient,
  "sku" | "seedLot" | "materialLot" | "bom" | "bomLine"
>;

export async function buildPreselectedLotsForSku(
  db: Db,
  skuId: string,
): Promise<PreselectedLotEntry[]> {
  const sku = await db.sku.findUnique({
    where: { id: skuId },
    select: { primarySeedVarietyId: true },
  });
  if (!sku) {
    return [];
  }

  const entries: PreselectedLotEntry[] = [];

  const bom = await db.bom.findFirst({
    where: { skuId, type: "PROD", active: true },
    include: {
      lines: {
        include: { material: true, seedVariety: true },
        orderBy: { sortIndex: "asc" },
      },
    },
  });

  const seedVarietyId =
    bom?.lines.find((l) => l.seedVarietyId)?.seedVarietyId ??
    sku.primarySeedVarietyId;

  const seedLot = await db.seedLot.findFirst({
    where: {
      seedVarietyId,
      status: "AVAILABLE",
    },
    orderBy: { createdAt: "asc" },
  });
  if (seedLot) {
    entries.push({
      lotType: "SEED",
      seedLotId: seedLot.id,
      lotNumber: seedLot.lotNumber,
    });
  }

  if (!bom) {
    return entries;
  }

  for (const line of bom.lines) {
    if (!line.materialId) {
      continue;
    }
    const materialLot = await db.materialLot.findFirst({
      where: { materialId: line.materialId, status: "AVAILABLE" },
      orderBy: { createdAt: "asc" },
    });
    if (materialLot) {
      entries.push({
        lotType: "MATERIAL",
        materialLotId: materialLot.id,
        materialId: line.materialId,
        lotNumber: materialLot.lotNumber,
      });
    }
  }

  return entries;
}

export async function buildBomSnapshot(db: Db, skuId: string) {
  const bom = await db.bom.findFirst({
    where: { skuId, type: "PROD", active: true },
    include: {
      lines: {
        include: { material: true, seedVariety: true },
        orderBy: { sortIndex: "asc" },
      },
    },
  });
  if (!bom) {
    return null;
  }
  return {
    sourceBomId: bom.id,
    type: "PROD" as const,
    ready: bom.ready,
    lines: bom.lines.map((line) => {
      if (line.seedVarietyId && line.seedVariety) {
        return {
          lineKey: seedBomLineKey(line.seedVarietyId),
          kind: "SEED" as const,
          seedVarietyId: line.seedVarietyId,
          name: line.seedVariety.name,
          qtyPerUnit: Number(line.qtyPerUnit),
          uom: line.unitOfMeasure,
        };
      }
      if (line.materialId && line.material) {
        return {
          lineKey: materialBomLineKey(line.materialId),
          kind: "MATERIAL" as const,
          materialId: line.materialId,
          name: line.material.name,
          qtyPerUnit: Number(line.qtyPerUnit),
          uom: line.unitOfMeasure,
        };
      }
      throw new Error("Invalid BOM line: XOR violation");
    }),
  };
}
