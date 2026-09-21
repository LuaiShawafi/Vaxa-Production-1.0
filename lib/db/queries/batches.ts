import "server-only";
import { BatchStage, ProductionEventType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function listGerminationBatches() {
  const batches = await prisma.batch.findMany({
    where: { currentStage: BatchStage.GERMINATION },
    orderBy: { visibleBatchNumber: "asc" },
    include: {
      sku: { select: { code: true } },
      productionEvents: {
        where: { eventType: ProductionEventType.SEEDING_COMPLETED },
        orderBy: { occurredAt: "desc" },
        take: 1,
        select: { occurredAt: true },
      },
    },
  });

  return batches.map((b) => ({
    id: b.id,
    visibleBatchNumber: b.visibleBatchNumber,
    skuCode: b.sku.code,
    currentDestination: b.currentDestination,
    originalAssignedDestination: b.originalAssignedDestination,
    expectedGerminationAt: b.expectedGerminationAt,
    seededAt: b.productionEvents[0]?.occurredAt ?? null,
  }));
}

export async function listActiveUsers() {
  return prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
