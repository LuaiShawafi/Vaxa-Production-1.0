import { WeeklyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  failure,
  success,
  validationError,
  type ActionResult,
} from "@/lib/domain/results";

export async function deleteEmptyDraftWeeklyPlan(
  planId: string,
): Promise<ActionResult<{ id: string }>> {
  const plan = await prisma.weeklyPlan.findUnique({
    where: { id: planId },
    include: { _count: { select: { planItems: true } } },
  });
  if (!plan) {
    return failure("Weekly plan not found");
  }
  if (plan.status !== WeeklyPlanStatus.DRAFT) {
    return validationError("Only draft plans can be deleted");
  }
  if (plan._count.planItems > 0) {
    return validationError("Remove all plan items before deleting this draft");
  }

  await prisma.weeklyPlan.delete({ where: { id: planId } });
  return success({ id: planId });
}
