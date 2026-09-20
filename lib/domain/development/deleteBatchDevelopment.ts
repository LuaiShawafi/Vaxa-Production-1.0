import { prisma } from "@/lib/db/prisma";
import { failure, success, type ActionResult } from "@/lib/domain/results";
import { deleteBatchSubtree } from "@/lib/domain/development/deleteBatchSubtree";
import { assertDevDeletionEnabled } from "@/lib/domain/development/devDeletionGate";

export type DeleteBatchPreview = {
  batchId: string;
  visibleBatchNumber: string;
  currentStage: string;
  taskCount: number;
  eventCount: number;
};

export async function previewDeleteBatchDevelopment(
  batchId: string,
): Promise<ActionResult<DeleteBatchPreview>> {
  const gate = assertDevDeletionEnabled();
  if (gate) {
    return gate;
  }
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      productionTasks: { select: { id: true } },
      productionEvents: { select: { id: true } },
    },
  });
  if (!batch) {
    return failure("Batch not found");
  }
  return success({
    batchId: batch.id,
    visibleBatchNumber: batch.visibleBatchNumber,
    currentStage: batch.currentStage,
    taskCount: batch.productionTasks.length,
    eventCount: batch.productionEvents.length,
  });
}

export async function deleteBatchDevelopment(
  batchId: string,
): Promise<ActionResult<{ batchId: string }>> {
  const gate = assertDevDeletionEnabled();
  if (gate) {
    return gate;
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM batches WHERE id = ${batchId}::uuid FOR UPDATE`;
      const batch = await tx.batch.findUnique({ where: { id: batchId } });
      if (!batch) {
        throw new Error("NOT_FOUND");
      }
      await deleteBatchSubtree(tx, batchId);
    });
    return success({ batchId });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return failure("Batch not found");
    }
    throw error;
  }
}
