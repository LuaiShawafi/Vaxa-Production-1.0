"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlanItemAction } from "@/lib/actions/planning";
import { Button } from "@/components/ui/Button";
import {
  planItemDeleteConfirmMessage,
  planItemRowActionName,
} from "@/lib/planning/planItemAuthoringUi";
import type { PlanItemUiState } from "@/lib/planning/planItemUiState";

export function DeletePlanItemButton({
  planItemId,
  planId,
  skuCode,
  weekdayName,
  uiState,
  hasMaterializedBatch,
}: {
  planItemId: string;
  planId: string;
  skuCode: string;
  weekdayName: string;
  uiState: PlanItemUiState;
  hasMaterializedBatch: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        className="text-caption"
        disabled={pending}
        aria-label={planItemRowActionName("delete", skuCode, weekdayName)}
        onClick={() => {
          if (
            !window.confirm(
              planItemDeleteConfirmMessage({ uiState, hasMaterializedBatch }),
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await deletePlanItemAction(planItemId, planId);
            if (result.ok) {
              router.refresh();
              return;
            }
            setError(result.message);
          });
        }}
      >
        Delete
      </Button>
      {error ? (
        <p className="text-red text-caption" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
