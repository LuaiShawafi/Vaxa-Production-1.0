import {
  BatchStage,
  ProductionEventType,
  ProductionTaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { PRODUCTION_UOM } from "@/lib/constants";
import {
  conflict,
  failure,
  success,
  validationError,
  type ActionResult,
} from "@/lib/domain/results";
import {
  isMovedToNurseryBatchUniqueViolation,
  isPrismaUniqueViolation,
} from "@/lib/domain/prismaErrors";
import type { MoveToNurseryInput } from "@/lib/validation/germination";
import { requireActiveTeam402Worker } from "@/lib/domain/germination/team402Worker";
import {
  deriveActualGerminationDays,
  deriveExpectedNurseryCompletionAt,
} from "@/lib/domain/germination/germinationTimeline";

export type MoveToNurseryOutcome = {
  productionEventId: string;
  batchId: string;
  actualGerminationDays: number;
  expectedNurseryCompletionAt: Date | null;
};

export async function moveToNursery(
  input: MoveToNurseryInput,
): Promise<ActionResult<MoveToNurseryOutcome>> {
  try {
    return await prisma.$transaction(async (tx) => {
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

      const existingMove = await tx.productionEvent.findFirst({
        where: {
          batchId: batch.id,
          eventType: ProductionEventType.MOVED_TO_NURSERY,
        },
      });
      if (existingMove) {
        return conflict("This batch has already been moved to nursery");
      }

      if (batch.currentStage !== BatchStage.GERMINATION) {
        return validationError(
          "Batch must be in germination to move to nursery",
        );
      }

      if (batch.germinationDaysSnapshot == null) {
        return failure("Germination days snapshot is missing on batch");
      }

      const seedingEvent = await tx.productionEvent.findFirst({
        where: {
          batchId: batch.id,
          eventType: ProductionEventType.SEEDING_COMPLETED,
        },
      });
      if (!seedingEvent) {
        return failure("Seeding must be completed before moving to nursery");
      }

      const task = batch.productionTasks[0];
      if (!task) {
        return failure("No completed production task found for this batch");
      }

      const occurredAt = new Date();
      const plannedQty = batch.originPlanItem.plannedQuantity;
      const actualQty = seedingEvent.actualQuantity;

      const event = await tx.productionEvent.create({
        data: {
          batchId: batch.id,
          productionTaskId: task.id,
          initiatedByUserId: input.initiatedByUserId,
          eventType: ProductionEventType.MOVED_TO_NURSERY,
          plannedQuantitySnapshot: plannedQty,
          actualQuantity: actualQty,
          quantityUom: PRODUCTION_UOM,
          stageBefore: BatchStage.GERMINATION,
          stageAfter: BatchStage.NURSERY,
          occurredAt,
          destinationBefore: null,
          destinationAfter: null,
        },
      });

      await tx.batch.update({
        where: { id: batch.id },
        data: { currentStage: BatchStage.NURSERY },
      });

      const actualGerminationDays = deriveActualGerminationDays(
        seedingEvent.occurredAt,
        occurredAt,
      );
      const expectedNurseryCompletionAt = deriveExpectedNurseryCompletionAt(
        occurredAt,
        batch.nurseryDaysSnapshot,
      );

      return success({
        productionEventId: event.id,
        batchId: batch.id,
        actualGerminationDays,
        expectedNurseryCompletionAt,
      });
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error) && isMovedToNurseryBatchUniqueViolation(error)) {
      return conflict("This batch has already been moved to nursery");
    }
    throw error;
  }
}
