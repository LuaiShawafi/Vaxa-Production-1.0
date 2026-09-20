import {
  BatchStage,
  ProductionEventType,
  ProductionTaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  conflict,
  failure,
  success,
  validationError,
  type ActionResult,
} from "@/lib/domain/results";
import type { StartSeedingInput } from "@/lib/validation/seeding";
import {
  buildBomSnapshot,
  buildPreselectedLotsForSku,
} from "@/lib/domain/seeding/preselectedLots";
import { bomSnapshotSchema } from "@/lib/validation/seeding";

export type StartSeedingOutcome =
  | { status: "started"; productionTaskId: string }
  | { status: "already_started_by_you"; productionTaskId: string };

export async function startSeeding(
  input: StartSeedingInput,
): Promise<ActionResult<StartSeedingOutcome>> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM production_tasks WHERE id = ${input.productionTaskId}::uuid FOR UPDATE`;

    const task = await tx.productionTask.findUnique({
      where: { id: input.productionTaskId },
      include: {
        batch: true,
        starterUser: { select: { id: true, name: true } },
        planItem: { include: { sku: true } },
      },
    });

    if (!task) {
      return failure("Production task not found");
    }

    if (task.assignedTeamId !== input.teamId) {
      return validationError("Task is not assigned to this team");
    }

    const existingEvent = await tx.productionEvent.findFirst({
      where: {
        batchId: task.batchId,
        eventType: ProductionEventType.SEEDING_COMPLETED,
      },
    });
    if (existingEvent) {
      return conflict("This batch has already been seeded");
    }

    if (task.status === ProductionTaskStatus.IN_PROGRESS) {
      if (task.starterUserId === input.workerUserId) {
        return success({
          status: "already_started_by_you",
          productionTaskId: task.id,
        });
      }
      return conflict("Task is already in progress", {
        productionTaskId: task.id,
        starterName: task.starterUser?.name ?? "Another worker",
        startedAt: task.startedAt ?? new Date(),
      });
    }

    if (task.status !== ProductionTaskStatus.OPEN) {
      return conflict("Task cannot be started in its current state");
    }

    if (task.batch.currentStage !== BatchStage.PLANNED) {
      return conflict("Batch is not in PLANNED stage");
    }

    const membership = await tx.userTeam.findFirst({
      where: {
        userId: input.workerUserId,
        teamId: task.assignedTeamId,
        active: true,
        user: { active: true },
      },
      include: { user: true },
    });
    if (!membership) {
      return validationError("Worker is not an active member of this team");
    }

    const bom = await tx.bom.findFirst({
      where: { skuId: task.planItem.skuId, type: "PROD", active: true },
    });
    if (!bom) {
      return validationError("No active PROD BOM configured for this SKU");
    }
    if (!bom.ready) {
      return validationError("PROD BOM is not ready — production is blocked");
    }

    const sku = task.planItem.sku;
    const bomSnapshot = await buildBomSnapshot(tx, sku.id);
    const parsedBom = bomSnapshotSchema.safeParse(bomSnapshot);
    if (!parsedBom.success) {
      return failure("Failed to build BOM snapshot");
    }

    const preselectedLots = await buildPreselectedLotsForSku(tx, sku.id);
    const now = new Date();
    const dtm =
      sku.germinationDays + (sku.nurseryDays ?? 0) + sku.growingDays;

    await tx.productionTask.update({
      where: { id: task.id },
      data: {
        starterUserId: input.workerUserId,
        status: ProductionTaskStatus.IN_PROGRESS,
        startedAt: now,
        preselectedLots,
      },
    });

    await tx.batch.update({
      where: { id: task.batchId },
      data: {
        officialIdentityLockedAt: now,
        currentDestination: task.planItem.destinationIdentity,
        germinationDaysSnapshot: sku.germinationDays,
        nurseryDaysSnapshot: sku.nurseryDays,
        growingDaysSnapshot: sku.growingDays,
        dtmDaysSnapshot: dtm,
        bomSnapshot: parsedBom.data,
      },
    });

    return success({
      status: "started",
      productionTaskId: task.id,
    });
  });
}
