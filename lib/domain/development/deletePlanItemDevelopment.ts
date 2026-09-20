import { WeeklyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { failure, success, type ActionResult } from "@/lib/domain/results";
import { deleteBatchSubtree } from "@/lib/domain/development/deleteBatchSubtree";
import { assertDevDeletionEnabled } from "@/lib/domain/development/devDeletionGate";

export async function deletePlanItemDevelopment(
  planItemId: string,
): Promise<ActionResult<{ planItemId: string; planRevertedToDraft: boolean }>> {
  const gate = assertDevDeletionEnabled();
  if (gate) {
    return gate;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM plan_items WHERE id = ${planItemId}::uuid FOR UPDATE`;

      const item = await tx.planItem.findUnique({
        where: { id: planItemId },
        include: { batch: true, plan: true },
      });
      if (!item) {
        throw new Error("NOT_FOUND");
      }

      if (item.batch) {
        await deleteBatchSubtree(tx, item.batch.id);
      }

      const planId = item.planId;
      await tx.planItem.delete({ where: { id: planItemId } });

      let planRevertedToDraft = false;
      const remaining = await tx.planItem.count({ where: { planId } });
      if (remaining === 0 && item.plan.status === WeeklyPlanStatus.PUBLISHED) {
        await tx.weeklyPlan.update({
          where: { id: planId },
          data: { status: WeeklyPlanStatus.DRAFT },
        });
        planRevertedToDraft = true;
      }

      return { planItemId, planRevertedToDraft };
    });
    return success(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return failure("Plan item not found");
    }
    throw error;
  }
}
