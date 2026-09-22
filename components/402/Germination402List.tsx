"use client";

import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Germination402WorkerRow } from "@/lib/domain/germination/germination402ReadModel";

type Germination402ListProps = {
  dueRows: Germination402WorkerRow[];
  futureRows: Germination402WorkerRow[];
  showAll: boolean;
  hasFuture: boolean;
  onToggleShowAll: () => void;
  onOpenBatch: (row: Germination402WorkerRow) => void;
};

const LIST_GRID =
  "grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.65fr)_minmax(0,0.75fr)_minmax(0,0.9fr)]";

function statusPill(tone: Germination402WorkerRow["statusTone"], label: string) {
  return <Pill tone={tone}>{label}</Pill>;
}

export function Germination402List({
  dueRows,
  futureRows,
  showAll,
  hasFuture,
  onToggleShowAll,
  onOpenBatch,
}: Germination402ListProps) {
  const dueCount = dueRows.length;
  const futureCount = futureRows.length;
  const showFutureSection = showAll && futureCount > 0;

  return (
    <section aria-label="Germination" className="mt-8">
      <SectionHeader
        title="Germination → Nursery"
        lead="Batches due for assessment today or overdue. Tap a batch to extend or move to nursery."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill tone={dueCount > 0 ? "amber" : "green"}>
              {dueCount} need{dueCount === 1 ? "s" : ""} attention
            </Pill>
            {hasFuture ? (
              <Button
                type="button"
                variant="secondary"
                density="production"
                className="min-h-12 px-4 text-body-small font-bold"
                onClick={onToggleShowAll}
                aria-pressed={showAll}
              >
                {showAll ? "Show due only" : "View all"}
              </Button>
            ) : null}
          </div>
        }
      />

      {dueCount === 0 && !showFutureSection ? (
        <GerminationEmptyState hasFuture={hasFuture} showAll={showAll} />
      ) : (
        <Card className="overflow-hidden">
          {showFutureSection ? (
            <p className="border-b border-line bg-surface-2 px-3.5 py-2 text-body-small font-semibold text-muted">
              Due today & overdue
            </p>
          ) : null}
          {dueCount === 0 && showFutureSection ? (
            <p
              className="border-b border-line px-3.5 py-4 text-body-small text-muted"
              role="status"
            >
              Nothing needs attention today.
            </p>
          ) : (
            <GerminationRowTable
              rows={dueRows}
              onOpenBatch={onOpenBatch}
              sectionLabel="Due and overdue germination batches"
            />
          )}

          {showFutureSection ? (
            <>
              <p className="border-y border-line bg-surface-2 px-3.5 py-2 text-body-small font-semibold text-muted">
                Upcoming assessment
              </p>
              <GerminationRowTable
                rows={futureRows}
                onOpenBatch={onOpenBatch}
                sectionLabel="Future germination batches"
              />
            </>
          ) : null}
        </Card>
      )}
    </section>
  );
}

function GerminationEmptyState({
  hasFuture,
  showAll,
}: {
  hasFuture: boolean;
  showAll: boolean;
}) {
  return (
    <Card className="p-6 sm:p-8">
      <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
        Germination
      </p>
      <h3 className="mt-2 text-h2 font-extrabold tracking-[-0.02em]">
        Nothing needs attention today
      </h3>
      <p className="mt-2 max-w-xl text-body text-muted">
        No germination batches are due or overdue for assessment. When a batch
        reaches its expected assessment date, it will appear here.
      </p>
      {hasFuture && !showAll ? (
        <p className="mt-3 text-body-small text-muted">
          Future germination batches are available under{" "}
          <span className="font-semibold text-text">View all</span>.
        </p>
      ) : null}
    </Card>
  );
}

function GerminationRowTable({
  rows,
  onOpenBatch,
  sectionLabel,
}: {
  rows: Germination402WorkerRow[];
  onOpenBatch: (row: Germination402WorkerRow) => void;
  sectionLabel: string;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={[
          "hidden md:grid",
          LIST_GRID,
          "gap-x-2.5 px-3.5",
          "items-center bg-surface-2 py-2 text-[9px] font-extrabold tracking-[0.06em] text-muted uppercase",
        ].join(" ")}
        role="row"
      >
        <div>Batch</div>
        <div>SKU</div>
        <div>Format</div>
        <div>Qty</div>
        <div>Room</div>
        <div>Timing</div>
      </div>

      <ul className="divide-y divide-line" aria-label={sectionLabel}>
        {rows.map((row) => (
          <li key={row.batchId}>
            <GerminationRowButton row={row} onOpen={() => onOpenBatch(row)} />
          </li>
        ))}
      </ul>
    </>
  );
}

function GerminationRowButton({
  row,
  onOpen,
}: {
  row: Germination402WorkerRow;
  onOpen: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={[
          "flex w-full min-h-12 flex-col gap-1 px-3.5 py-3 text-left md:hidden",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-green",
          "hover:bg-surface-2 active:bg-surface-2",
        ].join(" ")}
        aria-label={`Open batch ${row.visibleBatchNumber}, ${row.skuCode}, ${row.statusAccessibleLabel}`}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block text-[11px] font-bold leading-snug">
              {row.visibleBatchNumber}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-bold">
              {row.skuCode}
            </span>
            <span className="mt-0.5 block text-[9px] text-muted">
              {row.productionFormatLabel} · {row.quantityLabel} · Room{" "}
              {row.destination}
            </span>
          </span>
          {statusPill(row.statusTone, row.statusLabel)}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        className={[
          "hidden w-full md:grid",
          LIST_GRID,
          "gap-x-2.5 px-3.5 py-3",
          "items-center text-left",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-green",
          "hover:bg-surface-2 active:bg-surface-2",
        ].join(" ")}
        aria-label={`Open batch ${row.visibleBatchNumber}, ${row.skuCode}, ${row.statusAccessibleLabel}`}
      >
        <span className="text-[11px] font-bold">{row.visibleBatchNumber}</span>
        <span className="min-w-0 truncate text-[11px] font-bold">
          {row.skuCode}
        </span>
        <span className="text-[10px] text-muted">
          {row.productionFormatLabel}
        </span>
        <span className="text-[10px]">{row.quantityLabel}</span>
        <span className="text-[10px]">{row.destination}</span>
        <span className="flex justify-end">
          {statusPill(row.statusTone, row.statusLabel)}
        </span>
      </button>
    </>
  );
}
