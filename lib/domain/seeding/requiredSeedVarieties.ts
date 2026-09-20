import type { BomSnapshot } from "@/lib/validation/seeding";

/** Seed varieties required for completion (frozen BOM first, then SKU primary). */
export function requiredSeedVarietyIds(
  bom: BomSnapshot | null | undefined,
  primarySeedVarietyId: string,
): string[] {
  const fromBom =
    bom?.lines
      .filter((l) => l.kind === "SEED" && l.seedVarietyId)
      .map((l) => l.seedVarietyId!) ?? [];
  const unique = [...new Set(fromBom)];
  if (unique.length > 0) {
    return unique;
  }
  return [primarySeedVarietyId];
}

export function requiredSeedLabels(bom: BomSnapshot | null | undefined): string[] {
  return (
    bom?.lines
      .filter((l) => l.kind === "SEED")
      .map((l) => l.name)
      .filter(Boolean) ?? []
  );
}
