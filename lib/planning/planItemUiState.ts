import { ProductionTaskStatus, WeeklyPlanStatus } from "@prisma/client";

export type PlanItemUiState = "draft" | "open" | "locked";

export function planItemUiState(
  planStatus: WeeklyPlanStatus,
  taskStatus: ProductionTaskStatus | undefined,
): PlanItemUiState {
  if (planStatus === WeeklyPlanStatus.DRAFT) {
    return "draft";
  }
  if (planStatus === WeeklyPlanStatus.ARCHIVED) {
    return "locked";
  }
  if (taskStatus === ProductionTaskStatus.OPEN) {
    return "open";
  }
  return "locked";
}
