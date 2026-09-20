import {
  MaterialLotStatus,
  Prisma,
  ProductionFormat,
  SeedLotStatus,
} from "@prisma/client";
import type { CompleteSeedingInput } from "@/lib/validation/seeding";
import type { BomSnapshot } from "@/lib/validation/seeding";
import { quantitiesEqual, sumAllocationQuantities } from "@/lib/validation/seeding";
import { calculateConsumptionForTrayAllocation } from "@/lib/domain/inventory/consumptionCalculator";
import { validateBomSnapshotForConsumption } from "@/lib/domain/inventory/validateBomSnapshot";

export type PreparedLotAllocation = {
  seedLotId?: string;
  materialLotId?: string;
  materialId?: string;
  bomLineKey: string;
  trays: number;
  consumedQuantity: Prisma.Decimal;
  consumedUom: string;
  changeFromPreselected: boolean;
  changeReason?: string | null;
  notes?: string | null;
};

export function allocationMismatchMessage(
  sum: number,
  actual: number,
): string {
  return `Lot allocation must equal production quantity: ${sum} / ${actual} trays allocated.`;
}

type Tx = Prisma.TransactionClient;

export async function prepareSeedingConsumptions(
  tx: Tx,
  input: {
    actualQuantity: number;
    seedLotAllocations: CompleteSeedingInput["seedLotAllocations"];
    materialLotAllocations: CompleteSeedingInput["materialLotAllocations"];
  },
  bom: BomSnapshot,
  format: ProductionFormat,
  skuCode: string,
): Promise<
  | { ok: true; allocations: PreparedLotAllocation[]; lotIdsToLock: { seed: string[]; material: string[] } }
  | { ok: false; message: string }
> {
  const bomError = validateBomSnapshotForConsumption(bom, skuCode);
  if (bomError) {
    return { ok: false, message: bomError };
  }

  const actualQty = input.actualQuantity;
  const prepared: PreparedLotAllocation[] = [];
  const seedLotIds = new Set<string>();
  const materialLotIds = new Set<string>();

  const seedLines = bom.lines.filter((l) => l.kind === "SEED");
  const materialLines = bom.lines.filter((l) => l.kind === "MATERIAL");

  if (seedLines.length === 0) {
    return { ok: false, message: validateBomSnapshotForConsumption(bom, skuCode)! };
  }

  const seedAllocSeen = new Set<string>();
  for (const alloc of input.seedLotAllocations) {
    if (seedAllocSeen.has(alloc.seedLotId)) {
      return { ok: false, message: "Duplicate seed lot allocation" };
    }
    seedAllocSeen.add(alloc.seedLotId);
    const lot = await tx.seedLot.findUnique({ where: { id: alloc.seedLotId } });
    if (!lot) {
      return { ok: false, message: "Seed lot not found" };
    }
    if (lot.status !== SeedLotStatus.AVAILABLE) {
      return { ok: false, message: "Seed lot is not available" };
    }
    const line = seedLines.find((l) => l.seedVarietyId === lot.seedVarietyId);
    if (!line) {
      return { ok: false, message: "Seed lot does not match required seed variety" };
    }
    seedLotIds.add(alloc.seedLotId);
    const consumption = calculateConsumptionForTrayAllocation(
      format,
      line,
      alloc.quantity,
    );
    prepared.push({
      seedLotId: alloc.seedLotId,
      bomLineKey: line.lineKey,
      trays: alloc.quantity,
      consumedQuantity: consumption.consumedQuantity,
      consumedUom: consumption.consumedUom,
      changeFromPreselected: alloc.changeFromPreselected,
      changeReason: alloc.changeReason ?? null,
      notes: alloc.notes ?? null,
    });
  }

  for (const line of seedLines) {
    const sum = sumAllocationQuantities(
      input.seedLotAllocations.filter((a) => {
        const p = prepared.find((x) => x.seedLotId === a.seedLotId);
        return p?.bomLineKey === line.lineKey;
      }),
    );
    if (!quantitiesEqual(sum, actualQty)) {
      return {
        ok: false,
        message: allocationMismatchMessage(sum, actualQty),
      };
    }
  }

  for (const line of materialLines) {
    const lotsForLine = input.materialLotAllocations.filter(
      (a) => a.materialId === line.materialId,
    );
    const seen = new Set<string>();
    for (const alloc of lotsForLine) {
      if (seen.has(alloc.materialLotId)) {
        return { ok: false, message: "Duplicate material lot allocation" };
      }
      seen.add(alloc.materialLotId);
      const lot = await tx.materialLot.findUnique({
        where: { id: alloc.materialLotId },
      });
      if (!lot || lot.materialId !== line.materialId) {
        return { ok: false, message: "Material lot does not match required material" };
      }
      if (lot.status !== MaterialLotStatus.AVAILABLE) {
        return { ok: false, message: "Material lot is not available" };
      }
      materialLotIds.add(alloc.materialLotId);
    }

    const sum = sumAllocationQuantities(lotsForLine);
    if (!quantitiesEqual(sum, actualQty)) {
      return {
        ok: false,
        message: allocationMismatchMessage(sum, actualQty),
      };
    }

    for (const alloc of lotsForLine) {
      const consumption = calculateConsumptionForTrayAllocation(
        format,
        line,
        alloc.quantity,
      );
      prepared.push({
        materialLotId: alloc.materialLotId,
        materialId: line.materialId,
        bomLineKey: line.lineKey,
        trays: alloc.quantity,
        consumedQuantity: consumption.consumedQuantity,
        consumedUom: consumption.consumedUom,
        changeFromPreselected: alloc.changeFromPreselected,
        changeReason: alloc.changeReason ?? null,
        notes: alloc.notes ?? null,
      });
    }
  }

  for (const line of materialLines) {
    const hasAny = prepared.some(
      (p) => p.materialId === line.materialId && p.materialLotId,
    );
    if (!hasAny) {
      return {
        ok: false,
        message: `Material lot allocation is required for ${line.name}`,
      };
    }
  }

  const extraMaterial = input.materialLotAllocations.filter(
    (a) => !materialLines.some((l) => l.materialId === a.materialId),
  );
  if (extraMaterial.length > 0) {
    return { ok: false, message: "Unknown material lot allocation" };
  }

  return {
    ok: true,
    allocations: prepared,
    lotIdsToLock: {
      seed: [...seedLotIds],
      material: [...materialLotIds],
    },
  };
}

export async function lockLots(
  tx: Tx,
  seedLotIds: string[],
  materialLotIds: string[],
): Promise<void> {
  for (const id of seedLotIds) {
    await tx.$queryRaw`SELECT id FROM seed_lots WHERE id = ${id}::uuid FOR UPDATE`;
  }
  for (const id of materialLotIds) {
    await tx.$queryRaw`SELECT id FROM material_lots WHERE id = ${id}::uuid FOR UPDATE`;
  }
}
