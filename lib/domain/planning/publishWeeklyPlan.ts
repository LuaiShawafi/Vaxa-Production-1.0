import { WeeklyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { deriveVisibleBatchNumber } from "@/lib/domain/batchNumber";
import {
  conflict,
  failure,
  success,
  validationError,
  type ActionResult,
} from "@/lib/domain/results";
import {
  isBatchSkuNumberCollision,
  isPrismaUniqueViolation,
} from "@/lib/domain/prismaErrors";

export type PublishWeeklyPlanResult = {
  planId: string;
  published: boolean;
  batchesCreated: number;
};

export async function publishWeeklyPlan(
  planId: string,
): Promise<ActionResult<PublishWeeklyPlanResult>> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM weekly_plans WHERE id = ${planId}::uuid FOR UPDATE`;

      const plan = await tx.weeklyPlan.findUnique({
        where: { id: planId },
        include: { planItems: true },
      });

      if (!plan) {
        return failure("Weekly plan not found");
      }

      if (plan.status === WeeklyPlanStatus.PUBLISHED) {
        return success({
          planId: plan.id,
          published: true,
          batchesCreated: 0,
        });
      }

      if (plan.status === WeeklyPlanStatus.ARCHIVED) {
        return failure("Archived plans cannot be published");
      }
      if (plan.status !== WeeklyPlanStatus.DRAFT) {
        return failure("Only draft plans can be published");
      }

      if (plan.planItems.length === 0) {
        return validationError("At least one plan item is required");
      }

      let batchesCreated = 0;

      for (const item of plan.planItems) {
        const visibleBatchNumber = deriveVisibleBatchNumber(
          item.plannedDate,
          item.destinationIdentity,
        );

        const existing = await tx.batch.findFirst({
          where: {
            skuId: item.skuId,
            visibleBatchNumber,
          },
        });
        if (existing) {
          return conflict(
            `Batch number ${visibleBatchNumber} already exists for this SKU`,
            { skuId: item.skuId, visibleBatchNumber },
          );
        }

        const batch = await tx.batch.create({
          data: {
            skuId: item.skuId,
            originPlanItemId: item.id,
            visibleBatchNumber,
            originalAssignedDestination: item.destinationIdentity,
            currentDestination: item.destinationIdentity,
          },
        });

        await tx.productionTask.create({
          data: {
            planItemId: item.id,
            batchId: batch.id,
            assignedTeamId: item.assignedTeamId,
          },
        });

        batchesCreated += 1;
      }

      await tx.weeklyPlan.update({
        where: { id: planId },
        data: { status: WeeklyPlanStatus.PUBLISHED },
      });

      return success({
        planId: plan.id,
        published: true,
        batchesCreated,
      });
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error) && isBatchSkuNumberCollision(error)) {
      return conflict("A batch with this SKU and batch number already exists");
    }
    throw error;
  }
}
