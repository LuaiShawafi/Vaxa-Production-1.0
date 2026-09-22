"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { ChoiceGrid } from "@/components/ui/ChoiceGrid";
import { Pill } from "@/components/ui/Pill";
import type { Germination402WorkerRow } from "@/lib/domain/germination/germination402ReadModel";
import type { Team402Worker } from "@/lib/db/queries/germination402";
import type { ActionResult } from "@/lib/domain/results";
import type { ExtendGerminationOutcome } from "@/lib/domain/germination/extendGermination";
import type { MoveToNurseryOutcome } from "@/lib/domain/germination/moveToNursery";
import type { GerminationExtensionPreset } from "@/lib/validation/germination";

type ExtensionChoice =
  | { kind: GerminationExtensionPreset }
  | { kind: "CUSTOM"; customDays: number };

type DrawerStep =
  | "menu"
  | "extend"
  | "move"
  | "confirm-extend"
  | "confirm-move"
  | "success";

type Germination402ActionDrawerProps = {
  open: boolean;
  row: Germination402WorkerRow | null;
  workers: Team402Worker[];
  busy: boolean;
  onClose: () => void;
  formatExtendedDate: (date: Date) => string;
  onExtend: (
    batchId: string,
    workerId: string,
    extension: ExtensionChoice,
  ) => Promise<ActionResult<ExtendGerminationOutcome>>;
  onMove: (
    batchId: string,
    workerId: string,
  ) => Promise<ActionResult<MoveToNurseryOutcome>>;
  onSuccessClose: () => void;
};

const PRESET_CHOICES: { id: GerminationExtensionPreset; label: string }[] = [
  { id: "PLUS_1", label: "+1 day" },
  { id: "PLUS_2", label: "+2 days" },
  { id: "PLUS_3", label: "+3 days" },
];

export function Germination402ActionDrawer({
  open,
  row,
  workers,
  busy,
  onClose,
  formatExtendedDate,
  onExtend,
  onMove,
  onSuccessClose,
}: Germination402ActionDrawerProps) {
  const [step, setStep] = useState<DrawerStep>("menu");
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [extensionKind, setExtensionKind] = useState<
    GerminationExtensionPreset | "CUSTOM" | null
  >(null);
  const [customDays, setCustomDays] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("menu");
      setWorkerId(null);
      setExtensionKind(null);
      setCustomDays("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, row?.batchId]);

  const selectedWorkerName =
    workers.find((w) => w.id === workerId)?.name ?? null;

  const extensionChoice = (): ExtensionChoice | null => {
    if (extensionKind === "CUSTOM") {
      const parsed = Number.parseInt(customDays, 10);
      if (!Number.isFinite(parsed)) {
        return null;
      }
      return { kind: "CUSTOM", customDays: parsed };
    }
    if (extensionKind) {
      return { kind: extensionKind };
    }
    return null;
  };

  const extendConfirmLabel = (): string | null => {
    const ext = extensionChoice();
    if (!ext || !row) {
      return null;
    }
    if (ext.kind === "CUSTOM") {
      const days = ext.customDays;
      return `Extend germination by ${days} ${days === 1 ? "day" : "days"}?`;
    }
    const map: Record<GerminationExtensionPreset, string> = {
      PLUS_1: "Extend germination by 1 day?",
      PLUS_2: "Extend germination by 2 days?",
      PLUS_3: "Extend germination by 3 days?",
    };
    return map[ext.kind];
  };

  async function submitExtend() {
    if (!row || !workerId) {
      setError("Select your name before confirming.");
      return;
    }
    const ext = extensionChoice();
    if (!ext) {
      setError("Choose a valid extension.");
      return;
    }
    setError(null);
    const result = await onExtend(row.batchId, workerId, ext);
    if (result.ok) {
      setSuccessMessage(
        `Germination extended to ${formatExtendedDate(result.data.expectedGerminationAt)}.`,
      );
      setStep("success");
      return;
    }
    setError(result.message);
    if (result.kind === "validation_error" || result.kind === "conflict") {
      // Stay on confirm; parent refresh may happen on conflict for move only
    }
  }

  async function submitMove() {
    if (!row || !workerId) {
      setError("Select your name before confirming.");
      return;
    }
    setError(null);
    const result = await onMove(row.batchId, workerId);
    if (result.ok) {
      setSuccessMessage("Batch moved to Nursery.");
      setStep("success");
      return;
    }
    setError(result.message);
  }

  const title = row
    ? `Batch ${row.visibleBatchNumber}`
    : "Germination batch";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Germination"
      title={title}
      subtitle={row ? row.skuCode : undefined}
      busy={busy}
      closeDisabled={busy}
      trapFocus
      initialFocus="first-content"
      closeDensity="production"
      closeClassName="min-h-12 shrink-0 px-4 font-bold"
      footer={
        step === "success" ? (
          <Button
            type="button"
            variant="primary"
            density="production"
            className="w-full min-h-12 font-bold"
            onClick={onSuccessClose}
          >
            Done
          </Button>
        ) : null
      }
    >
      {!row ? (
        <p className="text-body text-muted">Select a batch from the list.</p>
      ) : null}

      {row && step === "menu" ? (
        <MenuStep row={row} onExtend={() => setStep("extend")} onMove={() => setStep("move")} />
      ) : null}

      {row && step === "extend" ? (
        <ExtendStep
          extensionKind={extensionKind}
          customDays={customDays}
          workers={workers}
          workerId={workerId}
          error={error}
          onBack={() => {
            setStep("menu");
            setError(null);
          }}
          onSelectExtension={(kind) => {
            setExtensionKind(kind);
            setError(null);
          }}
          onCustomDaysChange={setCustomDays}
          onSelectWorker={(id) => {
            setWorkerId(id);
            setError(null);
          }}
          onContinue={() => {
            const ext = extensionChoice();
            if (!ext) {
              if (extensionKind === "CUSTOM") {
                setError("Enter a valid number of days (1–365).");
              } else {
                setError("Choose +1, +2, +3, or Custom.");
              }
              return;
            }
            if (!workerId) {
              setError("Select your name.");
              return;
            }
            setError(null);
            setStep("confirm-extend");
          }}
        />
      ) : null}

      {row && step === "confirm-extend" ? (
        <ConfirmStep
          headline={extendConfirmLabel() ?? "Extend germination?"}
          detail={`Batch ${row.visibleBatchNumber} · ${row.skuCode}`}
          workerName={selectedWorkerName}
          error={error}
          busy={busy}
          confirmLabel="Extend germination"
          onBack={() => {
            setStep("extend");
            setError(null);
          }}
          onConfirm={submitExtend}
        />
      ) : null}

      {row && step === "move" ? (
        <MoveStep
          row={row}
          workers={workers}
          workerId={workerId}
          error={error}
          onBack={() => {
            setStep("menu");
            setError(null);
          }}
          onSelectWorker={(id) => {
            setWorkerId(id);
            setError(null);
          }}
          onContinue={() => {
            if (!workerId) {
              setError("Select your name.");
              return;
            }
            setError(null);
            setStep("confirm-move");
          }}
        />
      ) : null}

      {row && step === "confirm-move" ? (
        <ConfirmStep
          headline={`Move batch ${row.visibleBatchNumber} to Nursery?`}
          detail={`${row.skuCode} · Room ${row.destination}`}
          workerName={selectedWorkerName}
          error={error}
          busy={busy}
          confirmLabel="Move to Nursery"
          onBack={() => {
            setStep("move");
            setError(null);
          }}
          onConfirm={submitMove}
        />
      ) : null}

      {step === "success" && successMessage ? (
        <div
          className="rounded-lg border border-green-soft bg-green-soft/50 p-5"
          role="status"
        >
          <p className="text-body font-bold text-green-dark">Done</p>
          <p className="mt-2 text-body-small text-text">{successMessage}</p>
        </div>
      ) : null}
    </Drawer>
  );
}

function MenuStep({
  row,
  onExtend,
  onMove,
}: {
  row: Germination402WorkerRow;
  onExtend: () => void;
  onMove: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={row.statusTone}>{row.statusLabel}</Pill>
        <span className="text-caption text-muted">
          Assessment {row.expectedAssessmentDateLabel}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <InfoItem label="SKU" value={row.skuCode} />
        <InfoItem label="Format" value={row.productionFormatLabel} />
        <InfoItem label="Quantity" value={row.quantityLabel} />
        <InfoItem label="Destination" value={row.destination} />
        <InfoItem
          label="Seeded"
          value={row.seededAtLabel ?? "—"}
        />
        <InfoItem
          label="Germination target"
          value={
            row.germinationDaysSnapshot != null
              ? `${row.germinationDaysSnapshot} days`
              : "—"
          }
        />
      </dl>

      <div className="flex flex-col gap-2.5 pt-2">
        <Button
          type="button"
          variant="secondary"
          density="production"
          className="min-h-12 w-full font-bold"
          onClick={onExtend}
        >
          Extend germination
        </Button>
        <Button
          type="button"
          variant="primary"
          density="production"
          className="min-h-12 w-full font-bold"
          onClick={onMove}
        >
          Move to Nursery
        </Button>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function ExtendStep({
  extensionKind,
  customDays,
  workers,
  workerId,
  error,
  onBack,
  onSelectExtension,
  onCustomDaysChange,
  onSelectWorker,
  onContinue,
}: {
  extensionKind: GerminationExtensionPreset | "CUSTOM" | null;
  customDays: string;
  workers: Team402Worker[];
  workerId: string | null;
  error: string | null;
  onBack: () => void;
  onSelectExtension: (kind: GerminationExtensionPreset | "CUSTOM") => void;
  onCustomDaysChange: (value: string) => void;
  onSelectWorker: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-body-small text-muted">
        Choose how many days to add to the expected assessment date.
      </p>

      <ChoiceGrid
        aria-label="Extension length"
        choices={[
          ...PRESET_CHOICES,
          { id: "CUSTOM", label: "Custom" },
        ]}
        selectedId={extensionKind}
        onSelect={(id) =>
          onSelectExtension(id as GerminationExtensionPreset | "CUSTOM")
        }
        density="production"
      />

      {extensionKind === "CUSTOM" ? (
        <label className="block">
          <span className="text-caption font-bold text-muted">Custom days</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            value={customDays}
            onChange={(e) => onCustomDaysChange(e.target.value)}
            className="mt-1.5 min-h-12 w-full rounded-md border border-line px-3 text-body font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          />
        </label>
      ) : null}

      <div>
        <p className="text-h3 font-bold">Who are you?</p>
        <p className="mt-1 text-body-small text-muted">
          Shared 402 device — select your name.
        </p>
        {workers.length === 0 ? (
          <p className="mt-2 text-body-small text-muted" role="status">
            No 402 workers available.
          </p>
        ) : (
          <div className="mt-3">
            <ChoiceGrid
              aria-label="Who are you?"
              choices={workers.map((w) => ({ id: w.id, label: w.name }))}
              selectedId={workerId}
              onSelect={onSelectWorker}
              density="production"
            />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-body-small font-semibold text-red" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          density="production"
          className="min-h-12 flex-1 font-bold"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          density="production"
          className="min-h-12 flex-1 font-bold"
          onClick={onContinue}
        >
          Review extension
        </Button>
      </div>
    </div>
  );
}

function MoveStep({
  row,
  workers,
  workerId,
  error,
  onBack,
  onSelectWorker,
  onContinue,
}: {
  row: Germination402WorkerRow;
  workers: Team402Worker[];
  workerId: string | null;
  error: string | null;
  onBack: () => void;
  onSelectWorker: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-body-small text-muted">
        Confirm who is moving batch {row.visibleBatchNumber} to nursery. Destination
        stays {row.destination}.
      </p>

      <div>
        <p className="text-h3 font-bold">Who are you?</p>
        {workers.length === 0 ? (
          <p className="mt-2 text-body-small text-muted" role="status">
            No 402 workers available.
          </p>
        ) : (
          <div className="mt-3">
            <ChoiceGrid
              aria-label="Who are you?"
              choices={workers.map((w) => ({ id: w.id, label: w.name }))}
              selectedId={workerId}
              onSelect={onSelectWorker}
              density="production"
            />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-body-small font-semibold text-red" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          density="production"
          className="min-h-12 flex-1 font-bold"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          density="production"
          className="min-h-12 flex-1 font-bold"
          onClick={onContinue}
        >
          Review move
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({
  headline,
  detail,
  workerName,
  error,
  busy,
  confirmLabel,
  onBack,
  onConfirm,
}: {
  headline: string;
  detail: string;
  workerName: string | null;
  error: string | null;
  busy: boolean;
  confirmLabel: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-surface-2 p-4">
        <p className="text-body font-bold text-text">{headline}</p>
        <p className="mt-1 text-body-small text-muted">{detail}</p>
        {workerName ? (
          <p className="mt-2 text-body-small">
            As{" "}
            <span className="font-semibold">{workerName}</span>
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-body-small font-semibold text-red" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          density="production"
          className="min-h-12 flex-1 font-bold"
          disabled={busy}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          density="production"
          className="min-h-12 flex-1 font-bold"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Saving…" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
