"use client";

import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import {
  SeedTodayInfoController,
  SeedTodayRowActions,
  type SeedTodayPrimaryAction,
} from "@/components/402/SeedTodayRowActions";
import type { SeedTodayRow } from "@/components/402/SeedTodayList";

/** Shared by header + rows so fr tracks never drift (actions column is fixed). */
const LIST_GRID =
  "grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)_minmax(0,0.85fr)_minmax(0,0.75fr)_minmax(0,0.95fr)_10.75rem]";

const LIST_PAD = "px-3.5";
const LIST_GAP = "gap-x-2.5";

function statusPill(status: string) {
  if (status === "COMPLETED") {
    return <Pill tone="green">Completed</Pill>;
  }
  if (status === "IN_PROGRESS") {
    return <Pill tone="amber">In progress</Pill>;
  }
  return <Pill tone="blue">Open</Pill>;
}

function primaryActionForRow(
  status: string,
  taskId: string,
): SeedTodayPrimaryAction | null {
  if (status === "OPEN") {
    return { label: "Start", href: `/402/seeding/${taskId}` };
  }
  if (status === "IN_PROGRESS") {
    return {
      label: "Complete",
      href: `/402/seeding/${taskId}/complete`,
    };
  }
  return null;
}

export function SeedTodayTaskTable({ rows }: { rows: SeedTodayRow[] }) {
  return (
    <SeedTodayInfoController>
      {({ openInfo }) => (
        <Card className="overflow-hidden">
          <div
            className={[
              "hidden md:grid",
              LIST_GRID,
              LIST_GAP,
              LIST_PAD,
              "items-center bg-surface-2 py-2 text-[9px] font-extrabold tracking-[0.06em] text-muted uppercase",
            ].join(" ")}
            role="row"
          >
            <div>Batch</div>
            <div>SKU / plan</div>
            <div>Qty</div>
            <div>Room</div>
            <div>State</div>
            <div className="text-right">Actions</div>
          </div>

          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <SeedTodayRowItem
                key={row.taskId}
                row={row}
                onOpenInfo={openInfo}
              />
            ))}
          </ul>
        </Card>
      )}
    </SeedTodayInfoController>
  );
}

function SeedTodayRowItem({
  row,
  onOpenInfo,
}: {
  row: SeedTodayRow;
  onOpenInfo: (taskId: string) => void;
}) {
  const qtyLabel = `${row.plannedQuantity} ${row.quantityUom}`;
  const primaryAction = primaryActionForRow(row.status, row.taskId);

  const actionProps = {
    taskId: row.taskId,
    primaryAction,
    onOpenInfo,
  };

  return (
    <li data-testid="seed-today-row">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3 md:hidden">
        <div className="min-w-0">
          <p className="text-[11px] font-bold leading-snug">{row.batchNumber}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold leading-snug">
            {row.skuCode}
          </p>
          <span className="mt-0.5 block text-[9px] text-muted">
            {qtyLabel} · Room {row.destination}
            {row.starterName ? ` · Started by ${row.starterName}` : ""}
          </span>
          <div className="mt-1.5">{statusPill(row.status)}</div>
        </div>
        <SeedTodayRowActions {...actionProps} />
      </div>

      <div
        className={[
          "hidden md:grid",
          LIST_GRID,
          LIST_GAP,
          LIST_PAD,
          "items-center py-[11px]",
        ].join(" ")}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold leading-snug">{row.batchNumber}</p>
        </div>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold leading-snug">
            {row.skuCode}
          </p>
          {row.starterName ? (
            <span className="mt-0.5 block truncate text-[9px] text-muted">
              Started by {row.starterName}
            </span>
          ) : null}
        </div>

        <div className="text-[10.5px]">{qtyLabel}</div>
        <div className="text-[10.5px]">{row.destination}</div>
        <div>{statusPill(row.status)}</div>

        <SeedTodayRowActions {...actionProps} />
      </div>
    </li>
  );
}
