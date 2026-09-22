import { describe, expect, it, afterEach, beforeAll } from "vitest";
import { requireSkuIdByCode } from "@/tests/helpers/devDb";
import { prisma } from "@/lib/db/prisma";
import {
  createPlanItem,
  createWeeklyPlan,
} from "@/lib/domain/planning/planMutations";
import { publishWeeklyPlan } from "@/lib/domain/planning/publishWeeklyPlan";
import { completeSeeding } from "@/lib/domain/seeding/completeSeeding";
import { startSeeding } from "@/lib/domain/seeding/startSeeding";
import { moveToNursery } from "@/lib/domain/germination/moveToNursery";
import { changeBatchDestination } from "@/lib/domain/batches/changeBatchDestination";
import { deriveExpectedNurseryCompletionAt } from "@/lib/domain/germination/germinationTimeline";
import { listActiveBatches } from "@/lib/db/queries/activeBatches";
import type { CompleteSeedingInput } from "@/lib/validation/seeding";
import { isoWeekStringFromCalendarDate, isoWeekWeekdaySections } from "@/lib/date";
import {
  BatchStage,
  ProductionEventType,
  ProductionFormat,
} from "@prisma/client";

const hasDb = Boolean(process.env.DATABASE_URL);
const TEAM_402 = "00000000-0000-4000-8000-000000000402";
const WORKER_ALEX = "00000000-0000-4000-8000-000000000410";
let SKU_RED: string;
let MAT_SUB: string;
let MAT_PUN: string;

const SEED_LOT_A = "00000000-0000-4000-8000-000000000701";
const MAT_LOT_SUB = "00000000-0000-4000-8000-000000000901";
const MAT_LOT_PUN = "00000000-0000-4000-8000-000000000902";

const planIds: string[] = [];

beforeAll(async () => {
  SKU_RED = await requireSkuIdByCode("PU_RED_RADISH");
  const sub = await prisma.material.findFirst({ where: { code: "RM-G-001" } });
  const pun = await prisma.material.findFirst({ where: { code: "RM-G-003" } });
  if (!sub || !pun) {
    throw new Error(
      "Run npm run db:import-master before active-batches integration tests",
    );
  }
  MAT_SUB = sub.id;
  MAT_PUN = pun.id;
});

afterEach(async () => {
  if (!hasDb) {
    return;
  }
  for (const planId of planIds.splice(0)) {
    const items = await prisma.planItem.findMany({ where: { planId } });
    for (const item of items) {
      const tasks = await prisma.productionTask.findMany({
        where: { planItemId: item.id },
      });
      for (const task of tasks) {
        const events = await prisma.productionEvent.findMany({
          where: { productionTaskId: task.id },
        });
        for (const ev of events) {
          await prisma.lotInventoryTransaction.deleteMany({
            where: { productionEventId: ev.id },
          });
          await prisma.deviation.deleteMany({
            where: { productionEventId: ev.id },
          });
          await prisma.eventLotAllocation.deleteMany({
            where: { eventId: ev.id },
          });
          await prisma.eventParticipant.deleteMany({
            where: { eventId: ev.id },
          });
        }
        await prisma.productionEvent.deleteMany({
          where: { productionTaskId: task.id },
        });
        await prisma.productionTask.deleteMany({ where: { id: task.id } });
      }
      await prisma.batch.deleteMany({ where: { originPlanItemId: item.id } });
    }
    await prisma.planItem.deleteMany({ where: { planId } });
    await prisma.weeklyPlan.deleteMany({ where: { id: planId } });
  }
});

async function draftPlanWithItem(
  plannedDate: Date,
  destination: "402" | "406",
  qty: number,
) {
  const week = isoWeekStringFromCalendarDate(plannedDate);
  const plan = await createWeeklyPlan(week);
  if (!plan.ok) {
    throw new Error(plan.message);
  }
  planIds.push(plan.data.id);
  const item = await createPlanItem({
    planId: plan.data.id,
    skuId: SKU_RED,
    assignedTeamId: TEAM_402,
    plannedDate,
    plannedQuantity: qty,
    destinationIdentity: destination,
  });
  if (!item.ok) {
    throw new Error(item.message);
  }
  const published = await publishWeeklyPlan(plan.data.id);
  if (!published.ok) {
    throw new Error(published.message);
  }
  const task = await prisma.productionTask.findFirst({
    where: { planItemId: item.data.id },
  });
  if (!task) {
    throw new Error("task missing after publish");
  }
  return {
    planId: plan.data.id,
    taskId: task.id,
    batchId: task.batchId,
    planItemId: item.data.id,
  };
}

function completePayload(taskId: string, qty: number): CompleteSeedingInput {
  return {
    productionTaskId: taskId,
    teamId: TEAM_402,
    actualQuantity: qty,
    participantUserIds: [WORKER_ALEX],
    seedLotAllocations: [
      {
        seedLotId: SEED_LOT_A,
        quantity: qty,
        quantityUom: "trays",
        changeFromPreselected: false,
      },
    ],
    materialLotAllocations: [
      {
        materialLotId: MAT_LOT_SUB,
        materialId: MAT_SUB,
        quantity: qty,
        quantityUom: "trays",
        changeFromPreselected: false,
      },
      {
        materialLotId: MAT_LOT_PUN,
        materialId: MAT_PUN,
        quantity: qty,
        quantityUom: "trays",
        changeFromPreselected: false,
      },
    ],
  };
}

async function germinatedBatch(week: string, weekdayIndex: number, qty: number) {
  const plannedDate = isoWeekWeekdaySections(week)[weekdayIndex]!.date;
  const ctx = await draftPlanWithItem(plannedDate, "402", qty);
  await startSeeding({
    productionTaskId: ctx.taskId,
    teamId: TEAM_402,
    workerUserId: WORKER_ALEX,
  });
  const completed = await completeSeeding(completePayload(ctx.taskId, qty));
  if (!completed.ok) {
    throw new Error(completed.message);
  }
  return ctx;
}

function ours<T extends { id: string }>(items: T[], ids: Set<string>) {
  return items.filter((item) => ids.has(item.id));
}

describe.skipIf(!hasDb)("active batches read model", () => {
  it("includes GERMINATION and NURSERY, grouped, and excludes PLANNED and HARVESTED", async () => {
    const planned = await draftPlanWithItem(
      isoWeekWeekdaySections("2097-W01")[0]!.date,
      "402",
      10,
    );
    const germ = await germinatedBatch("2097-W02", 0, 21);
    const nursery = await germinatedBatch("2097-W05", 0, 34);
    const harvested = await germinatedBatch("2097-W06", 0, 12);

    const moved = await moveToNursery({
      batchId: nursery.batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(moved.ok).toBe(true);

    await prisma.batch.update({
      where: { id: harvested.batchId },
      data: { currentStage: BatchStage.HARVESTED },
    });

    const dest = await changeBatchDestination({
      batchId: germ.batchId,
      toDestination: "406",
      initiatedByUserId: WORKER_ALEX,
      reasonCode: "test",
    });
    expect(dest.ok).toBe(true);

    const sku = await prisma.sku.findUniqueOrThrow({
      where: { id: SKU_RED },
      select: { code: true, description: true, productionFormat: true },
    });
    const germBatch = await prisma.batch.findUniqueOrThrow({
      where: { id: germ.batchId },
    });
    const nurseryBatch = await prisma.batch.findUniqueOrThrow({
      where: { id: nursery.batchId },
    });
    const seedingGerm = await prisma.productionEvent.findFirstOrThrow({
      where: {
        batchId: germ.batchId,
        eventType: ProductionEventType.SEEDING_COMPLETED,
      },
    });
    const seedingNursery = await prisma.productionEvent.findFirstOrThrow({
      where: {
        batchId: nursery.batchId,
        eventType: ProductionEventType.SEEDING_COMPLETED,
      },
    });
    const moveEvent = await prisma.productionEvent.findFirstOrThrow({
      where: {
        batchId: nursery.batchId,
        eventType: ProductionEventType.MOVED_TO_NURSERY,
      },
    });

    const createdIds = new Set([
      planned.batchId,
      germ.batchId,
      nursery.batchId,
      harvested.batchId,
    ]);
    const model = await listActiveBatches();
    const germination = ours(model.germination, createdIds);
    const nurseryRows = ours(model.nursery, createdIds);

    expect(germination.map((b) => b.id)).toEqual([germ.batchId]);
    expect(nurseryRows.map((b) => b.id)).toEqual([nursery.batchId]);
    expect(model.germination.some((b) => b.id === planned.batchId)).toBe(false);
    expect(model.nursery.some((b) => b.id === planned.batchId)).toBe(false);
    expect(model.germination.some((b) => b.id === harvested.batchId)).toBe(
      false,
    );
    expect(model.nursery.some((b) => b.id === harvested.batchId)).toBe(false);

    const germRow = germination[0]!;
    expect(germRow.visibleBatchNumber).toBe(germBatch.visibleBatchNumber);
    expect(germRow.skuCode).toBe(sku.code);
    expect(germRow.skuDescription).toBe(sku.description);
    expect(germRow.productionFormat).toBe(ProductionFormat.PU);
    expect(germRow.productionFormat).toBe(sku.productionFormat);
    expect(germRow.currentStage).toBe(BatchStage.GERMINATION);
    expect(germRow.currentDestination).toBe("406");
    expect(germRow.originalAssignedDestination).toBe(
      germBatch.originalAssignedDestination,
    );
    expect(germRow.actualSeededQuantity).toBe(
      seedingGerm.actualQuantity.toString(),
    );
    expect(germRow.quantityUom).toBe(seedingGerm.quantityUom);
    expect(germRow.seededAt).toEqual(seedingGerm.occurredAt);
    expect(germRow.expectedGerminationAt).toEqual(
      germBatch.expectedGerminationAt,
    );
    expect(germRow.germinationDaysSnapshot).toBe(
      germBatch.germinationDaysSnapshot,
    );
    expect(germRow.nurseryDaysSnapshot).toBe(germBatch.nurseryDaysSnapshot);
    expect(germRow.movedToNurseryAt).toBeNull();
    expect(germRow.expectedNurseryCompletionAt).toBeNull();

    const nurseryRow = nurseryRows[0]!;
    expect(nurseryRow.currentStage).toBe(BatchStage.NURSERY);
    expect(nurseryRow.currentDestination).toBe(
      nurseryBatch.currentDestination,
    );
    expect(nurseryRow.originalAssignedDestination).toBe(
      nurseryBatch.originalAssignedDestination,
    );
    expect(nurseryRow.actualSeededQuantity).toBe(
      seedingNursery.actualQuantity.toString(),
    );
    expect(nurseryRow.seededAt).toEqual(seedingNursery.occurredAt);
    expect(nurseryRow.movedToNurseryAt).toEqual(moveEvent.occurredAt);
    expect(nurseryRow.expectedNurseryCompletionAt).toEqual(
      deriveExpectedNurseryCompletionAt(
        moveEvent.occurredAt,
        nurseryBatch.nurseryDaysSnapshot,
      ),
    );
    expect(nurseryRow.germinationDaysSnapshot).toBe(
      nurseryBatch.germinationDaysSnapshot,
    );
    expect(nurseryRow.nurseryDaysSnapshot).toBe(
      nurseryBatch.nurseryDaysSnapshot,
    );
  });

  it("returns empty own groups when only non-active stages exist", async () => {
    const planned = await draftPlanWithItem(
      isoWeekWeekdaySections("2097-W03")[0]!.date,
      "402",
      8,
    );
    const harvested = await germinatedBatch("2097-W07", 0, 9);
    await prisma.batch.update({
      where: { id: harvested.batchId },
      data: { currentStage: BatchStage.HARVESTED },
    });

    const createdIds = new Set([planned.batchId, harvested.batchId]);
    const model = await listActiveBatches();
    expect(ours(model.germination, createdIds)).toEqual([]);
    expect(ours(model.nursery, createdIds)).toEqual([]);
  });

  it("loads SKU and targeted events in a constant number of queries", async () => {
    const a = await germinatedBatch("2097-W04", 0, 15);
    const b = await germinatedBatch("2097-W08", 0, 16);
    await moveToNursery({
      batchId: b.batchId,
      initiatedByUserId: WORKER_ALEX,
    });

    let queryCount = 0;
    const counted = prisma.$extends({
      query: {
        async $allOperations({ args, query }) {
          queryCount += 1;
          return query(args);
        },
      },
    });

    queryCount = 0;
    const model = await listActiveBatches(
      counted as unknown as typeof prisma,
    );
    const firstCount = queryCount;
    expect(firstCount).toBeGreaterThan(0);
    expect(firstCount).toBeLessThanOrEqual(3);

    const createdIds = new Set([a.batchId, b.batchId]);
    expect(ours(model.germination, createdIds)).toHaveLength(1);
    expect(ours(model.nursery, createdIds)).toHaveLength(1);

    const extra = await germinatedBatch("2097-W09", 0, 17);
    queryCount = 0;
    const again = await listActiveBatches(
      counted as unknown as typeof prisma,
    );
    expect(queryCount).toBe(firstCount);
    expect(ours(again.germination, new Set([...createdIds, extra.batchId]))).toHaveLength(
      2,
    );
  });
});
