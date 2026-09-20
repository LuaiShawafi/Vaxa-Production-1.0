"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { Pill } from "@/components/ui/Pill";
import type { SeedTodayTaskInfo } from "@/lib/types/seedTodayTaskInfo";

type SeedTodayInfoDrawerProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  info: SeedTodayTaskInfo | null;
  onClose: () => void;
};

function statusTone(status: SeedTodayTaskInfo["taskStatus"]) {
  if (status === "COMPLETED") return "green" as const;
  if (status === "IN_PROGRESS") return "amber" as const;
  return "blue" as const;
}

export function SeedTodayInfoDrawer({
  open,
  loading,
  error,
  info,
  onClose,
}: SeedTodayInfoDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Information"
      title={info ? `Batch ${info.batchNumber}` : "Batch info"}
      trapFocus={false}
      initialFocus="panel"
      closeDensity="production"
      closeClassName="min-h-12 shrink-0 px-4 font-bold"
    >
      {loading ? (
        <p className="text-body text-muted">Loading batch information…</p>
      ) : null}

      {!loading && error ? (
        <div className="rounded-lg border border-red-soft bg-red-soft/40 p-4">
          <p className="text-body-small font-bold text-red-text">
            Could not load info
          </p>
          <p className="mt-1 text-body-small text-muted">{error}</p>
        </div>
      ) : null}

      {!loading && !error && info ? <DrawerBody info={info} /> : null}
    </Drawer>
  );
}

function DrawerBody({ info }: { info: SeedTodayTaskInfo }) {
  const rows: { label: string; value: string }[] = [
    { label: "SKU", value: info.skuCode },
    {
      label: "Planned",
      value: `${info.plannedQuantity} ${info.quantityUom}`,
    },
    { label: "Destination", value: info.destination },
    {
      label: "Original destination",
      value: info.originalAssignedDestination,
    },
    { label: "Current stage", value: info.currentStageLabel },
    { label: "Task status", value: info.taskStatusLabel },
    {
      label: "Plan",
      value: `${info.planWeek} · ${info.planStatusLabel}`,
    },
    { label: "Planned date", value: info.plannedDateLabel },
    { label: "BOM", value: info.bomStatusLabel },
  ];

  if (info.starterName) {
    rows.push({
      label: "Started by",
      value: info.startedAtLabel
        ? `${info.starterName} · ${info.startedAtLabel}`
        : info.starterName,
    });
  }

  if (info.completedAtLabel) {
    rows.push({ label: "Completed", value: info.completedAtLabel });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={statusTone(info.taskStatus)}>{info.taskStatusLabel}</Pill>
        <span className="text-caption text-muted">{info.currentStageLabel}</span>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-caption text-muted">{row.label}</dt>
            <dd className="font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>

      {info.preselectedLots.length > 0 ? (
        <section>
          <h3 className="text-h3 font-bold">Preselected lots</h3>
          <ul className="mt-2 space-y-1.5">
            {info.preselectedLots.map((lot) => (
              <li
                key={`${lot.lotType}-${lot.lotNumber}`}
                className="rounded-md border border-line px-3 py-2 text-body-small"
              >
                <span className="font-bold">{lot.lotNumber}</span>
                <span className="ml-2 text-muted">{lot.lotType}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="text-h3 font-bold">History</h3>
        <ul className="mt-2.5 flex flex-col gap-2">
          {info.history.map((event) => (
            <li
              key={event.id}
              className="flex gap-2.5 rounded-[10px] border border-line p-2.5"
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-pill bg-green"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold">{event.title}</p>
                <p className="mt-0.5 text-[9px] text-muted">{event.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-t border-line pt-4">
        {info.showGerminationBatchLink ? (
          <Link
            href={`/batches/active/${info.batchId}`}
            className="text-body-small font-bold text-green-dark underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            Open germination batch detail →
          </Link>
        ) : (
          <p className="text-caption text-muted">More history coming</p>
        )}
      </div>
    </div>
  );
}
