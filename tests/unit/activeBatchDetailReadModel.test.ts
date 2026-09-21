import { describe, expect, it } from "vitest";
import {
  BatchStage,
  ProductionEventType,
  ProductionFormat,
  Prisma,
} from "@prisma/client";
import { parseDateInput } from "@/lib/date";
import {
  deriveActualGerminationDays,
  deriveExpectedNurseryCompletionAt,
} from "@/lib/domain/germination/germinationTimeline";
import {
  ACTIVE_BATCH_DETAIL_EVENT_TYPES,
  toActiveBatchDetail,
  type ActiveBatchDetailQueryEvent,
  type ActiveBatchDetailQueryRow,
} from "@/lib/domain/batches/activeBatchDetailReadModel";

function event(
  overrides: Partial<ActiveBatchDetailQueryEvent> &
    Pick<ActiveBatchDetailQueryEvent, "id" | "eventType" | "occurredAt">,
): ActiveBatchDetailQueryEvent {
  return {
    actualQuantity: new Prisma.Decimal("35"),
    quantityUom: "trays",
    destinationBefore: null,
    destinationAfter: null,
    changeReasonCode: null,
    changeExplanation: null,
    stageBefore: BatchStage.GERMINATION,
    stageAfter: BatchStage.GERMINATION,
    initiatedByUser: { name: "Alex" },
    ...overrides,
  };
}

function seedingEvent(
  id: string,
  occurredAt: Date,
  quantity = "35",
): ActiveBatchDetailQueryEvent {
  return event({
    id,
    eventType: ProductionEventType.SEEDING_COMPLETED,
    occurredAt,
    actualQuantity: new Prisma.Decimal(quantity),
    quantityUom: "trays",
    stageBefore: BatchStage.PLANNED,
    stageAfter: BatchStage.GERMINATION,
  });
}

function moveEvent(id: string, occurredAt: Date): ActiveBatchDetailQueryEvent {
  return event({
    id,
    eventType: ProductionEventType.MOVED_TO_NURSERY,
    occurredAt,
    stageBefore: BatchStage.GERMINATION,
    stageAfter: BatchStage.NURSERY,
  });
}

function row(
  overrides: Partial<ActiveBatchDetailQueryRow> &
    Pick<ActiveBatchDetailQueryRow, "id" | "currentStage">,
): ActiveBatchDetailQueryRow {
  return {
    visibleBatchNumber: "0101402",
    currentDestination: "402",
    originalAssignedDestination: "402",
    expectedGerminationAt: parseDateInput("2097-01-05"),
    germinationDaysSnapshot: 4,
    nurseryDaysSnapshot: 11,
    sku: {
      code: "PU_RED_RADISH",
      description: "Red radish",
      productionFormat: ProductionFormat.PU,
    },
    productionEvents: [],
    ...overrides,
  };
}

describe("active batch detail read model", () => {
  it("exposes only the four implemented event types", () => {
    expect([...ACTIVE_BATCH_DETAIL_EVENT_TYPES]).toEqual([
      ProductionEventType.SEEDING_COMPLETED,
      ProductionEventType.DESTINATION_CHANGED,
      ProductionEventType.GERMINATION_EXTENDED,
      ProductionEventType.MOVED_TO_NURSERY,
    ]);
  });

  it("maps a GERMINATION batch with seeding identity, quantity, destination, and timing", () => {
    const seededAt = parseDateInput("2097-01-01");
    seededAt.setUTCHours(12, 0, 0, 0);
    const expected = parseDateInput("2097-01-05");
    const detail = toActiveBatchDetail(
      row({
        id: "g1",
        currentStage: BatchStage.GERMINATION,
        visibleBatchNumber: "0101406",
        currentDestination: "410",
        originalAssignedDestination: "406",
        expectedGerminationAt: expected,
        germinationDaysSnapshot: 4,
        sku: {
          code: "PU_RED_RADISH",
          description: "Red radish microgreen",
          productionFormat: ProductionFormat.PU,
        },
        productionEvents: [seedingEvent("seed-1", seededAt, "35")],
      }),
    );

    expect(detail).toMatchObject({
      id: "g1",
      visibleBatchNumber: "0101406",
      skuCode: "PU_RED_RADISH",
      skuDescription: "Red radish microgreen",
      productionFormat: ProductionFormat.PU,
      currentStage: BatchStage.GERMINATION,
      currentDestination: "410",
      originalAssignedDestination: "406",
      actualSeededQuantity: "35",
      quantityUom: "trays",
      expectedGerminationAt: expected,
      germinationDaysSnapshot: 4,
      movedToNurseryAt: null,
      expectedNurseryCompletionAt: null,
      actualGerminationDays: null,
    });
    expect(detail?.seededAt).toEqual(seededAt);
    expect(detail?.productionHistory).toHaveLength(1);
    expect(detail?.productionHistory[0]).toMatchObject({
      eventType: ProductionEventType.SEEDING_COMPLETED,
      actualQuantity: "35",
      quantityUom: "trays",
      userName: "Alex",
    });
  });

  it("maps a NURSERY batch and derives expected nursery completion", () => {
    const seededAt = parseDateInput("2097-01-01");
    seededAt.setUTCHours(10, 0, 0, 0);
    const movedAt = parseDateInput("2097-01-04");
    movedAt.setUTCHours(8, 30, 0, 0);
    const detail = toActiveBatchDetail(
      row({
        id: "n1",
        currentStage: BatchStage.NURSERY,
        nurseryDaysSnapshot: 11,
        productionEvents: [
          seedingEvent("seed-1", seededAt, "21"),
          moveEvent("move-1", movedAt),
        ],
      }),
    );

    expect(detail?.currentStage).toBe(BatchStage.NURSERY);
    expect(detail?.actualSeededQuantity).toBe("21");
    expect(detail?.movedToNurseryAt).toEqual(movedAt);
    expect(detail?.expectedNurseryCompletionAt).toEqual(
      deriveExpectedNurseryCompletionAt(movedAt, 11),
    );
    expect(detail?.actualGerminationDays).toBe(
      deriveActualGerminationDays(seededAt, movedAt),
    );
  });

  it("returns null for PLANNED and HARVESTED rows", () => {
    expect(
      toActiveBatchDetail(row({ id: "p1", currentStage: BatchStage.PLANNED })),
    ).toBeNull();
    expect(
      toActiveBatchDetail(
        row({ id: "h1", currentStage: BatchStage.HARVESTED }),
      ),
    ).toBeNull();
  });

  it("is null-safe when SEEDING_COMPLETED is missing", () => {
    const detail = toActiveBatchDetail(
      row({
        id: "g-missing-seed",
        currentStage: BatchStage.GERMINATION,
        expectedGerminationAt: null,
        productionEvents: [],
      }),
    );

    expect(detail).not.toBeNull();
    expect(detail?.actualSeededQuantity).toBeNull();
    expect(detail?.quantityUom).toBeNull();
    expect(detail?.seededAt).toBeNull();
    expect(detail?.expectedGerminationAt).toBeNull();
    expect(detail?.productionHistory).toEqual([]);
  });

  it("is null-safe when MOVED_TO_NURSERY is missing", () => {
    const seededAt = parseDateInput("2097-01-01");
    const detail = toActiveBatchDetail(
      row({
        id: "n-missing-move",
        currentStage: BatchStage.NURSERY,
        productionEvents: [seedingEvent("seed-1", seededAt, "8")],
      }),
    );

    expect(detail).not.toBeNull();
    expect(detail?.movedToNurseryAt).toBeNull();
    expect(detail?.expectedNurseryCompletionAt).toBeNull();
    expect(detail?.actualGerminationDays).toBeNull();
    expect(detail?.actualSeededQuantity).toBe("8");
  });

  it("leaves expected nursery completion null when the snapshot is missing", () => {
    const movedAt = parseDateInput("2097-01-04");
    const detail = toActiveBatchDetail(
      row({
        id: "n-missing-snapshot",
        currentStage: BatchStage.NURSERY,
        nurseryDaysSnapshot: null,
        productionEvents: [
          seedingEvent("seed-1", parseDateInput("2097-01-01")),
          moveEvent("move-1", movedAt),
        ],
      }),
    );

    expect(detail?.movedToNurseryAt).toEqual(movedAt);
    expect(detail?.expectedNurseryCompletionAt).toBeNull();
  });

  it("maps all four implemented event types without inventing extension dates", () => {
    const seededAt = parseDateInput("2097-01-01");
    seededAt.setUTCHours(9, 0, 0, 0);
    const extendedAt = parseDateInput("2097-01-03");
    extendedAt.setUTCHours(11, 0, 0, 0);
    const destAt = parseDateInput("2097-01-03");
    destAt.setUTCHours(15, 0, 0, 0);
    const movedAt = parseDateInput("2097-01-05");
    movedAt.setUTCHours(8, 0, 0, 0);

    const detail = toActiveBatchDetail(
      row({
        id: "n-history",
        currentStage: BatchStage.NURSERY,
        currentDestination: "410",
        originalAssignedDestination: "402",
        productionEvents: [
          moveEvent("move-1", movedAt),
          event({
            id: "dest-1",
            eventType: ProductionEventType.DESTINATION_CHANGED,
            occurredAt: destAt,
            destinationBefore: "402",
            destinationAfter: "410",
            changeReasonCode: "test",
            changeExplanation: null,
            stageBefore: BatchStage.GERMINATION,
            stageAfter: BatchStage.GERMINATION,
          }),
          event({
            id: "ext-1",
            eventType: ProductionEventType.GERMINATION_EXTENDED,
            occurredAt: extendedAt,
            changeReasonCode: "PLUS_2",
            changeExplanation: null,
          }),
          seedingEvent("seed-1", seededAt, "35"),
        ],
      }),
    );

    expect(detail?.productionHistory.map((item) => item.eventType)).toEqual([
      ProductionEventType.SEEDING_COMPLETED,
      ProductionEventType.GERMINATION_EXTENDED,
      ProductionEventType.DESTINATION_CHANGED,
      ProductionEventType.MOVED_TO_NURSERY,
    ]);

    const seeding = detail?.productionHistory[0];
    expect(seeding).toMatchObject({
      eventType: ProductionEventType.SEEDING_COMPLETED,
      actualQuantity: "35",
      quantityUom: "trays",
    });

    const extension = detail?.productionHistory[1];
    expect(extension).toEqual({
      id: "ext-1",
      eventType: ProductionEventType.GERMINATION_EXTENDED,
      occurredAt: extendedAt,
      userName: "Alex",
      reasonCode: "PLUS_2",
      explanation: null,
    });
    expect(extension).not.toHaveProperty("previousExpectedGerminationAt");
    expect(extension).not.toHaveProperty("nextExpectedGerminationAt");

    const destination = detail?.productionHistory[2];
    expect(destination).toMatchObject({
      eventType: ProductionEventType.DESTINATION_CHANGED,
      fromDestination: "402",
      toDestination: "410",
      reasonCode: "test",
    });

    const moved = detail?.productionHistory[3];
    expect(moved).toMatchObject({
      eventType: ProductionEventType.MOVED_TO_NURSERY,
      stageBefore: BatchStage.GERMINATION,
      stageAfter: BatchStage.NURSERY,
    });
    expect(moved).not.toHaveProperty("fromDestination");
    expect(moved).not.toHaveProperty("toDestination");
  });

  it("does not treat MOVED_TO_NURSERY destination fields as a destination change", () => {
    const movedAt = parseDateInput("2097-01-04");
    const detail = toActiveBatchDetail(
      row({
        id: "n1",
        currentStage: BatchStage.NURSERY,
        productionEvents: [
          seedingEvent("seed-1", parseDateInput("2097-01-01")),
          event({
            id: "move-1",
            eventType: ProductionEventType.MOVED_TO_NURSERY,
            occurredAt: movedAt,
            destinationBefore: null,
            destinationAfter: null,
            stageBefore: BatchStage.GERMINATION,
            stageAfter: BatchStage.NURSERY,
          }),
        ],
      }),
    );

    const moved = detail?.productionHistory.find(
      (item) => item.eventType === ProductionEventType.MOVED_TO_NURSERY,
    );
    expect(moved).toMatchObject({
      eventType: ProductionEventType.MOVED_TO_NURSERY,
      stageBefore: BatchStage.GERMINATION,
      stageAfter: BatchStage.NURSERY,
    });
    expect(detail?.currentDestination).toBe("402");
  });

  it("skips event types outside the implemented management history", () => {
    const detail = toActiveBatchDetail(
      row({
        id: "g1",
        currentStage: BatchStage.GERMINATION,
        productionEvents: [
          seedingEvent("seed-1", parseDateInput("2097-01-01")),
          event({
            id: "unknown-1",
            eventType: "NOT_AN_IMPLEMENTED_EVENT" as ProductionEventType,
            occurredAt: parseDateInput("2097-01-02"),
          }),
        ],
      }),
    );

    expect(detail?.productionHistory.map((item) => item.eventType)).toEqual([
      ProductionEventType.SEEDING_COMPLETED,
    ]);
  });

  it("keeps a missing initiator name null-safe", () => {
    const seededAt = parseDateInput("2097-01-01");
    const detail = toActiveBatchDetail(
      row({
        id: "g1",
        currentStage: BatchStage.GERMINATION,
        productionEvents: [
          event({
            id: "seed-1",
            eventType: ProductionEventType.SEEDING_COMPLETED,
            occurredAt: seededAt,
            initiatedByUser: null,
            stageBefore: BatchStage.PLANNED,
            stageAfter: BatchStage.GERMINATION,
          }),
        ],
      }),
    );

    expect(detail?.productionHistory[0]?.userName).toBeNull();
  });
});
