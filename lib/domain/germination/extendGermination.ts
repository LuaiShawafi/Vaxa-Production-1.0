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
import type { ExtendGerminationInput } from "@/lib/validation/germination";
import {
  extensionDaysFromInput,
  germinationExtensionExplanation,
  germinationExtensionReasonCode,
} from "@/lib/validation/germination";
import { requireActiveTeam402Worker } from "@/lib/domain/germination/team402Worker";
import { extendExpectedGerminationAt } from "@/lib/domain/germination/germinationTimeline";

export type ExtendGerminationOutcome = {
  productionEventId: string;
  batchId: string;
  expectedGerminationAt: Date;
};

export async function extendGermination(
  input: ExtendGerminationInput,
): Promise<ActionResult<ExtendGerminationOutcome>> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM batches WHERE id = ${input.batchId}::uuid FOR UPDATE`;

    const workerError = await requireActiveTeam402Worker(
      tx,
      input.initiatedByUserId,
    );
    if (workerError) {
      return workerError;
    }

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

    if (batch.currentStage !== BatchStage.GERMINATION) {
      return validationError("Germination can only be extended in germination");
    }

    if (!batch.expectedGerminationAt) {
      return failure("Expected germination date is not set on batch");
    }

    const seedingEvent = await tx.productionEvent.findFirst({
      where: {
        batchId: batch.id,
        eventType: ProductionEventType.SEEDING_COMPLETED,
      },
    });
    if (!seedingEvent) {
      return failure("Seeding must be completed before extending germination");
    }

    const task = batch.productionTasks[0];
    if (!task) {
      return failure("No completed production task found for this batch");
    }

    const extensionDays = extensionDaysFromInput(input.extension);
    const newExpectedGerminationAt = extendExpectedGerminationAt(
      batch.expectedGerminationAt,
      extensionDays,
    );
    const occurredAt = new Date();

    const event = await tx.productionEvent.create({
      data: {
        batchId: batch.id,
        productionTaskId: task.id,
        initiatedByUserId: input.initiatedByUserId,
        eventType: ProductionEventType.GERMINATION_EXTENDED,
        plannedQuantitySnapshot: batch.originPlanItem.plannedQuantity,
        actualQuantity: seedingEvent.actualQuantity,
        quantityUom: PRODUCTION_UOM,
        stageBefore: BatchStage.GERMINATION,
        stageAfter: BatchStage.GERMINATION,
        occurredAt,
        destinationBefore: null,
        destinationAfter: null,
        changeReasonCode: germinationExtensionReasonCode(input.extension),
        changeExplanation: germinationExtensionExplanation(input.extension),
      },
    });

    await tx.batch.update({
      where: { id: batch.id },
      data: { expectedGerminationAt: newExpectedGerminationAt },
    });

    return success({
      productionEventId: event.id,
      batchId: batch.id,
      expectedGerminationAt: newExpectedGerminationAt,
    });
  });
}
