"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-[rgba(18,26,21,0.22)]"
      role="presentation"
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-[min(560px,94vw)] flex-col border-l border-line bg-surface shadow-[-20px_0_55px_rgba(0,0,0,0.12)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-eyebrow font-extrabold tracking-[0.12em] text-muted uppercase">
              Information
            </p>
            <h2
              id={titleId}
              className="mt-1 truncate text-h2 font-extrabold tracking-[-0.02em]"
            >
              {info ? `Batch ${info.batchNumber}` : "Batch info"}
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            density="production"
            className="min-h-12 shrink-0 px-4 font-bold"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
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
        </div>
      </aside>
    </div>
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
