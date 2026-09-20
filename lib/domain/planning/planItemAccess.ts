import { ProductionTaskStatus, WeeklyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  failure,
  success,
  validationError,
  type ActionFailure,
  type ActionResult,
  type ActionValidationError,
} from "@/lib/domain/results";

export type PlanItemWithTask = {
  id: string;
  planId: string;
  plan: { status: WeeklyPlanStatus; week: string };
  productionTasks: { id: string; status: ProductionTaskStatus }[];
  batch: { id: string } | null;
};

export async function loadPlanItemForMutation(
  planItemId: string,
): Promise<ActionResult<PlanItemWithTask>> {
  const existing = await prisma.planItem.findUnique({
    where: { id: planItemId },
    include: {
      plan: true,
      batch: { select: { id: true } },
      productionTasks: { select: { id: true, status: true } },
    },
  });
  if (!existing) {
    return failure("Plan item not found");
  }
  return success(existing);
}

export function openProductionTask(
  item: PlanItemWithTask,
): { id: string; status: ProductionTaskStatus } | null {
  const open = item.productionTasks.find(
    (t) => t.status === ProductionTaskStatus.OPEN,
  );
  return open ?? null;
}

export function assertPlanItemPlanningEditable(
  item: PlanItemWithTask,
): ActionValidationError | ActionFailure | null {
  if (item.plan.status === WeeklyPlanStatus.DRAFT) {
    return null;
  }
  if (item.plan.status === WeeklyPlanStatus.ARCHIVED) {
    return validationError("Archived plans cannot be modified");
  }
  if (item.plan.status !== WeeklyPlanStatus.PUBLISHED) {
    return validationError("Plan cannot be modified");
  }
  const task = openProductionTask(item);
  if (!task) {
    return validationError(
      "Plan item is locked because production has already started or completed",
    );
  }
  return null;
}
