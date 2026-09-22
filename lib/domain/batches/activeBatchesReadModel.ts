import {
  BatchStage,
  ProductionEventType,
  ProductionFormat,
  type Prisma,
} from "@prisma/client";
import { deriveExpectedNurseryCompletionAt } from "@/lib/domain/germination/germinationTimeline";

/** Currently implemented growing stages shown on the Batches management overview. */
export const ACTIVE_BATCH_STAGES = [
  BatchStage.GERMINATION,
  BatchStage.NURSERY,
] as const;

export type ActiveBatchStage = (typeof ACTIVE_BATCH_STAGES)[number];

export const ACTIVE_BATCH_EVENT_TYPES = [
  ProductionEventType.SEEDING_COMPLETED,
  ProductionEventType.MOVED_TO_NURSERY,
] as const;

export type ActiveBatchListItem = {
  id: string;
  visibleBatchNumber: string;
  skuCode: string;
  skuDescription: string | null;
  productionFormat: ProductionFormat;
  currentStage: ActiveBatchStage;
  currentDestination: string;
  originalAssignedDestination: string;
  /** `SEEDING_COMPLETED.actualQuantity` as decimal string; trays in V1. */
  actualSeededQuantity: string | null;
  quantityUom: string | null;
  seededAt: Date | null;
  expectedGerminationAt: Date | null;
  germinationDaysSnapshot: number | null;
  nurseryDaysSnapshot: number | null;
  movedToNurseryAt: Date | null;
  /** Derived from move instant + `nurseryDaysSnapshot`; not persisted. */
  expectedNurseryCompletionAt: Date | null;
};

export type ActiveBatchesReadModel = {
  germination: ActiveBatchListItem[];
  nursery: ActiveBatchListItem[];
};

export type ActiveBatchQueryRow = {
  id: string;
  visibleBatchNumber: string;
  currentStage: BatchStage;
  currentDestination: string;
  originalAssignedDestination: string;
  expectedGerminationAt: Date | null;
  germinationDaysSnapshot: number | null;
  nurseryDaysSnapshot: number | null;
  sku: {
    code: string;
    description: string | null;
    productionFormat: ProductionFormat;
  };
  productionEvents: Array<{
    eventType: ProductionEventType;
    actualQuantity: Prisma.Decimal;
    quantityUom: string;
    occurredAt: Date;
  }>;
};

export function isActiveBatchStage(
  stage: BatchStage,
): stage is ActiveBatchStage {
  return (
    stage === BatchStage.GERMINATION || stage === BatchStage.NURSERY
  );
}

export function toActiveBatchListItem(
  row: ActiveBatchQueryRow,
): ActiveBatchListItem | null {
  if (!isActiveBatchStage(row.currentStage)) {
    return null;
  }

  const seedingEvent = row.productionEvents.find(
    (event) => event.eventType === ProductionEventType.SEEDING_COMPLETED,
  );
  const movedEvent = row.productionEvents.find(
    (event) => event.eventType === ProductionEventType.MOVED_TO_NURSERY,
  );

  const movedToNurseryAt = movedEvent?.occurredAt ?? null;

  return {
    id: row.id,
    visibleBatchNumber: row.visibleBatchNumber,
    skuCode: row.sku.code,
    skuDescription: row.sku.description,
    productionFormat: row.sku.productionFormat,
    currentStage: row.currentStage,
    currentDestination: row.currentDestination,
    originalAssignedDestination: row.originalAssignedDestination,
    actualSeededQuantity: seedingEvent?.actualQuantity.toString() ?? null,
    quantityUom: seedingEvent?.quantityUom ?? null,
    seededAt: seedingEvent?.occurredAt ?? null,
    expectedGerminationAt: row.expectedGerminationAt,
    germinationDaysSnapshot: row.germinationDaysSnapshot,
    nurseryDaysSnapshot: row.nurseryDaysSnapshot,
    movedToNurseryAt,
    expectedNurseryCompletionAt: movedToNurseryAt
      ? deriveExpectedNurseryCompletionAt(
          movedToNurseryAt,
          row.nurseryDaysSnapshot,
        )
      : null,
  };
}

export function toActiveBatchesReadModel(
  rows: ActiveBatchQueryRow[],
): ActiveBatchesReadModel {
  const germination: ActiveBatchListItem[] = [];
  const nursery: ActiveBatchListItem[] = [];

  for (const row of rows) {
    const item = toActiveBatchListItem(row);
    if (!item) {
      continue;
    }
    if (item.currentStage === BatchStage.GERMINATION) {
      germination.push(item);
    } else {
      nursery.push(item);
    }
  }

  return { germination, nursery };
}
