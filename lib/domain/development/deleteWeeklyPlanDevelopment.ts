import { prisma } from "@/lib/db/prisma";
import { failure, success, type ActionResult } from "@/lib/domain/results";
import { deleteBatchSubtree } from "@/lib/domain/development/deleteBatchSubtree";
import { assertDevDeletionEnabled } from "@/lib/domain/development/devDeletionGate";

export async function deleteWeeklyPlanDevelopment(
  planId: string,
): Promise<ActionResult<{ planId: string }>> {
  const gate = assertDevDeletionEnabled();
  if (gate) {
    return gate;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM weekly_plans WHERE id = ${planId}::uuid FOR UPDATE`;

      const plan = await tx.weeklyPlan.findUnique({
        where: { id: planId },
        include: {
          planItems: { include: { batch: true } },
        },
      });
      if (!plan) {
        throw new Error("NOT_FOUND");
      }

      for (const item of plan.planItems) {
        if (item.batch) {
          await deleteBatchSubtree(tx, item.batch.id);
        }
      }

      await tx.planItem.deleteMany({ where: { planId } });
      await tx.weeklyPlan.delete({ where: { id: planId } });
    });
    return success({ planId });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return failure("Weekly plan not found");
    }
    throw error;
  }
}
