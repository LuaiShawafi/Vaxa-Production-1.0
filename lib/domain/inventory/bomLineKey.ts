export function seedBomLineKey(seedVarietyId: string): string {
  return `SEED:${seedVarietyId}`;
}

export function materialBomLineKey(materialId: string): string {
  return `MATERIAL:${materialId}`;
}
