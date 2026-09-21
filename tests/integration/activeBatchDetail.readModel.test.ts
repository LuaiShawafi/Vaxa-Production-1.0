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
import { extendGermination } from "@/lib/domain/germination/extendGermination";
import { changeBatchDestination } from "@/lib/domain/batches/changeBatchDestination";
import { deriveExpectedNurseryCompletionAt } from "@/lib/domain/germination/germinationTimeline";
import { getActiveBatchDetail } from "@/lib/db/queries/activeBatches";
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
      "Run npm run db:import-master before active-batch detail integration tests",
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

describe.skipIf(!hasDb)("active batch detail read model", () => {
  it("resolves the same batch in GERMINATION then NURSERY with derived timing and history", async () => {
    const ctx = await germinatedBatch("2097-W11", 0, 28);
    const germDetail = await getActiveBatchDetail(ctx.batchId);
    expect(germDetail).not.toBeNull();
    expect(germDetail?.id).toBe(ctx.batchId);
    expect(germDetail?.currentStage).toBe(BatchStage.GERMINATION);
    expect(germDetail?.actualSeededQuantity).toBe("28");
    expect(germDetail?.quantityUom).toBe("trays");
    expect(germDetail?.productionFormat).toBe(ProductionFormat.PU);
    expect(germDetail?.currentDestination).toBe("402");
    expect(germDetail?.movedToNurseryAt).toBeNull();
    expect(germDetail?.expectedNurseryCompletionAt).toBeNull();
    expect(
      germDetail?.productionHistory.map((event) => event.eventType),
    ).toEqual([ProductionEventType.SEEDING_COMPLETED]);

    const extended = await extendGermination({
      batchId: ctx.batchId,
      initiatedByUserId: WORKER_ALEX,
      extension: { kind: "PLUS_2" },
    });
    expect(extended.ok).toBe(true);

    const moved = await moveToNursery({
      batchId: ctx.batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(moved.ok).toBe(true);

    const dest = await changeBatchDestination({
      batchId: ctx.batchId,
      toDestination: "406",
      initiatedByUserId: WORKER_ALEX,
      reasonCode: "test",
    });
    expect(dest.ok).toBe(true);

    const nurseryBatch = await prisma.batch.findUniqueOrThrow({
      where: { id: ctx.batchId },
    });
    const moveEvent = await prisma.productionEvent.findFirstOrThrow({
      where: {
        batchId: ctx.batchId,
        eventType: ProductionEventType.MOVED_TO_NURSERY,
      },
    });

    const nurseryDetail = await getActiveBatchDetail(ctx.batchId);
    expect(nurseryDetail).not.toBeNull();
    expect(nurseryDetail?.id).toBe(ctx.batchId);
    expect(nurseryDetail?.currentStage).toBe(BatchStage.NURSERY);
    expect(nurseryDetail?.currentDestination).toBe("406");
    expect(nurseryDetail?.originalAssignedDestination).toBe(
      nurseryBatch.originalAssignedDestination,
    );
    expect(nurseryDetail?.movedToNurseryAt).toEqual(moveEvent.occurredAt);
    expect(nurseryDetail?.expectedNurseryCompletionAt).toEqual(
      deriveExpectedNurseryCompletionAt(
        moveEvent.occurredAt,
        nurseryBatch.nurseryDaysSnapshot,
      ),
    );
    expect(nurseryDetail?.productionHistory.map((event) => event.eventType)).toEqual(
      [
        ProductionEventType.SEEDING_COMPLETED,
        ProductionEventType.GERMINATION_EXTENDED,
        ProductionEventType.MOVED_TO_NURSERY,
        ProductionEventType.DESTINATION_CHANGED,
      ],
    );

    const destinationEvent = nurseryDetail?.productionHistory.find(
      (event) => event.eventType === ProductionEventType.DESTINATION_CHANGED,
    );
    expect(destinationEvent).toMatchObject({
      fromDestination: "402",
      toDestination: "406",
      reasonCode: "test",
    });

    const moveHistory = nurseryDetail?.productionHistory.find(
      (event) => event.eventType === ProductionEventType.MOVED_TO_NURSERY,
    );
    expect(moveHistory).toMatchObject({
      stageBefore: BatchStage.GERMINATION,
      stageAfter: BatchStage.NURSERY,
    });
    expect(moveHistory).not.toHaveProperty("fromDestination");
  });

  it("returns null for unsupported stages and missing batches", async () => {
    const planned = await draftPlanWithItem(
      isoWeekWeekdaySections("2097-W12")[0]!.date,
      "402",
      10,
    );
    const harvested = await germinatedBatch("2097-W13", 0, 12);
    const inTransit = await germinatedBatch("2097-W14", 0, 13);
    const inPool = await germinatedBatch("2097-W15", 0, 14);

    await prisma.batch.update({
      where: { id: harvested.batchId },
      data: { currentStage: BatchStage.HARVESTED },
    });
    await prisma.batch.update({
      where: { id: inTransit.batchId },
      data: { currentStage: BatchStage.IN_TRANSIT },
    });
    await prisma.batch.update({
      where: { id: inPool.batchId },
      data: { currentStage: BatchStage.IN_POOL },
    });

    expect(await getActiveBatchDetail(planned.batchId)).toBeNull();
    expect(await getActiveBatchDetail(harvested.batchId)).toBeNull();
    expect(await getActiveBatchDetail(inTransit.batchId)).toBeNull();
    expect(await getActiveBatchDetail(inPool.batchId)).toBeNull();
    expect(
      await getActiveBatchDetail("00000000-0000-4000-8000-000000000099"),
    ).toBeNull();
  });

  it("loads the detail in a constant targeted query", async () => {
    const ctx = await germinatedBatch("2097-W16", 0, 18);
    await extendGermination({
      batchId: ctx.batchId,
      initiatedByUserId: WORKER_ALEX,
      extension: { kind: "PLUS_1" },
    });
    await moveToNursery({
      batchId: ctx.batchId,
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
    const detail = await getActiveBatchDetail(
      ctx.batchId,
      counted as unknown as typeof prisma,
    );
    const firstCount = queryCount;
    expect(detail?.currentStage).toBe(BatchStage.NURSERY);
    expect(firstCount).toBeGreaterThan(0);
    expect(firstCount).toBeLessThanOrEqual(3);

    queryCount = 0;
    await getActiveBatchDetail(
      ctx.batchId,
      counted as unknown as typeof prisma,
    );
    expect(queryCount).toBe(firstCount);
  });
});
