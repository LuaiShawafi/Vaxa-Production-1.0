import type { PlanItemUiState } from "@/lib/planning/planItemUiState";

export type PlanItemDrawerCloseIntent = "ignore" | "prompt-discard" | "close";

/** Close policy for Add/Edit plan item drawers. Pending never closes. Dirty needs confirm. */
export function planItemDrawerCloseIntent(args: {
  pending: boolean;
  dirty: boolean;
  discardPromptOpen: boolean;
}): PlanItemDrawerCloseIntent {
  if (args.pending) {
    return "ignore";
  }
  if (args.dirty) {
    return args.discardPromptOpen ? "ignore" : "prompt-discard";
  }
  return "close";
}

export const PLAN_ITEM_DISCARD_CONFIRM_COPY = "Discard changes?";

export function planItemDeleteConfirmMessage(args: {
  uiState: PlanItemUiState;
  hasMaterializedBatch: boolean;
}): string {
  if (args.uiState === "draft" && !args.hasMaterializedBatch) {
    return "Remove this draft planning line?";
  }
  return "Remove this planning item? This also removes its associated batch and related production records.";
}

export function planItemRowActionName(
  action: "edit" | "delete",
  skuCode: string,
  weekdayName: string,
): string {
  const verb = action === "edit" ? "Edit" : "Delete";
  return `${verb} ${skuCode} on ${weekdayName}`;
}
