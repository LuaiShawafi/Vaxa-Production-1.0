import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  BatchStage,
  ProductionEventType,
  ProductionFormat,
} from "@prisma/client";
import { ActiveBatchDetailView } from "@/components/batches/ActiveBatchDetailView";
import { parseDateInput } from "@/lib/date";
import type { ActiveBatchDetail } from "@/lib/domain/batches/activeBatchDetailReadModel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => undefined,
}));

const users = [{ id: "u1", name: "Alex" }];

function germinationBatch(
  overrides: Partial<ActiveBatchDetail> = {},
): ActiveBatchDetail {
  const seededAt = parseDateInput("2026-09-17");
  seededAt.setUTCHours(8, 0, 0, 0);

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
    seededAt,
    expectedGerminationAt: parseDateInput("2026-09-21"),
    germinationDaysSnapshot: 4,
    movedToNurseryAt: null,
    nurseryDaysSnapshot: 11,
    expectedNurseryCompletionAt: null,
    actualGerminationDays: null,
    productionHistory: [
      {
        id: "seed-1",
        eventType: ProductionEventType.SEEDING_COMPLETED,
        occurredAt: seededAt,
        userName: "Alex",
        actualQuantity: "20",
        quantityUom: "trays",
      },
    ],
    ...overrides,
  };
}

function nurseryBatch(): ActiveBatchDetail {
  const seededAt = parseDateInput("2026-09-17");
  seededAt.setUTCHours(8, 0, 0, 0);
  const extendedAt = parseDateInput("2026-09-18");
  extendedAt.setUTCHours(9, 0, 0, 0);
  const destinationAt = parseDateInput("2026-09-18");
  destinationAt.setUTCHours(10, 0, 0, 0);
  const movedAt = parseDateInput("2026-09-18");
  movedAt.setUTCHours(11, 0, 0, 0);

  return germinationBatch({
    id: "n1",
    visibleBatchNumber: "1809402",
    currentStage: BatchStage.NURSERY,
    currentDestination: "410",
    movedToNurseryAt: movedAt,
    expectedNurseryCompletionAt: parseDateInput("2026-09-29"),
    actualGerminationDays: 1,
    productionHistory: [
      {
        id: "seed-1",
        eventType: ProductionEventType.SEEDING_COMPLETED,
        occurredAt: seededAt,
        userName: "Alex",
        actualQuantity: "20",
        quantityUom: "trays",
      },
      {
        id: "ext-1",
        eventType: ProductionEventType.GERMINATION_EXTENDED,
        occurredAt: extendedAt,
        userName: "Alex",
        reasonCode: "PLUS_1",
        explanation: null,
      },
      {
        id: "dest-1",
        eventType: ProductionEventType.DESTINATION_CHANGED,
        occurredAt: destinationAt,
        userName: "Alex",
        fromDestination: "402",
        toDestination: "410",
        reasonCode: "change_in_production_plan",
        explanation: "Pool capacity",
      },
      {
        id: "move-1",
        eventType: ProductionEventType.MOVED_TO_NURSERY,
        occurredAt: movedAt,
        userName: "Alex",
        stageBefore: BatchStage.GERMINATION,
        stageAfter: BatchStage.NURSERY,
      },
    ],
  });
}

function renderView(batch: ActiveBatchDetail) {
  return renderToStaticMarkup(
    createElement(ActiveBatchDetailView, { batch, users }),
  );
}

describe("active batch detail markup", () => {
  it("renders germination identity, assessment timing, and seeded history", () => {
    const html = renderView(germinationBatch());

    expect(html).toContain("Batches");
    expect(html).toContain("2109402");
    expect(html).toContain("PU_RED_RADISH");
    expect(html).toContain("Current stage");
    expect(html).toContain("Germination");
    expect(html).toContain("Expected assessment");
    expect(html).toContain("Destination");
    expect(html).toContain("Change destination");
    expect(html).toContain("Production history");
    expect(html).toContain("Seeded");
    expect(html).toContain('href="/batches/active"');
    expect(html).toContain("← Batches");
    expect(html).toMatch(/wrap-break-word|min-w-0/);
    expect(html).not.toContain("Current location");
    expect(html).not.toContain("Expected Nursery completion");
    expect(html).not.toContain("Moved to Nursery");
    expect(html).not.toContain("Move to Nursery");
    expect(html).not.toContain("Extend Germination");
  });

  it("renders nursery timing and production history without germination assessment", () => {
    const html = renderView(nurseryBatch());

    expect(html).toContain("Nursery");
    expect(html).toContain("Moved to Nursery");
    expect(html).toContain("Expected Nursery completion");
    expect(html).toContain("Destination changed");
    expect(html).toContain("Germination extended");
    expect(html).toContain("Production history");
    expect(html).toContain("Change destination");
    expect(html).toContain("Destination");
    expect(html).toMatch(/wrap-break-word|min-w-0/);
    expect(html).not.toContain("Expected assessment");
    expect(html).not.toContain("Current location");
    expect(html).not.toContain("Move to Nursery");
    expect(html).not.toContain("Extend Germination");
  });
});
