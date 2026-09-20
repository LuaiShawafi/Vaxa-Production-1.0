import Link from "next/link";
import { Pill } from "@/components/ui/Pill";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type TaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | string;

export type SeedingTaskSummaryProps = {
  batchNumber: string;
  skuCode: string;
  plannedQuantityLabel: string;
  quantityUom: string;
  destination: string;
  taskStatus: TaskStatus;
  hasBom: boolean;
  bomReady: boolean;
  /** In-progress / completed starter context */
  starterName?: string | null;
  startedAtLabel?: string | null;
  showCompleteAction?: boolean;
  completeHref?: string;
};

function taskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "OPEN":
      return "Open";
    default:
      return status;
  }
}

function taskStatusTone(
  status: TaskStatus,
): "green" | "amber" | "red" | "blue" {
  if (status === "COMPLETED") return "green";
  if (status === "IN_PROGRESS") return "amber";
  if (status === "CANCELLED") return "red";
  return "blue";
}

function bomLabel(hasBom: boolean, bomReady: boolean): string {
  if (!hasBom) return "BOM missing";
  if (!bomReady) return "BOM not ready";
  return "BOM ready";
}

function bomTone(
  hasBom: boolean,
  bomReady: boolean,
): "green" | "red" {
  return hasBom && bomReady ? "green" : "red";
}

/**
 * Dominant production-floor summary for Start Seeding.
 * Presentation only — does not encode domain rules.
 */
export function SeedingTaskSummary({
  batchNumber,
  skuCode,
  plannedQuantityLabel,
  quantityUom,
  destination,
  taskStatus,
  hasBom,
  bomReady,
  starterName,
  startedAtLabel,
  showCompleteAction,
  completeHref,
}: SeedingTaskSummaryProps) {
  const blocked = !hasBom || !bomReady;
  const inProgress = taskStatus === "IN_PROGRESS";
  const completed = taskStatus === "COMPLETED";

  return (
    <Card className="overflow-hidden rounded-hero p-0">
      <div className="border-b border-line bg-surface-2/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
              Batch
            </p>
            <p className="mt-1 font-mono text-kpi-hero font-extrabold leading-none tracking-tight text-text">
              {batchNumber}
            </p>
            <p className="mt-2 truncate text-h2 font-extrabold tracking-[-0.02em]">
              {skuCode}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={taskStatusTone(taskStatus)}>
              {taskStatusLabel(taskStatus)}
            </Pill>
            <Pill tone={bomTone(hasBom, bomReady)}>
              {bomLabel(hasBom, bomReady)}
            </Pill>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-eyebrow font-bold tracking-[0.1em] text-muted uppercase">
              Planned
            </dt>
            <dd className="mt-1 text-kpi font-extrabold leading-none">
              {plannedQuantityLabel}
            </dd>
            <dd className="mt-1 text-caption text-muted">{quantityUom}</dd>
          </div>
          <div>
            <dt className="text-eyebrow font-bold tracking-[0.1em] text-muted uppercase">
              Destination
            </dt>
            <dd className="mt-1 text-h2 font-extrabold leading-tight">
              {destination}
            </dd>
            <dd className="mt-1 text-caption text-muted">Assigned room / pool</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-eyebrow font-bold tracking-[0.1em] text-muted uppercase">
              Readiness
            </dt>
            <dd className="mt-1 text-body font-bold leading-snug">
              {blocked
                ? "Blocked — BOM required"
                : completed
                  ? "Seeding finished"
                  : inProgress
                    ? "Ready to complete"
                    : "Ready to start"}
            </dd>
            <dd className="mt-1 text-caption text-muted">
              {blocked
                ? "Cannot begin until PROD BOM is ready"
                : "Production materials configured"}
            </dd>
          </div>
        </dl>

        {blocked ? (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red/30 bg-red-soft px-4 py-3"
          >
            <p className="text-body-small font-bold text-red-text">
              Production is blocked
            </p>
            <p className="mt-1 text-body-small text-red-text/90">
              A ready PROD BOM must exist before seeding can start. Ask CS/CL to
              prepare the BOM, then return here.
            </p>
          </div>
        ) : null}

        {(inProgress || completed) && (starterName || showCompleteAction) ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/50 px-4 py-3">
            <div className="min-w-0">
              {starterName ? (
                <p className="text-body-small text-muted">
                  Started by{" "}
                  <span className="font-semibold text-text">{starterName}</span>
                  {startedAtLabel ? ` · ${startedAtLabel}` : ""}
                </p>
              ) : (
                <p className="text-body-small text-muted">Seeding in progress</p>
              )}
            </div>
            {showCompleteAction && completeHref ? (
              <Link href={completeHref} className="shrink-0">
                <Button variant="primary" density="production" className="font-bold">
                  Complete
                </Button>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
