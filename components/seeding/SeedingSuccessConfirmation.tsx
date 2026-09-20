"use client";

import { SuccessOverlay } from "@/components/ui/SuccessOverlay";

export const SEEDING_SUCCESS_RETURN_MS = 1400;

export type SeedingSuccessVariant = "started" | "completed";

type SeedingSuccessConfirmationProps = {
  show: boolean;
  variant: SeedingSuccessVariant;
  visibleBatchNumber: string;
  skuCode: string;
  trayQuantity: number;
  destination?: string;
  onDone: () => void;
};

const TITLES: Record<SeedingSuccessVariant, string> = {
  started: "Seeding started",
  completed: "Seeding completed",
};

export function SeedingSuccessConfirmation({
  show,
  variant,
  visibleBatchNumber,
  skuCode,
  trayQuantity,
  destination,
  onDone,
}: SeedingSuccessConfirmationProps) {
  const trayLabel =
    variant === "started" ? "Planned trays" : "Actual trays";

  return (
    <SuccessOverlay
      show={show}
      title={TITLES[variant]}
      returnAfterMs={SEEDING_SUCCESS_RETURN_MS}
      footer="Returning to Today…"
      onDone={onDone}
    >
      <p className="text-body-small text-muted">
        {variant === "started"
          ? "The task is in progress. You can complete seeding from Seed Today when the work is done."
          : "Recorded on the server. Batch moved to Germination."}
      </p>
      <dl className="mt-4 space-y-2.5 text-left text-body-small">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Batch</dt>
          <dd className="font-semibold text-text tabular-nums">
            {visibleBatchNumber}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">SKU</dt>
          <dd className="font-semibold text-text">{skuCode}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">{trayLabel}</dt>
          <dd className="font-semibold text-text tabular-nums">
            {trayQuantity} trays
          </dd>
        </div>
        {destination ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Destination</dt>
            <dd className="font-semibold text-text">Room {destination}</dd>
          </div>
        ) : null}
      </dl>
    </SuccessOverlay>
  );
}
