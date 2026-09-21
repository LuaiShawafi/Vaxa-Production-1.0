import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActiveBatchSection } from "@/components/batches/ActiveBatchSection";
import {
  activeBatchDetailLinkLabel,
  activeBatchSectionCopy,
  type ActiveBatchOverviewRow,
} from "@/lib/batches/activeBatchOverviewPresentation";

const germinationRow: ActiveBatchOverviewRow = {
  id: "long-1",
  href: "/batches/active/long-1",
  skuCode: "PU_VERY_LONG_SKU_CODE_FOR_OVERFLOW_CHECK_RED_RADISH",
  skuDescription:
    "Very long SKU description that should wrap instead of forcing horizontal page scroll on a management overview row",
  visibleBatchNumber: "2109402-VERYLONGSUFFIX",
  productionFormatLabel: "PU",
  quantityLabel: "20 trays",
  destination: "402",
  timing: {
    dateLabel: "21 Sep",
    relativeLabel: "Assessment today",
    secondaryLabel: null,
    accessibleLabel: "Assessment 21 Sep. Assessment today.",
  },
};

const nurseryRow: ActiveBatchOverviewRow = {
  id: "n-1",
  href: "/batches/active/n-1",
  skuCode: "PU_CHIVE_LONG_DESCRIPTION_OVERFLOW_CHECK",
  skuDescription:
    "Nursery row with a long SKU description that must wrap on the stacked mobile card",
  visibleBatchNumber: "1809402-NURSERY",
  productionFormatLabel: "PU",
  quantityLabel: "16 trays",
  destination: "410",
  timing: {
    dateLabel: "29 Sep",
    relativeLabel: "Expected in 8 days",
    secondaryLabel: "Moved 18 Sep",
    accessibleLabel: "Moved 18 Sep. Expected 29 Sep. Expected in 8 days.",
  },
};

function renderSection(
  copy: (typeof activeBatchSectionCopy)[keyof typeof activeBatchSectionCopy],
  rows: ActiveBatchOverviewRow[],
) {
  return renderToStaticMarkup(
    createElement(ActiveBatchSection, {
      title: copy.title,
      lead: copy.lead,
      emptyMessage: copy.empty,
      rows,
    }),
  );
}

function expectAccessibleBatchLink(html: string, row: ActiveBatchOverviewRow) {
  const accessibleName = activeBatchDetailLinkLabel(
    row.visibleBatchNumber,
    row.skuCode,
  );
  expect(html).toContain(`href="${row.href}"`);
  expect(html).toContain(`aria-label="${accessibleName}"`);
  expect(html).toContain(`<a`);
}

describe("active batch overview markup", () => {
  it("renders compact empty states without tables or navigation", () => {
    const germination = renderSection(activeBatchSectionCopy.germination, []);
    const nursery = renderSection(activeBatchSectionCopy.nursery, []);

    expect(germination).toContain("<h2");
    expect(germination).toContain("Germination / 402");
    expect(germination).toContain("No batches currently in germination.");
    expect(germination).not.toContain("<table");
    expect(germination).not.toMatch(/<a[\s>]/);

    expect(nursery).toContain("<h2");
    expect(nursery).toContain("Nursery / 402");
    expect(nursery).toContain("No batches currently in nursery.");
    expect(nursery).not.toContain("<table");
    expect(nursery).not.toMatch(/<a[\s>]/);
  });

  it("renders a desktop table and stacked cards with accessible batch links", () => {
    const germination = renderSection(activeBatchSectionCopy.germination, [
      germinationRow,
    ]);
    const nursery = renderSection(activeBatchSectionCopy.nursery, [nurseryRow]);

    for (const [html, row] of [
      [germination, germinationRow],
      [nursery, nurseryRow],
    ] as const) {
      expect(html).toContain("<table");
      expect(html).toContain("table-fixed");
      expect(html).toContain("<caption");
      expect(html).toContain("<article");
      expect(html).toContain("min-[700px]:hidden");
      expect(html).toContain("min-[700px]:block");
      expect(html).toContain("wrap-break-word");
      expect(html).toContain(row.skuCode);
      expect(html).toContain(row.visibleBatchNumber);
      expect(html).toContain(row.productionFormatLabel);
      expect(html).toContain(row.quantityLabel);
      expect(html).toContain("Destination");
      expect(html).toContain("Timing");
      expectAccessibleBatchLink(html, row);
      expect(html).not.toContain("Current location");
      expect(html).not.toContain("Actions");
      expect(html).not.toContain("overflow-x-auto");
      expect(html).not.toContain("col-span-2");
    }

    expect(germination).toContain("Assessment today");
    expect(nursery).toContain("Moved 18 Sep");
  });
});
