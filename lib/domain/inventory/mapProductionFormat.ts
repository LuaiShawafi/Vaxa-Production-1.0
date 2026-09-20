import { ProductionFormat } from "@prisma/client";

/** Maps workbook Growing_method (exact or normalized) to ProductionFormat. */
export function productionFormatFromGrowingMethod(
  growingMethod: string | null | undefined,
): ProductionFormat | null {
  if (!growingMethod) {
    return null;
  }
  const n = growingMethod.trim().toLowerCase();
  if (n === "punnet") {
    return ProductionFormat.PU;
  }
  if (n === "plug transplanted" || n === "plugs transplanted") {
    return ProductionFormat.PL;
  }
  if (n === "flat tray") {
    return ProductionFormat.TR;
  }
  return null;
}
