import {
  BatchStage,
  ProductionEventType,
  ProductionTaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { PRODUCTION_UOM } from "@/lib/constants";
import {
  failure,
  success,
  validationError,
  type ActionResult,
} from "@/lib/domain/results";
import {
  destinationChangeRequiresExplanation,
  type ChangeBatchDestinationInput,
} from "@/lib/validation/destination";

export async function changeBatchDestination(
  input: ChangeBatchDestinationInput,
): Promise<ActionResult<{ productionEventId: string }>> {
  if (destinationChangeRequiresExplanation(input.reasonCode)) {
    if (!input.explanation?.trim()) {
      return validationError("Explanation is required for this reason");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM batches WHERE id = ${input.batchId}::uuid FOR UPDATE`;

    const batch = await tx.batch.findUnique({
      where: { id: input.batchId },
      include: {
        originPlanItem: true,
        productionTasks: {
          where: { status: ProductionTaskStatus.COMPLETED },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!batch) {
      return failure("Batch not found");
    }

    if (
      batch.currentStage !== BatchStage.GERMINATION &&
      batch.currentStage !== BatchStage.NURSERY
    ) {
      return validationError(
        "Destination can only be changed for batches in germination or nursery in V1",
      );
    }

    if (input.toDestination === batch.currentDestination) {
      return validationError("Destination is already set to this value");
    }

    const user = await tx.user.findFirst({
      where: { id: input.initiatedByUserId, active: true },
    });
    if (!user) {
      return validationError("User not found or inactive");
    }

    const task = batch.productionTasks[0];
    if (!task) {
      return failure("No completed production task found for this batch");
    }

    const occurredAt = new Date();
    const stage = batch.currentStage;
    const plannedQty = batch.originPlanItem.plannedQuantity;

    const event = await tx.productionEvent.create({
      data: {
        batchId: batch.id,
        productionTaskId: task.id,
        initiatedByUserId: input.initiatedByUserId,
        eventType: ProductionEventType.DESTINATION_CHANGED,
        plannedQuantitySnapshot: plannedQty,
        actualQuantity: plannedQty,
        quantityUom: PRODUCTION_UOM,
        stageBefore: stage,
        stageAfter: stage,
        occurredAt,
        destinationBefore: batch.currentDestination,
        destinationAfter: input.toDestination,
        changeReasonCode: input.reasonCode,
        changeExplanation: input.explanation?.trim() ?? null,
      },
    });

    await tx.batch.update({
      where: { id: batch.id },
      data: { currentDestination: input.toDestination },
    });

    return success({ productionEventId: event.id });
  });
}
