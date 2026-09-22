import { describe, expect, it } from "vitest";
import {
  BatchStage,
  ProductionEventType,
  ProductionFormat,
  Prisma,
} from "@prisma/client";
import { parseDateInput } from "@/lib/date";
import { deriveExpectedNurseryCompletionAt } from "@/lib/domain/germination/germinationTimeline";
import {
  toActiveBatchListItem,
  toActiveBatchesReadModel,
  type ActiveBatchQueryRow,
} from "@/lib/domain/batches/activeBatchesReadModel";

function row(
  overrides: Partial<ActiveBatchQueryRow> &
    Pick<ActiveBatchQueryRow, "id" | "currentStage">,
): ActiveBatchQueryRow {
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

function seedingEvent(quantity: string, occurredAt: Date) {
  return {
    eventType: ProductionEventType.SEEDING_COMPLETED,
    actualQuantity: new Prisma.Decimal(quantity),
    quantityUom: "trays",
    occurredAt,
  };
}

function moveEvent(occurredAt: Date) {
  return {
    eventType: ProductionEventType.MOVED_TO_NURSERY,
    actualQuantity: new Prisma.Decimal("35"),
    quantityUom: "trays",
    occurredAt,
  };
}

describe("active batches read model mapper", () => {
  it("returns empty groups when there are no active rows", () => {
    expect(toActiveBatchesReadModel([])).toEqual({
      germination: [],
      nursery: [],
    });
  });

  it("groups GERMINATION and NURSERY and skips other stages", () => {
    const seededAt = parseDateInput("2097-01-01");
    seededAt.setUTCHours(10, 0, 0, 0);
    const movedAt = parseDateInput("2097-01-04");
    movedAt.setUTCHours(9, 0, 0, 0);

    const result = toActiveBatchesReadModel([
      row({
        id: "g1",
        currentStage: BatchStage.GERMINATION,
        visibleBatchNumber: "0202402",
        productionEvents: [seedingEvent("20", seededAt)],
      }),
      row({
        id: "planned",
        currentStage: BatchStage.PLANNED,
        productionEvents: [],
      }),
      row({
        id: "n1",
        currentStage: BatchStage.NURSERY,
        visibleBatchNumber: "0101402",
        productionEvents: [seedingEvent("35", seededAt), moveEvent(movedAt)],
      }),
      row({
        id: "harvested",
        currentStage: BatchStage.HARVESTED,
        productionEvents: [seedingEvent("10", seededAt), moveEvent(movedAt)],
      }),
    ]);

    expect(result.germination.map((b) => b.id)).toEqual(["g1"]);
    expect(result.nursery.map((b) => b.id)).toEqual(["n1"]);
  });

  it("maps seeded quantity, SKU format, destination, and germination timing", () => {
    const seededAt = parseDateInput("2097-01-01");
    seededAt.setUTCHours(12, 0, 0, 0);
    const expected = parseDateInput("2097-01-05");
    const item = toActiveBatchListItem(
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
        productionEvents: [seedingEvent("35", seededAt)],
      }),
    );

    expect(item).toMatchObject({
      id: "g1",
      visibleBatchNumber: "0101406",
      skuCode: "PU_RED_RADISH",
      skuDescription: "Red radish microgreen",
      productionFormat: ProductionFormat.PU,
      currentStage: BatchStage.GERMINATION,
      currentDestination: "410",
      originalAssignedDestination: "406",
      actualSeededQuantity: new Prisma.Decimal("35").toString(),
      quantityUom: "trays",
      expectedGerminationAt: expected,
      germinationDaysSnapshot: 4,
      movedToNurseryAt: null,
      expectedNurseryCompletionAt: null,
    });
    expect(item?.seededAt).toEqual(seededAt);
  });

  it("derives expected nursery completion from the move event, not live SKU days", () => {
    const seededAt = parseDateInput("2097-01-01");
    const movedAt = parseDateInput("2097-01-04");
    movedAt.setUTCHours(8, 30, 0, 0);
    const item = toActiveBatchListItem(
      row({
        id: "n1",
        currentStage: BatchStage.NURSERY,
        nurseryDaysSnapshot: 11,
        productionEvents: [
          seedingEvent("21", seededAt),
          moveEvent(movedAt),
          {
            eventType: ProductionEventType.GERMINATION_EXTENDED,
            actualQuantity: new Prisma.Decimal("21"),
            quantityUom: "trays",
            occurredAt: parseDateInput("2097-01-03"),
          },
        ],
      }),
    );

    expect(item?.actualSeededQuantity).toBe("21");
    expect(item?.movedToNurseryAt).toEqual(movedAt);
    expect(item?.expectedNurseryCompletionAt).toEqual(
      deriveExpectedNurseryCompletionAt(movedAt, 11),
    );
  });

  it("leaves expected nursery completion null when the snapshot is missing", () => {
    const movedAt = parseDateInput("2097-01-04");
    const item = toActiveBatchListItem(
      row({
        id: "n1",
        currentStage: BatchStage.NURSERY,
        nurseryDaysSnapshot: null,
        productionEvents: [
          seedingEvent("8", parseDateInput("2097-01-01")),
          moveEvent(movedAt),
        ],
      }),
    );
    expect(item?.expectedNurseryCompletionAt).toBeNull();
  });
});
