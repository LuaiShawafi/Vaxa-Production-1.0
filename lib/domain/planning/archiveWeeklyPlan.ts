import { WeeklyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { failure, success, validationError, type ActionResult } from "@/lib/domain/results";

export async function archiveWeeklyPlan(
  planId: string,
): Promise<ActionResult<{ id: string }>> {
  const plan = await prisma.weeklyPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return failure("Weekly plan not found");
  }
  if (plan.status === WeeklyPlanStatus.ARCHIVED) {
    return success({ id: plan.id });
  }
  if (plan.status !== WeeklyPlanStatus.PUBLISHED) {
    return validationError("Only published plans can be archived");
  }

  await prisma.weeklyPlan.update({
    where: { id: planId },
    data: {
      status: WeeklyPlanStatus.ARCHIVED,
      archivedAt: new Date(),
    },
  });

  return success({ id: planId });
}
