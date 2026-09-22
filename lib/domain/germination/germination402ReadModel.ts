import {
  formatOperationalDayLabel,
  operationalCalendarDaysBetween,
  operationalTodayString,
  parseDateInput,
} from "@/lib/date";
import type { ActiveBatchListItem } from "@/lib/domain/batches/activeBatchesReadModel";
import {
  formatActiveBatchQuantity,
  MISSING_VALUE,
} from "@/lib/batches/activeBatchOverviewPresentation";

export type Germination402StatusTone = "amber" | "red" | "blue";

export type Germination402WorkerRow = {
  batchId: string;
  visibleBatchNumber: string;
  skuCode: string;
  skuDescription: string | null;
  productionFormatLabel: string;
  quantityLabel: string;
  destination: string;
  seededAtLabel: string | null;
  germinationDaysSnapshot: number | null;
  expectedAssessmentDateLabel: string;
  statusLabel: string;
  statusTone: Germination402StatusTone;
  statusAccessibleLabel: string;
};

export type Germination402WorkerLists = {
  dueTodayAndOverdue: Germination402WorkerRow[];
  future: Germination402WorkerRow[];
};

/** Operational as-of calendar date (Stockholm YYYY-MM-DD as UTC midnight). */
export function germination402AsOfCalendarDate(_instant = new Date()): Date {
  return parseDateInput(operationalTodayString());
}

export function isGerminationAssessmentDueOrOverdue(
  expectedGerminationAt: Date | null,
  asOfCalendarDate: Date,
): boolean {
  if (!expectedGerminationAt) {
    return false;
  }
  const daysUntil = operationalCalendarDaysBetween(
    asOfCalendarDate,
    expectedGerminationAt,
  );
  return daysUntil <= 0;
}

export function presentGermination402WorkerStatus(
  expectedGerminationAt: Date | null,
  asOfCalendarDate: Date,
): {
  label: string;
  tone: Germination402StatusTone;
  accessibleLabel: string;
} {
  if (!expectedGerminationAt) {
    return {
      label: "Assessment date missing",
      tone: "blue",
      accessibleLabel: "Expected assessment date is not available",
    };
  }

  const daysUntil = operationalCalendarDaysBetween(
    asOfCalendarDate,
    expectedGerminationAt,
  );

  if (daysUntil === 0) {
    return {
      label: "Due today",
      tone: "amber",
      accessibleLabel: "Assessment due today",
    };
  }

  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil);
    const label =
      overdueDays === 1
        ? "Overdue by 1 day"
        : `Overdue by ${overdueDays} days`;
    return {
      label,
      tone: "red",
      accessibleLabel: label,
    };
  }

  const label =
    daysUntil === 1
      ? "Assessment in 1 day"
      : `Assessment in ${daysUntil} days`;
  return {
    label,
    tone: "blue",
    accessibleLabel: label,
  };
}

export function compareGermination402DueOrder(
  a: ActiveBatchListItem,
  b: ActiveBatchListItem,
  asOfCalendarDate: Date,
): number {
  const daysA = a.expectedGerminationAt
    ? operationalCalendarDaysBetween(asOfCalendarDate, a.expectedGerminationAt)
    : Number.MAX_SAFE_INTEGER;
  const daysB = b.expectedGerminationAt
    ? operationalCalendarDaysBetween(asOfCalendarDate, b.expectedGerminationAt)
    : Number.MAX_SAFE_INTEGER;

  if (daysA !== daysB) {
    return daysA - daysB;
  }

  return a.visibleBatchNumber.localeCompare(b.visibleBatchNumber);
}

export function presentGermination402WorkerRow(
  item: ActiveBatchListItem,
  asOfCalendarDate: Date,
  formatSeededAt: (seededAt: Date | null) => string | null,
): Germination402WorkerRow {
  const status = presentGermination402WorkerStatus(
    item.expectedGerminationAt,
    asOfCalendarDate,
  );

  return {
    batchId: item.id,
    visibleBatchNumber: item.visibleBatchNumber,
    skuCode: item.skuCode,
    skuDescription: item.skuDescription,
    productionFormatLabel: item.productionFormat,
    quantityLabel: formatActiveBatchQuantity(
      item.actualSeededQuantity,
      item.quantityUom,
    ),
    destination: item.currentDestination,
    seededAtLabel: formatSeededAt(item.seededAt),
    germinationDaysSnapshot: item.germinationDaysSnapshot,
    expectedAssessmentDateLabel: item.expectedGerminationAt
      ? formatOperationalDayLabel(item.expectedGerminationAt)
      : MISSING_VALUE,
    statusLabel: status.label,
    statusTone: status.tone,
    statusAccessibleLabel: status.accessibleLabel,
  };
}

export function partitionGermination402WorkerLists(
  items: ActiveBatchListItem[],
  asOfCalendarDate: Date,
  formatSeededAt: (seededAt: Date | null) => string | null,
): Germination402WorkerLists {
  const germinationOnly = items.filter(
    (item) => item.currentStage === "GERMINATION",
  );

  germinationOnly.sort((a, b) =>
    compareGermination402DueOrder(a, b, asOfCalendarDate),
  );

  const dueTodayAndOverdue: Germination402WorkerRow[] = [];
  const future: Germination402WorkerRow[] = [];

  for (const item of germinationOnly) {
    const row = presentGermination402WorkerRow(
      item,
      asOfCalendarDate,
      formatSeededAt,
    );
    if (
      isGerminationAssessmentDueOrOverdue(
        item.expectedGerminationAt,
        asOfCalendarDate,
      )
    ) {
      dueTodayAndOverdue.push(row);
    } else {
      future.push(row);
    }
  }

  return { dueTodayAndOverdue, future };
}
