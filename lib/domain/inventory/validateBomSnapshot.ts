import type { BomSnapshot } from "@/lib/validation/seeding";

export function validateBomSnapshotForConsumption(
  snapshot: BomSnapshot,
  skuCode: string,
): string | null {
  if (!snapshot.ready) {
    return `Production BOM is not ready for ${skuCode}. Configure all required BOM inputs before completing seeding.`;
  }
  if (snapshot.lines.length === 0) {
    return `Production BOM is not ready for ${skuCode}. Configure all required BOM inputs before completing seeding.`;
  }
  const hasSeed = snapshot.lines.some((l) => l.kind === "SEED");
  if (!hasSeed) {
    return `Production BOM is not ready for ${skuCode}. Configure all required BOM inputs before completing seeding.`;
  }
  for (const line of snapshot.lines) {
    if (line.qtyPerUnit <= 0) {
      return `Production BOM is not ready for ${skuCode}. Configure all required BOM inputs before completing seeding.`;
    }
    if (line.kind === "SEED" && !line.uom?.trim()) {
      return `Production BOM seed line for ${skuCode} must declare a canonical seed UOM.`;
    }
    if (line.kind === "SEED" && !line.seedVarietyId) {
      return `Production BOM is not ready for ${skuCode}. Configure all required BOM inputs before completing seeding.`;
    }
    if (line.kind === "MATERIAL" && !line.materialId) {
      return `Production BOM is not ready for ${skuCode}. Configure all required BOM inputs before completing seeding.`;
    }
  }
  return null;
}
