import {
  BatchStage,
  ProductionEventType,
  ProductionFormat,
  type Prisma,
} from "@prisma/client";
import {
  deriveActualGerminationDays,
  deriveExpectedNurseryCompletionAt,
} from "@/lib/domain/germination/germinationTimeline";
import {
  isActiveBatchStage,
  type ActiveBatchStage,
} from "@/lib/domain/batches/activeBatchesReadModel";

/** Implemented production events shown on the active-batch management detail. */
export const ACTIVE_BATCH_DETAIL_EVENT_TYPES = [
  ProductionEventType.SEEDING_COMPLETED,
  ProductionEventType.DESTINATION_CHANGED,
  ProductionEventType.GERMINATION_EXTENDED,
  ProductionEventType.MOVED_TO_NURSERY,
] as const;

export type ActiveBatchDetailEventType =
  (typeof ACTIVE_BATCH_DETAIL_EVENT_TYPES)[number];

type ActiveBatchDetailEventBase = {
  id: string;
  occurredAt: Date;
  userName: string | null;
};

export type ActiveBatchSeedingEvent = ActiveBatchDetailEventBase & {
  eventType: typeof ProductionEventType.SEEDING_COMPLETED;
  actualQuantity: string | null;
  quantityUom: string | null;
};

export type ActiveBatchDestinationChangedEvent = ActiveBatchDetailEventBase & {
  eventType: typeof ProductionEventType.DESTINATION_CHANGED;
  fromDestination: string | null;
  toDestination: string | null;
  reasonCode: string | null;
  explanation: string | null;
};

export type ActiveBatchGerminationExtendedEvent = ActiveBatchDetailEventBase & {
  eventType: typeof ProductionEventType.GERMINATION_EXTENDED;
  reasonCode: string | null;
  explanation: string | null;
};

export type ActiveBatchMovedToNurseryEvent = ActiveBatchDetailEventBase & {
  eventType: typeof ProductionEventType.MOVED_TO_NURSERY;
  stageBefore: BatchStage | null;
  stageAfter: BatchStage | null;
};

export type ActiveBatchDetailEvent =
  | ActiveBatchSeedingEvent
  | ActiveBatchDestinationChangedEvent
  | ActiveBatchGerminationExtendedEvent
  | ActiveBatchMovedToNurseryEvent;

export type ActiveBatchDetail = {
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
  movedToNurseryAt: Date | null;
  nurseryDaysSnapshot: number | null;
  /** Derived from move instant + `nurseryDaysSnapshot`; not persisted. */
  expectedNurseryCompletionAt: Date | null;
  /**
   * Operational calendar days from seeding to nursery move.
   * Derived only when both events exist; not a schema field.
   */
  actualGerminationDays: number | null;
  productionHistory: ActiveBatchDetailEvent[];
};

export type ActiveBatchDetailQueryEvent = {
  id: string;
  eventType: ProductionEventType;
  occurredAt: Date;
  actualQuantity: Prisma.Decimal;
  quantityUom: string;
  destinationBefore: string | null;
  destinationAfter: string | null;
  changeReasonCode: string | null;
  changeExplanation: string | null;
  stageBefore: BatchStage;
  stageAfter: BatchStage;
  initiatedByUser: { name: string } | null;
};

export type ActiveBatchDetailQueryRow = {
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
  productionEvents: ActiveBatchDetailQueryEvent[];
};

function eventUserName(event: ActiveBatchDetailQueryEvent): string | null {
  return event.initiatedByUser?.name ?? null;
}

function toActiveBatchDetailEvent(
  event: ActiveBatchDetailQueryEvent,
): ActiveBatchDetailEvent | null {
  switch (event.eventType) {
    case ProductionEventType.SEEDING_COMPLETED:
      return {
        id: event.id,
        eventType: ProductionEventType.SEEDING_COMPLETED,
        occurredAt: event.occurredAt,
        userName: eventUserName(event),
        actualQuantity: event.actualQuantity.toString(),
        quantityUom: event.quantityUom,
      };
    case ProductionEventType.DESTINATION_CHANGED:
      return {
        id: event.id,
        eventType: ProductionEventType.DESTINATION_CHANGED,
        occurredAt: event.occurredAt,
        userName: eventUserName(event),
        fromDestination: event.destinationBefore,
        toDestination: event.destinationAfter,
        reasonCode: event.changeReasonCode,
        explanation: event.changeExplanation,
      };
    case ProductionEventType.GERMINATION_EXTENDED:
      return {
        id: event.id,
        eventType: ProductionEventType.GERMINATION_EXTENDED,
        occurredAt: event.occurredAt,
        userName: eventUserName(event),
        reasonCode: event.changeReasonCode,
        explanation: event.changeExplanation,
      };
    case ProductionEventType.MOVED_TO_NURSERY:
      return {
        id: event.id,
        eventType: ProductionEventType.MOVED_TO_NURSERY,
        occurredAt: event.occurredAt,
        userName: eventUserName(event),
        stageBefore: event.stageBefore,
        stageAfter: event.stageAfter,
      };
    default:
      return null;
  }
}

function chronologicalEvents(
  events: ActiveBatchDetailQueryEvent[],
): ActiveBatchDetailQueryEvent[] {
  return [...events].sort((a, b) => {
    const byTime = a.occurredAt.getTime() - b.occurredAt.getTime();
    if (byTime !== 0) {
      return byTime;
    }
    return a.id.localeCompare(b.id);
  });
}

export function toActiveBatchDetail(
  row: ActiveBatchDetailQueryRow,
): ActiveBatchDetail | null {
  if (!isActiveBatchStage(row.currentStage)) {
    return null;
  }

  const productionHistory = chronologicalEvents(row.productionEvents)
    .map(toActiveBatchDetailEvent)
    .filter((event): event is ActiveBatchDetailEvent => event != null);

  const seedingEvent = productionHistory.find(
    (event) => event.eventType === ProductionEventType.SEEDING_COMPLETED,
  );
  const movedEvent = productionHistory.find(
    (event) => event.eventType === ProductionEventType.MOVED_TO_NURSERY,
  );

  const seededAt = seedingEvent?.occurredAt ?? null;
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
    actualSeededQuantity: seedingEvent?.actualQuantity ?? null,
    quantityUom: seedingEvent?.quantityUom ?? null,
    seededAt,
    expectedGerminationAt: row.expectedGerminationAt,
    germinationDaysSnapshot: row.germinationDaysSnapshot,
    movedToNurseryAt,
    nurseryDaysSnapshot: row.nurseryDaysSnapshot,
    expectedNurseryCompletionAt: movedToNurseryAt
      ? deriveExpectedNurseryCompletionAt(
          movedToNurseryAt,
          row.nurseryDaysSnapshot,
        )
      : null,
    actualGerminationDays:
      seededAt && movedToNurseryAt
        ? deriveActualGerminationDays(seededAt, movedToNurseryAt)
        : null,
    productionHistory,
  };
}
