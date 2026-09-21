import {
  formatOperationalDayLabel,
  operationalCalendarDaysBetween,
} from "@/lib/date";
import type {
  ActiveBatchListItem,
  ActiveBatchesReadModel,
} from "@/lib/domain/batches/activeBatchesReadModel";

export const MISSING_VALUE = "—";

export const activeBatchSectionCopy = {
  germination: {
    title: "Germination / 402",
    lead: "Batches currently in germination, handled by Team 402.",
    empty: "No batches currently in germination.",
  },
  nursery: {
    title: "Nursery / 402",
    lead: "Batches moved to nursery by Team 402 after germination.",
    empty: "No batches currently in nursery.",
  },
} as const;

export type ActiveBatchTimingPresentation = {
  dateLabel: string;
  relativeLabel: string | null;
  secondaryLabel: string | null;
  accessibleLabel: string;
};

export type ActiveBatchOverviewRow = {
  id: string;
  href: string;
  skuCode: string;
  skuDescription: string | null;
  visibleBatchNumber: string;
  productionFormatLabel: string;
  quantityLabel: string;
  destination: string;
  timing: ActiveBatchTimingPresentation;
};

export type ActiveBatchesOverviewPresentation = {
  germination: ActiveBatchOverviewRow[];
  nursery: ActiveBatchOverviewRow[];
  summary: string;
};

export function activeBatchDetailHref(batchId: string): string {
  return `/batches/active/${batchId}`;
}

export function activeBatchDetailLinkLabel(
  visibleBatchNumber: string,
  skuCode: string,
): string {
  return `Open batch ${visibleBatchNumber} ${skuCode}`;
}

export function formatActiveBatchQuantity(
  actualSeededQuantity: string | null,
  quantityUom: string | null,
): string {
  if (actualSeededQuantity == null || actualSeededQuantity.trim() === "") {
    return MISSING_VALUE;
  }

  const unit = quantityUom?.trim();
  return unit ? `${actualSeededQuantity} ${unit}` : actualSeededQuantity;
}

export function formatActiveBatchesCountSummary(
  germinationCount: number,
  nurseryCount: number,
): string {
  return `${germinationCount} in germination · ${nurseryCount} in nursery`;
}

export function relativeOperationalLabel(
  target: Date,
  noun: string,
  asOf: Date,
): string {
  const days = operationalCalendarDaysBetween(asOf, target);
  if (days === 0) {
    return `${noun} today`;
  }
  if (days === 1) {
    return `${noun} tomorrow`;
  }
  if (days > 1) {
    return `${noun} in ${days} days`;
  }

  const ago = Math.abs(days);
  return `${noun} was ${ago} ${ago === 1 ? "day" : "days"} ago`;
}

export function presentGerminationTiming(
  expectedGerminationAt: Date | null,
  asOf: Date,
): ActiveBatchTimingPresentation {
  if (!expectedGerminationAt) {
    return {
      dateLabel: MISSING_VALUE,
      relativeLabel: null,
      secondaryLabel: null,
      accessibleLabel: "Assessment date not available",
    };
  }

  const dateLabel = formatOperationalDayLabel(expectedGerminationAt);
  const relativeLabel = relativeOperationalLabel(
    expectedGerminationAt,
    "Assessment",
    asOf,
  );

  return {
    dateLabel,
    relativeLabel,
    secondaryLabel: null,
    accessibleLabel: `Assessment ${dateLabel}. ${relativeLabel}.`,
  };
}

export function presentNurseryTiming(
  movedToNurseryAt: Date | null,
  expectedNurseryCompletionAt: Date | null,
  asOf: Date,
): ActiveBatchTimingPresentation {
  const movedLabel = movedToNurseryAt
    ? `Moved ${formatOperationalDayLabel(movedToNurseryAt)}`
    : null;

  if (!expectedNurseryCompletionAt) {
    if (movedLabel) {
      return {
        dateLabel: movedLabel,
        relativeLabel: null,
        secondaryLabel: null,
        accessibleLabel: `${movedLabel}. Expected nursery completion not available.`,
      };
    }

    return {
      dateLabel: MISSING_VALUE,
      relativeLabel: null,
      secondaryLabel: null,
      accessibleLabel: "Nursery timing not available",
    };
  }

  const dateLabel = formatOperationalDayLabel(expectedNurseryCompletionAt);
  const relativeLabel = relativeOperationalLabel(
    expectedNurseryCompletionAt,
    "Expected",
    asOf,
  );

  return {
    dateLabel,
    relativeLabel,
    secondaryLabel: movedLabel,
    accessibleLabel: [movedLabel, `Expected ${dateLabel}`, relativeLabel]
      .filter(Boolean)
      .join(". ")
      .concat("."),
  };
}

export function presentActiveBatchOverviewRow(
  item: ActiveBatchListItem,
  asOf: Date,
): ActiveBatchOverviewRow {
  const timing =
    item.currentStage === "GERMINATION"
      ? presentGerminationTiming(item.expectedGerminationAt, asOf)
      : presentNurseryTiming(
          item.movedToNurseryAt,
          item.expectedNurseryCompletionAt,
          asOf,
        );

  return {
    id: item.id,
    href: activeBatchDetailHref(item.id),
    skuCode: item.skuCode,
    skuDescription: item.skuDescription,
    visibleBatchNumber: item.visibleBatchNumber,
    productionFormatLabel: item.productionFormat,
    quantityLabel: formatActiveBatchQuantity(
      item.actualSeededQuantity,
      item.quantityUom,
    ),
    destination: item.currentDestination,
    timing,
  };
}

export function presentActiveBatchesOverview(
  model: ActiveBatchesReadModel,
  asOf: Date,
): ActiveBatchesOverviewPresentation {
  return {
    germination: model.germination.map((item) =>
      presentActiveBatchOverviewRow(item, asOf),
    ),
    nursery: model.nursery.map((item) =>
      presentActiveBatchOverviewRow(item, asOf),
    ),
    summary: formatActiveBatchesCountSummary(
      model.germination.length,
      model.nursery.length,
    ),
  };
}
