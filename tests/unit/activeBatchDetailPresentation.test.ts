import { describe, expect, it } from "vitest";
import {
  BatchStage,
  ProductionEventType,
  ProductionFormat,
} from "@prisma/client";
import {
  formatOperationalDateTime,
  formatOperationalDayLabel,
  parseDateInput,
} from "@/lib/date";
import type {
  ActiveBatchDetail,
  ActiveBatchDetailEvent,
} from "@/lib/domain/batches/activeBatchDetailReadModel";
import {
  germinationExtensionDays,
  presentActiveBatchDetailIdentity,
  presentActiveBatchDetailTiming,
  presentActiveBatchHistoryEvent,
} from "@/lib/batches/activeBatchDetailPresentation";
import { MISSING_VALUE } from "@/lib/batches/activeBatchOverviewPresentation";

function germinationDetail(
  overrides: Partial<ActiveBatchDetail> = {},
): ActiveBatchDetail {
  return {
    id: "g1",
    visibleBatchNumber: "2109402",
    skuCode: "PU_RED_RADISH",
    skuDescription: "Red radish",
    productionFormat: ProductionFormat.PU,
    currentStage: BatchStage.GERMINATION,
    currentDestination: "402",
    originalAssignedDestination: "410",
    actualSeededQuantity: "20",
    quantityUom: "trays",
    seededAt: parseDateInput("2026-09-17"),
    expectedGerminationAt: parseDateInput("2026-09-21"),
    germinationDaysSnapshot: 4,
    movedToNurseryAt: null,
    nurseryDaysSnapshot: 11,
    expectedNurseryCompletionAt: null,
    actualGerminationDays: null,
    productionHistory: [],
    ...overrides,
  };
}

describe("presentActiveBatchDetailIdentity", () => {
  it("shows destination, not current location, with actual seeded quantity", () => {
    const rows = presentActiveBatchDetailIdentity(germinationDetail());
    expect(rows).toEqual([
      { label: "SKU", value: "PU_RED_RADISH" },
      { label: "Description", value: "Red radish" },
      { label: "Production format", value: "PU" },
      { label: "Current stage", value: "Germination" },
      { label: "Quantity", value: "20 trays" },
      { label: "Destination", value: "402" },
      { label: "Original destination", value: "410" },
    ]);
    expect(rows.map((row) => row.label).join(" ")).not.toContain(
      "Current location",
    );
  });

  it("uses an em dash when description or quantity is missing", () => {
    const rows = presentActiveBatchDetailIdentity(
      germinationDetail({
        skuDescription: null,
        actualSeededQuantity: null,
        quantityUom: null,
      }),
    );
    expect(rows.find((row) => row.label === "Description")?.value).toBe(
      MISSING_VALUE,
    );
    expect(rows.find((row) => row.label === "Quantity")?.value).toBe(
      MISSING_VALUE,
    );
  });
});

describe("presentActiveBatchDetailTiming", () => {
  it("shows germination assessment timing and not nursery completion", () => {
    const seededAt = parseDateInput("2026-09-17");
    const expected = parseDateInput("2026-09-21");
    const rows = presentActiveBatchDetailTiming(
      germinationDetail({ seededAt, expectedGerminationAt: expected }),
    );

    expect(rows.map((row) => row.label)).toEqual([
      "Seeded",
      "Expected assessment",
      "Germination duration",
    ]);
    expect(rows[0]?.value).toBe(formatOperationalDateTime(seededAt));
    expect(rows[1]?.value).toBe(formatOperationalDayLabel(expected));
    expect(rows[2]?.value).toBe("4 days");
    expect(rows.map((row) => row.label)).not.toContain(
      "Expected Nursery completion",
    );
    expect(rows.map((row) => row.label)).not.toContain("Moved to Nursery");
  });

  it("shows nursery timing and does not reuse expected germination as assessment", () => {
    const seededAt = parseDateInput("2026-09-17");
    const movedAt = parseDateInput("2026-09-18");
    const expectedNursery = parseDateInput("2026-09-29");
    const rows = presentActiveBatchDetailTiming(
      germinationDetail({
        currentStage: BatchStage.NURSERY,
        seededAt,
        expectedGerminationAt: parseDateInput("2026-09-21"),
        movedToNurseryAt: movedAt,
        expectedNurseryCompletionAt: expectedNursery,
        actualGerminationDays: 1,
      }),
    );

    expect(rows.map((row) => row.label)).toEqual([
      "Seeded",
      "Moved to Nursery",
      "Expected Nursery completion",
      "Actual germination",
    ]);
    expect(rows[1]?.value).toBe(formatOperationalDateTime(movedAt));
    expect(rows[2]?.value).toBe(formatOperationalDayLabel(expectedNursery));
    expect(rows.map((row) => row.label)).not.toContain("Expected assessment");
  });

  it("uses an em dash when germination or nursery dates are missing", () => {
    expect(
      presentActiveBatchDetailTiming(
        germinationDetail({
          seededAt: null,
          expectedGerminationAt: null,
          germinationDaysSnapshot: null,
        }),
      ),
    ).toEqual([
      { label: "Seeded", value: MISSING_VALUE },
      { label: "Expected assessment", value: MISSING_VALUE },
    ]);

    expect(
      presentActiveBatchDetailTiming(
        germinationDetail({
          currentStage: BatchStage.NURSERY,
          seededAt: null,
          movedToNurseryAt: null,
          expectedNurseryCompletionAt: null,
          actualGerminationDays: null,
        }),
      ),
    ).toEqual([
      { label: "Seeded", value: MISSING_VALUE },
      { label: "Moved to Nursery", value: MISSING_VALUE },
      { label: "Expected Nursery completion", value: MISSING_VALUE },
    ]);
  });
});

describe("germinationExtensionDays", () => {
  it("reads preset and custom days without inventing dates", () => {
    expect(germinationExtensionDays("PLUS_1", null)).toBe(1);
    expect(germinationExtensionDays("PLUS_2", null)).toBe(2);
    expect(germinationExtensionDays("PLUS_3", null)).toBe(3);
    expect(germinationExtensionDays("CUSTOM", "5")).toBe(5);
    expect(germinationExtensionDays("CUSTOM", "nope")).toBeNull();
    expect(germinationExtensionDays(null, "2")).toBeNull();
  });
});

describe("presentActiveBatchHistoryEvent", () => {
  const occurredAt = parseDateInput("2026-09-18");
  occurredAt.setUTCHours(10, 0, 0, 0);

  it("presents seeded quantity", () => {
    const presented = presentActiveBatchHistoryEvent({
      id: "seed-1",
      eventType: ProductionEventType.SEEDING_COMPLETED,
      occurredAt,
      userName: "Alex",
      actualQuantity: "35",
      quantityUom: "trays",
    });
    expect(presented).toEqual({
      id: "seed-1",
      label: "Seeded",
      timestampLabel: formatOperationalDateTime(occurredAt),
      userName: "Alex",
      detail: "35 trays seeded",
      secondary: null,
    });
  });

  it("presents destination change path and reason", () => {
    const presented = presentActiveBatchHistoryEvent({
      id: "dest-1",
      eventType: ProductionEventType.DESTINATION_CHANGED,
      occurredAt,
      userName: "Alex",
      fromDestination: "402",
      toDestination: "410",
      reasonCode: "change_in_production_plan",
      explanation: "Pool capacity",
    });
    expect(presented.label).toBe("Destination changed");
    expect(presented.detail).toBe("402 → 410");
    expect(presented.secondary).toBe(
      "change in production plan — Pool capacity",
    );
  });

  it("presents germination extension days from stored reason", () => {
    const presented = presentActiveBatchHistoryEvent({
      id: "ext-1",
      eventType: ProductionEventType.GERMINATION_EXTENDED,
      occurredAt,
      userName: "Alex",
      reasonCode: "PLUS_2",
      explanation: null,
    });
    expect(presented.label).toBe("Germination extended");
    expect(presented.detail).toBe("+2 days");
    expect(presented.secondary).toBe("PLUS_2");
  });

  it("presents the nursery stage transition, not a destination change", () => {
    const presented = presentActiveBatchHistoryEvent({
      id: "move-1",
      eventType: ProductionEventType.MOVED_TO_NURSERY,
      occurredAt,
      userName: "Alex",
      stageBefore: BatchStage.GERMINATION,
      stageAfter: BatchStage.NURSERY,
    } satisfies ActiveBatchDetailEvent);
    expect(presented.label).toBe("Moved to Nursery");
    expect(presented.detail).toBe("GERMINATION → NURSERY");
    expect(presented.secondary).toBeNull();
  });
});
