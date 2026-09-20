import { ProductionFormat } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { BomSnapshotLine } from "@/lib/validation/seeding";
import {
  productionUnitsToConsumption,
  traysToProductionUnits,
} from "@/lib/domain/inventory/productionFormatMath";

export type ConsumptionLineResult = {
  bomLineKey: string;
  kind: "SEED" | "MATERIAL";
  traysAllocated: Prisma.Decimal;
  productionUnits: Prisma.Decimal;
  consumedQuantity: Prisma.Decimal;
  consumedUom: string;
};

export function calculateConsumptionForTrayAllocation(
  format: ProductionFormat,
  bomLine: BomSnapshotLine,
  traysAllocated: Prisma.Decimal | number,
): ConsumptionLineResult {
  const trays =
    traysAllocated instanceof Prisma.Decimal
      ? traysAllocated
      : new Prisma.Decimal(String(traysAllocated));
  const productionUnits = traysToProductionUnits(trays, format);
  const qtyPerUnit = new Prisma.Decimal(String(bomLine.qtyPerUnit));
  const consumedQuantity = productionUnitsToConsumption(
    productionUnits,
    qtyPerUnit,
  );
  return {
    bomLineKey: bomLine.lineKey,
    kind: bomLine.kind,
    traysAllocated: trays,
    productionUnits,
    consumedQuantity,
    consumedUom: bomLine.uom,
  };
}

export function sumConsumptionLines(
  lines: ConsumptionLineResult[],
): Prisma.Decimal {
  return lines.reduce(
    (sum, line) => sum.add(line.consumedQuantity),
    new Prisma.Decimal(0),
  );
}
