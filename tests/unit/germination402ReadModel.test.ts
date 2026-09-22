import { describe, expect, it } from "vitest";
import { ProductionFormat } from "@prisma/client";
import { parseDateInput, formatOperationalDayLabel } from "@/lib/date";
import type { ActiveBatchListItem } from "@/lib/domain/batches/activeBatchesReadModel";
import {
  compareGermination402DueOrder,
  isGerminationAssessmentDueOrOverdue,
  partitionGermination402WorkerLists,
  presentGermination402WorkerRow,
  presentGermination402WorkerStatus,
} from "@/lib/domain/germination/germination402ReadModel";

const asOf = parseDateInput("2026-09-21");

function germinationItem(
  overrides: Partial<ActiveBatchListItem> = {},
): ActiveBatchListItem {
  return {
    id: "g1",
    visibleBatchNumber: "2109402",
    skuCode: "PU_RED_RADISH",
    skuDescription: "Red radish",
    productionFormat: ProductionFormat.PU,
    currentStage: "GERMINATION",
    currentDestination: "402",
    originalAssignedDestination: "410",
    actualSeededQuantity: "20",
    quantityUom: "trays",
    seededAt: parseDateInput("2026-09-17"),
    expectedGerminationAt: parseDateInput("2026-09-21"),
    germinationDaysSnapshot: 4,
    nurseryDaysSnapshot: 11,
    movedToNurseryAt: null,
    expectedNurseryCompletionAt: null,
    ...overrides,
  };
}

describe("isGerminationAssessmentDueOrOverdue", () => {
  it("includes due today and overdue batches", () => {
    expect(
      isGerminationAssessmentDueOrOverdue(
        parseDateInput("2026-09-21"),
        asOf,
      ),
    ).toBe(true);
    expect(
      isGerminationAssessmentDueOrOverdue(
        parseDateInput("2026-09-20"),
        asOf,
      ),
    ).toBe(true);
  });

  it("excludes future assessment dates", () => {
    expect(
      isGerminationAssessmentDueOrOverdue(
        parseDateInput("2026-09-22"),
        asOf,
      ),
    ).toBe(false);
  });

  it("excludes batches without an expected date", () => {
    expect(isGerminationAssessmentDueOrOverdue(null, asOf)).toBe(false);
  });
});

describe("presentGermination402WorkerStatus", () => {
  it("labels due today and overdue for workers", () => {
    expect(
      presentGermination402WorkerStatus(
        parseDateInput("2026-09-21"),
        asOf,
      ).label,
    ).toBe("Due today");
    expect(
      presentGermination402WorkerStatus(
        parseDateInput("2026-09-20"),
        asOf,
      ).label,
    ).toBe("Overdue by 1 day");
    expect(
      presentGermination402WorkerStatus(
        parseDateInput("2026-09-19"),
        asOf,
      ).label,
    ).toBe("Overdue by 2 days");
  });

  it("labels future assessments", () => {
    expect(
      presentGermination402WorkerStatus(
        parseDateInput("2026-09-24"),
        asOf,
      ).label,
    ).toBe("Assessment in 3 days");
  });
});

describe("partitionGermination402WorkerLists", () => {
  const formatSeeded = () => "17 Sep";

  it("partitions due/overdue from future and keeps GERMINATION-only rows", () => {
    const nurseryWrongStage = germinationItem({
      id: "n1",
      currentStage: "NURSERY",
    });
    const due = germinationItem({ id: "d1" });
    const overdue = germinationItem({
      id: "o1",
      expectedGerminationAt: parseDateInput("2026-09-19"),
    });
    const future = germinationItem({
      id: "f1",
      expectedGerminationAt: parseDateInput("2026-09-25"),
    });

    const lists = partitionGermination402WorkerLists(
      [due, overdue, future, nurseryWrongStage],
      asOf,
      formatSeeded,
    );

    expect(lists.dueTodayAndOverdue.map((r) => r.batchId)).toEqual([
      "o1",
      "d1",
    ]);
    expect(lists.future.map((r) => r.batchId)).toEqual(["f1"]);
  });

  it("maps batch identity, quantity, destination, and timing", () => {
    const row = presentGermination402WorkerRow(
      germinationItem(),
      asOf,
      formatSeeded,
    );

    expect(row.visibleBatchNumber).toBe("2109402");
    expect(row.skuCode).toBe("PU_RED_RADISH");
    expect(row.productionFormatLabel).toBe("PU");
    expect(row.quantityLabel).toBe("20 trays");
    expect(row.destination).toBe("402");
    expect(row.statusLabel).toBe("Due today");
    expect(row.expectedAssessmentDateLabel).toBe(
      formatOperationalDayLabel(parseDateInput("2026-09-21")),
    );
  });
});

describe("compareGermination402DueOrder", () => {
  it("sorts most overdue first, then due today, then by batch number", () => {
    const overdue = germinationItem({
      visibleBatchNumber: "2009402",
      expectedGerminationAt: parseDateInput("2026-09-18"),
    });
    const due = germinationItem({
      visibleBatchNumber: "2109402",
      expectedGerminationAt: parseDateInput("2026-09-21"),
    });
    const future = germinationItem({
      visibleBatchNumber: "1909402",
      expectedGerminationAt: parseDateInput("2026-09-25"),
    });

    const sorted = [due, future, overdue].sort((a, b) =>
      compareGermination402DueOrder(a, b, asOf),
    );

    expect(sorted.map((b) => b.visibleBatchNumber)).toEqual([
      "2009402",
      "2109402",
      "1909402",
    ]);
  });
});
