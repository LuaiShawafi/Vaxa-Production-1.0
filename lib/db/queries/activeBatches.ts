import "server-only";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  ACTIVE_BATCH_DETAIL_EVENT_TYPES,
  toActiveBatchDetail,
  type ActiveBatchDetail,
} from "@/lib/domain/batches/activeBatchDetailReadModel";
import {
  ACTIVE_BATCH_EVENT_TYPES,
  ACTIVE_BATCH_STAGES,
  toActiveBatchesReadModel,
  type ActiveBatchesReadModel,
} from "@/lib/domain/batches/activeBatchesReadModel";

type ActiveBatchesClient = Pick<PrismaClient, "batch">;

/**
 * Compact server-side read model for `/batches/active`.
 * One `findMany` with targeted SKU + event selects — not a per-batch history load.
 */
export async function listActiveBatches(
  db: ActiveBatchesClient = prisma,
): Promise<ActiveBatchesReadModel> {
  const rows = await db.batch.findMany({
    where: {
      currentStage: { in: [...ACTIVE_BATCH_STAGES] },
    },
    orderBy: { visibleBatchNumber: "asc" },
    select: {
      id: true,
      visibleBatchNumber: true,
      currentStage: true,
      currentDestination: true,
      originalAssignedDestination: true,
      expectedGerminationAt: true,
      germinationDaysSnapshot: true,
      nurseryDaysSnapshot: true,
      sku: {
        select: {
          code: true,
          description: true,
          productionFormat: true,
        },
      },
      productionEvents: {
        where: {
          eventType: {
            in: [...ACTIVE_BATCH_EVENT_TYPES],
          },
        },
        select: {
          eventType: true,
          actualQuantity: true,
          quantityUom: true,
          occurredAt: true,
        },
      },
    },
  });

  return toActiveBatchesReadModel(rows);
}

/**
 * Targeted management detail for one GERMINATION or NURSERY batch.
 * Stage is guarded in the database query; unsupported lifecycle stages return null.
 */
export async function getActiveBatchDetail(
  batchId: string,
  db: ActiveBatchesClient = prisma,
): Promise<ActiveBatchDetail | null> {
  const row = await db.batch.findFirst({
    where: {
      id: batchId,
      currentStage: { in: [...ACTIVE_BATCH_STAGES] },
    },
    select: {
      id: true,
      visibleBatchNumber: true,
      currentStage: true,
      currentDestination: true,
      originalAssignedDestination: true,
      expectedGerminationAt: true,
      germinationDaysSnapshot: true,
      nurseryDaysSnapshot: true,
      sku: {
        select: {
          code: true,
          description: true,
          productionFormat: true,
        },
      },
      productionEvents: {
        where: {
          eventType: {
            in: [...ACTIVE_BATCH_DETAIL_EVENT_TYPES],
          },
        },
        orderBy: { occurredAt: "asc" },
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          actualQuantity: true,
          quantityUom: true,
          destinationBefore: true,
          destinationAfter: true,
          changeReasonCode: true,
          changeExplanation: true,
          stageBefore: true,
          stageAfter: true,
          initiatedByUser: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  return toActiveBatchDetail(row);
}
