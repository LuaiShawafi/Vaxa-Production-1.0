import { describe, expect, it } from "vitest";
import { ProductionFormat } from "@prisma/client";
import { formatOperationalDayLabel, parseDateInput } from "@/lib/date";
import type { ActiveBatchListItem } from "@/lib/domain/batches/activeBatchesReadModel";
import {
  formatActiveBatchQuantity,
  formatActiveBatchesCountSummary,
  MISSING_VALUE,
  presentActiveBatchesOverview,
  presentActiveBatchOverviewRow,
  presentGerminationTiming,
  presentNurseryTiming,
  relativeOperationalLabel,
} from "@/lib/batches/activeBatchOverviewPresentation";

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

function nurseryItem(
  overrides: Partial<ActiveBatchListItem> = {},
): ActiveBatchListItem {
  return germinationItem({
    id: "n1",
    currentStage: "NURSERY",
    movedToNurseryAt: parseDateInput("2026-09-18"),
    expectedNurseryCompletionAt: parseDateInput("2026-09-29"),
    ...overrides,
  });
}

describe("formatActiveBatchQuantity", () => {
  it("shows actual seeded quantity with unit of measure", () => {
    expect(formatActiveBatchQuantity("20", "trays")).toBe("20 trays");
  });

  it("does not convert trays into production units", () => {
    expect(formatActiveBatchQuantity("35", "trays")).toBe("35 trays");
  });

  it("returns an em dash when quantity is missing", () => {
    expect(formatActiveBatchQuantity(null, "trays")).toBe(MISSING_VALUE);
    expect(formatActiveBatchQuantity("  ", "trays")).toBe(MISSING_VALUE);
  });

  it("omits a blank unit of measure", () => {
    expect(formatActiveBatchQuantity("8", null)).toBe("8");
    expect(formatActiveBatchQuantity("8", "  ")).toBe("8");
  });
});

describe("relativeOperationalLabel", () => {
  it("labels today, tomorrow, future, and past without severity", () => {
    expect(
      relativeOperationalLabel(parseDateInput("2026-09-21"), "Assessment", asOf),
    ).toBe("Assessment today");
    expect(
      relativeOperationalLabel(parseDateInput("2026-09-22"), "Assessment", asOf),
    ).toBe("Assessment tomorrow");
    expect(
      relativeOperationalLabel(parseDateInput("2026-09-24"), "Assessment", asOf),
    ).toBe("Assessment in 3 days");
    expect(
      relativeOperationalLabel(parseDateInput("2026-09-20"), "Assessment", asOf),
    ).toBe("Assessment was 1 day ago");
    expect(
      relativeOperationalLabel(parseDateInput("2026-09-18"), "Assessment", asOf),
    ).toBe("Assessment was 3 days ago");
  });
});

describe("presentGerminationTiming", () => {
  it("pairs the calendar date with an assessment-relative label", () => {
    const expected = parseDateInput("2026-09-21");
    const timing = presentGerminationTiming(expected, asOf);

    expect(timing.dateLabel).toBe(formatOperationalDayLabel(expected));
    expect(timing.relativeLabel).toBe("Assessment today");
    expect(timing.secondaryLabel).toBeNull();
    expect(timing.accessibleLabel).toContain("Assessment today");
  });

  it("does not invent overdue copy when the date is in the past", () => {
    const expected = parseDateInput("2026-09-19");
    const timing = presentGerminationTiming(expected, asOf);

    expect(timing.dateLabel).toBe(formatOperationalDayLabel(expected));
    expect(timing.relativeLabel).toBe("Assessment was 2 days ago");
    expect(timing.accessibleLabel).toContain("Assessment was 2 days ago");
  });

  it("returns an em dash when assessment date is missing", () => {
    expect(presentGerminationTiming(null, asOf)).toEqual({
      dateLabel: MISSING_VALUE,
      relativeLabel: null,
      secondaryLabel: null,
      accessibleLabel: "Assessment date not available",
    });
  });
});

describe("presentNurseryTiming", () => {
  it("shows moved date and expected completion with a relative label", () => {
    const moved = parseDateInput("2026-09-18");
    const expected = parseDateInput("2026-09-22");
    const timing = presentNurseryTiming(moved, expected, asOf);

    expect(timing.dateLabel).toBe(formatOperationalDayLabel(expected));
    expect(timing.relativeLabel).toBe("Expected tomorrow");
    expect(timing.secondaryLabel).toBe(
      `Moved ${formatOperationalDayLabel(moved)}`,
    );
    expect(timing.accessibleLabel).toContain("Expected tomorrow");
  });

  it("falls back to the moved date when expected completion is missing", () => {
    const moved = parseDateInput("2026-09-18");
    const timing = presentNurseryTiming(moved, null, asOf);

    expect(timing.dateLabel).toBe(`Moved ${formatOperationalDayLabel(moved)}`);
    expect(timing.relativeLabel).toBeNull();
    expect(timing.secondaryLabel).toBeNull();
    expect(timing.accessibleLabel).toContain("Expected nursery completion not available");
  });

  it("returns an em dash when nursery timing is missing", () => {
    expect(presentNurseryTiming(null, null, asOf)).toEqual({
      dateLabel: MISSING_VALUE,
      relativeLabel: null,
      secondaryLabel: null,
      accessibleLabel: "Nursery timing not available",
    });
  });
});

describe("presentActiveBatchOverviewRow", () => {
  it("maps germination identity, trays, destination, and timing", () => {
    const row = presentActiveBatchOverviewRow(germinationItem(), asOf);

    expect(row).toEqual({
      id: "g1",
      href: "/batches/active/g1",
      skuCode: "PU_RED_RADISH",
      skuDescription: "Red radish",
      visibleBatchNumber: "2109402",
      productionFormatLabel: "PU",
      quantityLabel: "20 trays",
      destination: "402",
      timing: presentGerminationTiming(parseDateInput("2026-09-21"), asOf),
    });
    expect(row).not.toHaveProperty("originalAssignedDestination");
  });

  it("maps nursery timing from move and expected completion", () => {
    const item = nurseryItem();
    const row = presentActiveBatchOverviewRow(item, asOf);

    expect(row.productionFormatLabel).toBe("PU");
    expect(row.timing).toEqual(
      presentNurseryTiming(
        item.movedToNurseryAt,
        item.expectedNurseryCompletionAt,
        asOf,
      ),
    );
  });
});

describe("presentActiveBatchesOverview", () => {
  it("groups presented rows and builds a scan summary", () => {
    const presented = presentActiveBatchesOverview(
      {
        germination: [germinationItem()],
        nursery: [nurseryItem(), nurseryItem({ id: "n2" })],
      },
      asOf,
    );

    expect(presented.germination).toHaveLength(1);
    expect(presented.nursery).toHaveLength(2);
    expect(presented.summary).toBe("1 in germination · 2 in nursery");
    expect(formatActiveBatchesCountSummary(0, 0)).toBe(
      "0 in germination · 0 in nursery",
    );
  });
});
