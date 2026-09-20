"use client";

import { useState } from "react";
import { DeletePlanItemButton } from "@/components/planning/DeletePlanItemButton";
import { DevDeletePlanItemButton } from "@/components/planning/DevDeletePlanItemButton";
import {
  usePlanItemEdit,
  type PlanItemEditSubject,
} from "@/components/planning/PlanItemEditController";
import { Button } from "@/components/ui/Button";
import { planItemRowActionName } from "@/lib/planning/planItemAuthoringUi";
import type { PlanItemUiState } from "@/lib/planning/planItemUiState";

export function PlanItemRowActions({
  planId,
  uiState,
  devDeletionEnabled,
  batchId,
  planItemId,
  subject,
}: {
  planId: string;
  uiState: PlanItemUiState;
  devDeletionEnabled: boolean;
  batchId: string | null;
  planItemId: string;
  subject: PlanItemEditSubject | null;
}) {
  const { openEdit } = usePlanItemEdit();
  const canEdit = uiState === "draft" || uiState === "open";
  const canDelete = uiState === "draft" || uiState === "open";

  if (!canEdit && !devDeletionEnabled) {
    return <span className="sr-only">No actions</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {canEdit && subject ? (
        <Button
          type="button"
          variant="secondary"
          className="px-3"
          data-plan-item-edit={planItemId}
          aria-label={planItemRowActionName(
            "edit",
            subject.skuCode,
            subject.weekdayName,
          )}
          onClick={(event) => openEdit(subject, event.currentTarget)}
        >
          Edit
        </Button>
      ) : null}
      {canDelete && subject ? (
        <DeletePlanItemButton
          planItemId={planItemId}
          planId={planId}
          skuCode={subject.skuCode}
          weekdayName={subject.weekdayName}
          uiState={uiState}
          hasMaterializedBatch={batchId != null}
        />
      ) : null}
      {devDeletionEnabled && uiState === "locked" ? (
        <DevDeletePlanItemButton planItemId={planItemId} planId={planId} />
      ) : null}
      {devDeletionEnabled && batchId && uiState !== "draft" ? (
        <DevDeleteBatchButton batchId={batchId} />
      ) : null}
    </div>
  );
}

function DevDeleteBatchButton({ batchId }: { batchId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          if (
            !window.confirm(
              "Dev delete: remove this batch and all production history? Plan item will remain.",
            )
          ) {
            return;
          }
          setError(null);
          setPending(true);
          const { deleteBatchDevelopmentAction } = await import(
            "@/lib/actions/development"
          );
          const result = await deleteBatchDevelopmentAction(batchId);
          setPending(false);
          if (!result.ok) {
            setError(result.message);
          } else {
            window.location.reload();
          }
        }}
      >
        Dev delete batch
      </Button>
      {error ? <p className="text-red text-caption">{error}</p> : null}
    </div>
  );
}
