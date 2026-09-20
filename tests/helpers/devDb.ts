import { prisma } from "@/lib/db/prisma";

export async function requireSkuIdByCode(code: string): Promise<string> {
  const sku = await prisma.sku.findUnique({
    where: { code },
    select: { id: true },
  });
  if (!sku) {
    throw new Error(
      `SKU ${code} not found. Run npm run db:import-skus before integration tests.`,
    );
  }
  return sku.id;
}
