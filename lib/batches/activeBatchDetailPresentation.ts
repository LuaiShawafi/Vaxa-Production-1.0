import { BatchStage, ProductionEventType } from "@prisma/client";
import {
  formatOperationalDateTime,
  formatOperationalDayLabel,
} from "@/lib/date";
import type {
  ActiveBatchDetail,
  ActiveBatchDetailEvent,
} from "@/lib/domain/batches/activeBatchDetailReadModel";
import {
  formatActiveBatchQuantity,
  MISSING_VALUE,
} from "@/lib/batches/activeBatchOverviewPresentation";

export function presentActiveBatchStageLabel(stage: string): string {
  if (stage === BatchStage.GERMINATION) {
    return "Germination";
  }
  if (stage === BatchStage.NURSERY) {
    return "Nursery";
  }
  return stage;
}

export function presentDurationDays(days: number | null): string {
  if (days == null) {
    return MISSING_VALUE;
  }
  return days === 1 ? "1 day" : `${days} days`;
}

export function germinationExtensionDays(
  reasonCode: string | null,
  explanation: string | null,
): number | null {
  if (reasonCode === "PLUS_1") {
    return 1;
  }
  if (reasonCode === "PLUS_2") {
    return 2;
  }
  if (reasonCode === "PLUS_3") {
    return 3;
  }
  if (reasonCode === "CUSTOM") {
    const parsed = Number(explanation);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function formatSignedDays(days: number): string {
  return days === 1 ? "+1 day" : `+${days} days`;
}

function formatReasonCode(reasonCode: string | null): string | null {
  if (!reasonCode || reasonCode.trim() === "") {
    return null;
  }
  return reasonCode.replaceAll("_", " ");
}

function formatInstant(instant: Date | null): string {
  return instant ? formatOperationalDateTime(instant) : MISSING_VALUE;
}

function formatDay(date: Date | null): string {
  return date ? formatOperationalDayLabel(date) : MISSING_VALUE;
}

export type ActiveBatchDetailIdentityRow = {
  label: string;
  value: string;
};

export function presentActiveBatchDetailIdentity(
  batch: ActiveBatchDetail,
): ActiveBatchDetailIdentityRow[] {
  return [
    { label: "SKU", value: batch.skuCode },
    {
      label: "Description",
      value: batch.skuDescription?.trim() || MISSING_VALUE,
    },
    { label: "Production format", value: batch.productionFormat },
    {
      label: "Current stage",
      value: presentActiveBatchStageLabel(batch.currentStage),
    },
    {
      label: "Quantity",
      value: formatActiveBatchQuantity(
        batch.actualSeededQuantity,
        batch.quantityUom,
      ),
    },
    { label: "Destination", value: batch.currentDestination },
    {
      label: "Original destination",
      value: batch.originalAssignedDestination,
    },
  ];
}

export type ActiveBatchDetailTimingRow = {
  label: string;
  value: string;
};

export function presentActiveBatchDetailTiming(
  batch: ActiveBatchDetail,
): ActiveBatchDetailTimingRow[] {
  if (batch.currentStage === BatchStage.NURSERY) {
    const rows: ActiveBatchDetailTimingRow[] = [
      { label: "Seeded", value: formatInstant(batch.seededAt) },
      {
        label: "Moved to Nursery",
        value: formatInstant(batch.movedToNurseryAt),
      },
      {
        label: "Expected Nursery completion",
        value: formatDay(batch.expectedNurseryCompletionAt),
      },
    ];
    if (batch.actualGerminationDays != null) {
      rows.push({
        label: "Actual germination",
        value: presentDurationDays(batch.actualGerminationDays),
      });
    }
    return rows;
  }

  const rows: ActiveBatchDetailTimingRow[] = [
    { label: "Seeded", value: formatInstant(batch.seededAt) },
    {
      label: "Expected assessment",
      value: formatDay(batch.expectedGerminationAt),
    },
  ];
  if (batch.germinationDaysSnapshot != null) {
    rows.push({
      label: "Germination duration",
      value: presentDurationDays(batch.germinationDaysSnapshot),
    });
  }
  return rows;
}

export type ActiveBatchHistoryPresentation = {
  id: string;
  label: string;
  timestampLabel: string;
  userName: string | null;
  detail: string | null;
  secondary: string | null;
};

export function presentActiveBatchHistoryEvent(
  event: ActiveBatchDetailEvent,
): ActiveBatchHistoryPresentation {
  const timestampLabel = formatOperationalDateTime(event.occurredAt);

  switch (event.eventType) {
    case ProductionEventType.SEEDING_COMPLETED: {
      const quantity = formatActiveBatchQuantity(
        event.actualQuantity,
        event.quantityUom,
      );
      return {
        id: event.id,
        label: "Seeded",
        timestampLabel,
        userName: event.userName,
        detail:
          quantity === MISSING_VALUE ? null : `${quantity} seeded`,
        secondary: null,
      };
    }
    case ProductionEventType.DESTINATION_CHANGED: {
      const hasPath = event.fromDestination && event.toDestination;
      const reason = formatReasonCode(event.reasonCode);
      const explanation = event.explanation?.trim() || null;
      return {
        id: event.id,
        label: "Destination changed",
        timestampLabel,
        userName: event.userName,
        detail: hasPath
          ? `${event.fromDestination} → ${event.toDestination}`
          : null,
        secondary: [reason, explanation].filter(Boolean).join(" — ") || null,
      };
    }
    case ProductionEventType.GERMINATION_EXTENDED: {
      const days = germinationExtensionDays(event.reasonCode, event.explanation);
      return {
        id: event.id,
        label: "Germination extended",
        timestampLabel,
        userName: event.userName,
        detail: days != null ? formatSignedDays(days) : null,
        secondary: event.reasonCode,
      };
    }
    case ProductionEventType.MOVED_TO_NURSERY: {
      const from = event.stageBefore;
      const to = event.stageAfter;
      return {
        id: event.id,
        label: "Moved to Nursery",
        timestampLabel,
        userName: event.userName,
        detail: from && to ? `${from} → ${to}` : null,
        secondary: null,
      };
    }
  }
}

export function presentActiveBatchHistory(
  events: ActiveBatchDetailEvent[],
): ActiveBatchHistoryPresentation[] {
  return events.map(presentActiveBatchHistoryEvent);
}
