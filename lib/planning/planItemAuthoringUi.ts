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

/** Shown on draft plan items (add + edit before publish). */
export const PLAN_ITEM_DESTINATION_HINT_DRAFT =
  "The selected destination is used when the batch number is created at publish.";

/** Shown when editing a published OPEN item (batch already materialised). */
export const PLAN_ITEM_DESTINATION_HINT_PUBLISHED_OPEN =
  "Batch number is fixed at publish; changing destination updates the plan only.";

export function planItemDestinationFieldHint(lockSku: boolean): string {
  return lockSku
    ? PLAN_ITEM_DESTINATION_HINT_PUBLISHED_OPEN
    : PLAN_ITEM_DESTINATION_HINT_DRAFT;
}

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
