import {
  BatchStage,
  LotInventoryTransactionType,
  LotKind,
  ProductionEventType,
  ProductionTaskStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  lockLots,
  prepareSeedingConsumptions,
} from "@/lib/domain/inventory/prepareSeedingConsumptions";
import { prisma } from "@/lib/db/prisma";
import { PRODUCTION_UOM } from "@/lib/constants";
import { expectedDateFromOperationalBase } from "@/lib/date";
import {
  conflict,
  failure,
  success,
  validationError,
  type ActionResult,
} from "@/lib/domain/results";
import {
  isPrismaUniqueViolation,
  isSeedingBatchUniqueViolation,
  isSeedingTaskUniqueViolation,
} from "@/lib/domain/prismaErrors";
import type { CompleteSeedingInput } from "@/lib/validation/seeding";
import {
  bomSnapshotSchema,
  quantitiesEqual,
} from "@/lib/validation/seeding";

export type CompleteSeedingOutcome = {
  productionEventId: string;
  productionTaskId: string;
  batchId: string;
  idempotent: boolean;
};

async function findSeedingEventForTask(
  tx: Prisma.TransactionClient,
  taskId: string,
) {
  return tx.productionEvent.findFirst({
    where: {
      productionTaskId: taskId,
      eventType: ProductionEventType.SEEDING_COMPLETED,
    },
  });
}

async function findSeedingEventForBatch(
  tx: Prisma.TransactionClient,
  batchId: string,
) {
  return tx.productionEvent.findFirst({
    where: {
      batchId,
      eventType: ProductionEventType.SEEDING_COMPLETED,
    },
  });
}

export async function completeSeeding(
  input: CompleteSeedingInput,
): Promise<ActionResult<CompleteSeedingOutcome>> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM production_tasks WHERE id = ${input.productionTaskId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM batches WHERE id IN (SELECT batch_id FROM production_tasks WHERE id = ${input.productionTaskId}::uuid) FOR UPDATE`;

      const existingForTask = await findSeedingEventForTask(
        tx,
        input.productionTaskId,
      );
      if (existingForTask) {
        return success({
          productionEventId: existingForTask.id,
          productionTaskId: input.productionTaskId,
          batchId: existingForTask.batchId,
          idempotent: true,
        });
      }

      const task = await tx.productionTask.findUnique({
        where: { id: input.productionTaskId },
        include: {
          batch: true,
          planItem: { include: { sku: true } },
        },
      });

      if (!task) {
        return failure("Production task not found");
      }

      if (task.assignedTeamId !== input.teamId) {
        return validationError("Task is not assigned to this team");
      }

      if (task.status === ProductionTaskStatus.COMPLETED) {
        const ev = await findSeedingEventForTask(tx, task.id);
        if (ev) {
          return success({
            productionEventId: ev.id,
            productionTaskId: task.id,
            batchId: task.batchId,
            idempotent: true,
          });
        }
        return conflict("Task is completed but no seeding event was found");
      }

      if (task.status !== ProductionTaskStatus.IN_PROGRESS || !task.starterUserId) {
        return validationError("Task must be in progress with a starter");
      }

      if (task.batch.currentStage !== BatchStage.PLANNED) {
        const batchEvent = await findSeedingEventForBatch(tx, task.batchId);
        if (batchEvent && batchEvent.productionTaskId !== task.id) {
          return conflict(
            "This batch was already seeded by another production task",
          );
        }
        if (batchEvent) {
          return success({
            productionEventId: batchEvent.id,
            productionTaskId: task.id,
            batchId: task.batchId,
            idempotent: true,
          });
        }
        return conflict("Batch is not in PLANNED stage");
      }

      const batchEventCheck = await findSeedingEventForBatch(tx, task.batchId);
      if (batchEventCheck) {
        if (batchEventCheck.productionTaskId !== task.id) {
          return conflict(
            "This batch was already seeded by another production task",
          );
        }
        return success({
          productionEventId: batchEventCheck.id,
          productionTaskId: task.id,
          batchId: task.batchId,
          idempotent: true,
        });
      }

      const plannedQty = Number(task.planItem.plannedQuantity);
      const actualQty = input.actualQuantity;

      const participantIds = new Set(input.participantUserIds);
      participantIds.add(task.starterUserId);

      for (const userId of participantIds) {
        const membership = await tx.userTeam.findFirst({
          where: {
            userId,
            teamId: task.assignedTeamId,
            active: true,
            user: { active: true },
          },
        });
        if (!membership) {
          return validationError(
            "All participants must be active members of the task team",
          );
        }
      }

      for (const alloc of input.seedLotAllocations) {
        if (alloc.quantityUom !== PRODUCTION_UOM) {
          return validationError("Seed allocations must use trays");
        }
      }
      for (const alloc of input.materialLotAllocations) {
        if (alloc.quantityUom !== PRODUCTION_UOM) {
          return validationError("Material allocations must use trays");
        }
      }

      const bomParsed = bomSnapshotSchema.safeParse(task.batch.bomSnapshot);
      if (!bomParsed.success) {
        return failure("Batch BOM snapshot is missing or invalid");
      }

      const sku = task.planItem.sku;
      const prepared = await prepareSeedingConsumptions(
        tx,
        {
          actualQuantity: actualQty,
          seedLotAllocations: input.seedLotAllocations,
          materialLotAllocations: input.materialLotAllocations,
        },
        bomParsed.data,
        sku.productionFormat,
        sku.code,
      );
      if (!prepared.ok) {
        return validationError(prepared.message);
      }

      await lockLots(
        tx,
        prepared.lotIdsToLock.seed,
        prepared.lotIdsToLock.material,
      );

      const needsDeviation = !quantitiesEqual(plannedQty, actualQty);
      if (needsDeviation && !input.deviationReason) {
        return validationError(
          "Deviation reason is required when actual quantity differs from plan",
        );
      }
      if (!needsDeviation && input.deviationReason) {
        return validationError(
          "Deviation reason must not be provided when quantity matches plan",
        );
      }

      const occurredAt = new Date();
      const germDays = task.batch.germinationDaysSnapshot;
      if (germDays == null) {
        return failure("Germination days snapshot is missing on batch");
      }
      const expectedGerminationAt = expectedDateFromOperationalBase(
        occurredAt,
        germDays,
      );

      const event = await tx.productionEvent.create({
        data: {
          batchId: task.batchId,
          productionTaskId: task.id,
          initiatedByUserId: task.starterUserId,
          eventType: ProductionEventType.SEEDING_COMPLETED,
          plannedQuantitySnapshot: task.planItem.plannedQuantity,
          actualQuantity: actualQty,
          quantityUom: PRODUCTION_UOM,
          stageBefore: BatchStage.PLANNED,
          stageAfter: BatchStage.GERMINATION,
          occurredAt,
        },
      });

      for (const userId of participantIds) {
        await tx.eventParticipant.create({
          data: { eventId: event.id, userId },
        });
      }

      for (const alloc of prepared.allocations) {
        const allocation = await tx.eventLotAllocation.create({
          data: {
            eventId: event.id,
            seedLotId: alloc.seedLotId ?? null,
            materialLotId: alloc.materialLotId ?? null,
            bomLineKey: alloc.bomLineKey,
            quantity: alloc.trays,
            quantityUom: PRODUCTION_UOM,
            consumedQuantity: alloc.consumedQuantity,
            consumedUom: alloc.consumedUom,
            changeFromPreselected: alloc.changeFromPreselected,
            changeReason: alloc.changeReason ?? null,
            notes: alloc.notes ?? null,
          },
        });

        const isSeed = Boolean(alloc.seedLotId);
        await tx.lotInventoryTransaction.create({
          data: {
            lotKind: isSeed ? LotKind.SEED : LotKind.MATERIAL,
            seedLotId: alloc.seedLotId ?? null,
            materialLotId: alloc.materialLotId ?? null,
            transactionType: LotInventoryTransactionType.PRODUCTION_CONSUMPTION,
            quantityDelta: alloc.consumedQuantity.negated(),
            unitOfMeasure: alloc.consumedUom,
            productionEventId: event.id,
            eventLotAllocationId: allocation.id,
            createdByUserId: task.starterUserId,
          },
        });
      }

      if (needsDeviation && input.deviationReason) {
        await tx.deviation.create({
          data: {
            productionEventId: event.id,
            reasonCode: input.deviationReason,
            explanation: input.deviationExplanation ?? null,
          },
        });
      }

      await tx.productionTask.update({
        where: { id: task.id },
        data: {
          status: ProductionTaskStatus.COMPLETED,
          completedAt: occurredAt,
        },
      });

      await tx.batch.update({
        where: { id: task.batchId },
        data: {
          currentStage: BatchStage.GERMINATION,
          expectedGerminationAt,
        },
      });

      return success({
        productionEventId: event.id,
        productionTaskId: task.id,
        batchId: task.batchId,
        idempotent: false,
      });
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      if (isSeedingTaskUniqueViolation(error)) {
        const ev = await findSeedingEventForTask(
          prisma,
          input.productionTaskId,
        );
        if (ev) {
          return success({
            productionEventId: ev.id,
            productionTaskId: input.productionTaskId,
            batchId: ev.batchId,
            idempotent: true,
          });
        }
      }
      if (isSeedingBatchUniqueViolation(error)) {
        const task = await prisma.productionTask.findUnique({
          where: { id: input.productionTaskId },
        });
        if (task) {
          const ev = await findSeedingEventForBatch(prisma, task.batchId);
          if (ev && ev.productionTaskId !== input.productionTaskId) {
            return conflict(
              "This batch was already seeded by another production task",
            );
          }
          if (ev) {
            return success({
              productionEventId: ev.id,
              productionTaskId: input.productionTaskId,
              batchId: ev.batchId,
              idempotent: true,
            });
          }
        }
      }
    }
    throw error;
  }
}
