"use client";

import { useId, type MutableRefObject } from "react";
import { PlanItemForm } from "@/components/planning/PlanItemForm";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Pill } from "@/components/ui/Pill";
import { parseDateInput } from "@/lib/date";
import { PLAN_ITEM_DISCARD_CONFIRM_COPY } from "@/lib/planning/planItemAuthoringUi";
import type { PlanItemUiState } from "@/lib/planning/planItemUiState";

type Sku = { id: string; code: string };
type Team = { id: string; name: string };

export type PlanItemAddSubject = {
  kind: "add";
  dateInput: string;
  weekdayName: string;
  dayLabel: string;
};

export type PlanItemEditSubject = {
  kind: "edit";
  planItemId: string;
  skuId: string;
  skuCode: string;
  plannedDateInput: string;
  weekdayName: string;
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

export type PlanItemDrawerSubject = PlanItemAddSubject | PlanItemEditSubject;

export function PlanItemEditDrawer({
  open,
  planId,
  skus,
  teams,
  subject,
  dirty,
  pending,
  discardPrompt,
  restoreFocusRef,
  onClose,
  onConfirmDiscard,
  onKeepEditing,
  onSuccess,
  onDirtyChange,
  onPendingChange,
}: {
  open: boolean;
  planId: string;
  skus: Sku[];
  teams: Team[];
  subject: PlanItemDrawerSubject | null;
  dirty: boolean;
  pending: boolean;
  discardPrompt: boolean;
  restoreFocusRef: MutableRefObject<HTMLElement | null>;
  onClose: () => void;
  onConfirmDiscard: () => void;
  onKeepEditing: () => void;
  onSuccess: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const formId = useId();

  if (!subject) {
    return null;
  }

  const isAdd = subject.kind === "add";
  const stateTone =
    !isAdd && subject.uiState === "locked"
      ? ("amber" as const)
      : !isAdd && subject.uiState === "open"
        ? ("green" as const)
        : ("blue" as const);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={isAdd ? "Add plan item" : "Edit plan item"}
      title={isAdd ? subject.weekdayName : subject.skuCode}
      subtitle={
        isAdd
          ? subject.dayLabel
          : `${subject.weekdayLabel} · ${subject.assignedTeamName} · ${subject.destinationIdentity}`
      }
      headerAside={
        isAdd ? undefined : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill tone={stateTone}>{subject.stateLabel}</Pill>
            {subject.visibleBatchNumber ? (
              <span className="font-mono text-caption text-muted">
                Batch {subject.visibleBatchNumber}
              </span>
            ) : null}
          </div>
        )
      }
      closeDisabled={pending}
      closeOnOverlayClick={!dirty && !pending}
      closeOnEscape={!pending}
      trapFocus
      initialFocus="first-content"
      busy={pending}
      restoreFocusRef={restoreFocusRef}
      footer={
        discardPrompt ? (
          <div>
            <p className="font-semibold" role="alert">
              {PLAN_ITEM_DISCARD_CONFIRM_COPY}
            </p>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                onClick={onConfirmDiscard}
              >
                Discard
              </Button>
              <Button
                type="button"
                variant="primary"
                className="min-h-11"
                onClick={onKeepEditing}
              >
                Keep editing
              </Button>
            </div>
          </div>
        ) : (
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
              {pending ? "Saving…" : isAdd ? "Add plan item" : "Save plan item"}
            </Button>
          </div>
        )
      }
    >
      {isAdd ? (
        <PlanItemForm
          key={`add-${subject.dateInput}`}
          formId={formId}
          layout="stack"
          showSubmit={false}
          planId={planId}
          skus={skus}
          teams={teams}
          defaultPlannedDate={subject.dateInput}
          onSuccess={onSuccess}
          onDirtyChange={onDirtyChange}
          onPendingChange={onPendingChange}
        />
      ) : (
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
      )}
    </Drawer>
  );
}
