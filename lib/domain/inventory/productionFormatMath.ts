import { ProductionFormat } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { unitsPerPhysicalTray } from "@/lib/domain/productionFormat";

/** trays × units/tray → production units (Decimal-safe). */
export function traysToProductionUnits(
  trays: Prisma.Decimal | number,
  format: ProductionFormat,
): Prisma.Decimal {
  const t =
    trays instanceof Prisma.Decimal ? trays : new Prisma.Decimal(String(trays));
  return t.mul(unitsPerPhysicalTray(format));
}

/** production units × qtyPerUnit → inventory consumption (Decimal-safe). */
export function productionUnitsToConsumption(
  productionUnits: Prisma.Decimal,
  qtyPerUnit: Prisma.Decimal | number,
): Prisma.Decimal {
  const q =
    qtyPerUnit instanceof Prisma.Decimal
      ? qtyPerUnit
      : new Prisma.Decimal(String(qtyPerUnit));
  return productionUnits.mul(q);
}
