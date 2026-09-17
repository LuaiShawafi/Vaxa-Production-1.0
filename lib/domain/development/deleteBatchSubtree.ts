import type { Prisma } from "@prisma/client";

/** Deletes production history for one batch. Caller must own the transaction. */
export async function deleteBatchSubtree(
  tx: Prisma.TransactionClient,
  batchId: string,
): Promise<void> {
  const tasks = await tx.productionTask.findMany({
    where: { batchId },
    select: { id: true },
  });
  const taskIds = tasks.map((t) => t.id);

  if (taskIds.length > 0) {
    const events = await tx.productionEvent.findMany({
      where: { batchId },
      select: { id: true },
    });
    const eventIds = events.map((e) => e.id);
    if (eventIds.length > 0) {
      await tx.productionEvent.deleteMany({ where: { id: { in: eventIds } } });
    }
    await tx.productionTask.deleteMany({ where: { id: { in: taskIds } } });
  }

  await tx.batch.delete({ where: { id: batchId } });
}
