"use client";

import { useState } from "react";
import { DeletePlanItemButton } from "@/components/planning/DeletePlanItemButton";
import { DevDeletePlanItemButton } from "@/components/planning/DevDeletePlanItemButton";
import { PlanItemForm } from "@/components/planning/PlanItemForm";
import { Button } from "@/components/ui/Button";
import type { PlanItemUiState } from "@/lib/planning/planItemUiState";

type Sku = { id: string; code: string };
type Team = { id: string; name: string };

export function PlanItemRowActions({
  planId,
  uiState,
  devDeletionEnabled,
  batchId,
  item,
  skus,
  teams,
}: {
  planId: string;
  uiState: PlanItemUiState;
  devDeletionEnabled: boolean;
  batchId: string | null;
  item: {
    id: string;
    skuId: string;
    plannedDate: Date;
    plannedQuantity: string;
    assignedTeamId: string;
    destinationIdentity: string;
  };
  skus: Sku[];
  teams: Team[];
}) {
  const [editing, setEditing] = useState(false);
  const canEdit = uiState === "draft" || uiState === "open";
  const canDelete = uiState === "draft" || uiState === "open";

  if (!canEdit && !devDeletionEnabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      {canEdit ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Cancel edit" : "Edit"}
        </Button>
      ) : null}
      {canDelete ? (
        <DeletePlanItemButton planItemId={item.id} planId={planId} />
      ) : null}
      {devDeletionEnabled && uiState === "locked" ? (
        <DevDeletePlanItemButton planItemId={item.id} planId={planId} />
      ) : null}
      {devDeletionEnabled && batchId && uiState !== "draft" ? (
        <DevDeleteBatchButton batchId={batchId} />
      ) : null}
      {editing && canEdit ? (
        <PlanItemForm
          planId={planId}
          skus={skus}
          teams={teams}
          lockSku={uiState === "open"}
          initial={{
            planItemId: item.id,
            skuId: item.skuId,
            plannedDate: item.plannedDate,
            plannedQuantity: item.plannedQuantity,
            assignedTeamId: item.assignedTeamId,
            destinationIdentity: item.destinationIdentity,
          }}
          onSuccess={() => setEditing(false)}
        />
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
