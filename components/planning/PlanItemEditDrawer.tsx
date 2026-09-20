"use client";

import { useId, type MutableRefObject } from "react";
import { PlanItemForm } from "@/components/planning/PlanItemForm";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Pill } from "@/components/ui/Pill";
import { parseDateInput } from "@/lib/date";
import type { PlanItemUiState } from "@/lib/planning/planItemUiState";

type Sku = { id: string; code: string };
type Team = { id: string; name: string };

export type PlanItemEditSubject = {
  planItemId: string;
  skuId: string;
  skuCode: string;
  plannedDateInput: string;
  weekdayLabel: string;
  plannedQuantity: string;
  assignedTeamId: string;
  assignedTeamName: string;
  destinationIdentity: string;
  lockSku: boolean;
  uiState: PlanItemUiState;
  stateLabel: string;
  visibleBatchNumber: string | null;
};

export function PlanItemEditDrawer({
  open,
  planId,
  skus,
  teams,
  subject,
  dirty,
  pending,
  restoreFocusRef,
  onClose,
  onSuccess,
  onDirtyChange,
  onPendingChange,
}: {
  open: boolean;
  planId: string;
  skus: Sku[];
  teams: Team[];
  subject: PlanItemEditSubject | null;
  dirty: boolean;
  pending: boolean;
  restoreFocusRef: MutableRefObject<HTMLElement | null>;
  onClose: () => void;
  onSuccess: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const formId = useId();

  if (!subject) {
    return null;
  }

  const stateTone =
    subject.uiState === "locked"
      ? ("amber" as const)
      : subject.uiState === "open"
        ? ("green" as const)
        : ("blue" as const);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Edit plan item"
      title={subject.skuCode}
      subtitle={`${subject.weekdayLabel} · ${subject.assignedTeamName} · ${subject.destinationIdentity}`}
      headerAside={
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill tone={stateTone}>{subject.stateLabel}</Pill>
          {subject.visibleBatchNumber ? (
            <span className="font-mono text-caption text-muted">
              Batch {subject.visibleBatchNumber}
            </span>
          ) : null}
        </div>
      }
      closeDisabled={pending}
      closeOnOverlayClick={!dirty && !pending}
      closeOnEscape={!pending}
      trapFocus
      initialFocus="first-content"
      busy={pending}
      restoreFocusRef={restoreFocusRef}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            form={formId}
            className="min-h-11"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save plan item"}
          </Button>
        </div>
      }
    >
      <PlanItemForm
        key={subject.planItemId}
        formId={formId}
        layout="stack"
        showSubmit={false}
        planId={planId}
        skus={skus}
        teams={teams}
        lockSku={subject.lockSku}
        initial={{
          planItemId: subject.planItemId,
          skuId: subject.skuId,
          plannedDate: parseDateInput(subject.plannedDateInput),
          plannedQuantity: subject.plannedQuantity,
          assignedTeamId: subject.assignedTeamId,
          destinationIdentity: subject.destinationIdentity,
        }}
        onSuccess={onSuccess}
        onDirtyChange={onDirtyChange}
        onPendingChange={onPendingChange}
      />
    </Drawer>
  );
}
