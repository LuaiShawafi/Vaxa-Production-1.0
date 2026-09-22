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
import {
  deriveActualGerminationDays,
  deriveExpectedNurseryCompletionAt,
} from "@/lib/domain/germination/germinationTimeline";
import type { CompleteSeedingInput } from "@/lib/validation/seeding";
import { isoWeekStringFromCalendarDate, isoWeekWeekdaySections } from "@/lib/date";
import { BatchStage, ProductionEventType } from "@prisma/client";

const hasDb = Boolean(process.env.DATABASE_URL);
const TEAM_402 = "00000000-0000-4000-8000-000000000402";
const WORKER_ALEX = "00000000-0000-4000-8000-000000000410";
const WORKER_ELENA = "00000000-0000-4000-8000-000000000411";
let SKU_RED: string;
let MAT_SUB: string;
let MAT_PUN: string;

const SEED_LOT_A = "00000000-0000-4000-8000-000000000701";
const MAT_LOT_SUB = "00000000-0000-4000-8000-000000000901";
const MAT_LOT_PUN = "00000000-0000-4000-8000-000000000902";

const planIds: string[] = [];
const extraUserIds: string[] = [];

beforeAll(async () => {
  SKU_RED = await requireSkuIdByCode("PU_RED_RADISH");
  const sub = await prisma.material.findFirst({ where: { code: "RM-G-001" } });
  const pun = await prisma.material.findFirst({ where: { code: "RM-G-003" } });
  if (!sub || !pun) {
    throw new Error("Run npm run db:import-master before germination integration tests");
  }
  MAT_SUB = sub.id;
  MAT_PUN = pun.id;
});

afterEach(async () => {
  if (!hasDb) {
    return;
  }
  for (const userId of extraUserIds.splice(0)) {
    await prisma.userTeam.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
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

async function germinatedBatch(week: string, weekdayIndex: number, qty = 35) {
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
  const batch = await prisma.batch.findUnique({ where: { id: ctx.batchId } });
  const planItem = await prisma.planItem.findUnique({
    where: { id: ctx.planItemId },
  });
  const seedingEvent = await prisma.productionEvent.findFirst({
    where: {
      batchId: ctx.batchId,
      eventType: ProductionEventType.SEEDING_COMPLETED,
    },
  });
  return { ...ctx, batch, planItem, seedingEvent, completed };
}

describe.skipIf(!hasDb)("germination lifecycle", () => {
  it("moves germination to nursery with audit event and derived nursery expectation", async () => {
    const { batchId, batch, planItem, seedingEvent } = await germinatedBatch(
      "2099-W40",
      0,
    );
    const beforeDest = batch!.currentDestination;
    const beforeNumber = batch!.visibleBatchNumber;
    const snapshots = {
      germinationDaysSnapshot: batch!.germinationDaysSnapshot,
      nurseryDaysSnapshot: batch!.nurseryDaysSnapshot,
      growingDaysSnapshot: batch!.growingDaysSnapshot,
      dtmDaysSnapshot: batch!.dtmDaysSnapshot,
    };

    const moved = await moveToNursery({
      batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) {
      return;
    }

    const event = await prisma.productionEvent.findUnique({
      where: { id: moved.data.productionEventId },
    });
    expect(event?.eventType).toBe(ProductionEventType.MOVED_TO_NURSERY);
    expect(event?.stageBefore).toBe(BatchStage.GERMINATION);
    expect(event?.stageAfter).toBe(BatchStage.NURSERY);
    expect(event?.initiatedByUserId).toBe(WORKER_ALEX);
    expect(event?.destinationBefore).toBeNull();
    expect(event?.destinationAfter).toBeNull();
    expect(event?.plannedQuantitySnapshot.toString()).toBe(
      planItem!.plannedQuantity.toString(),
    );
    expect(event?.actualQuantity.toString()).toBe(
      seedingEvent!.actualQuantity.toString(),
    );

    const after = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(after?.currentStage).toBe(BatchStage.NURSERY);
    expect(after?.currentDestination).toBe(beforeDest);
    expect(after?.originalAssignedDestination).toBe(
      batch!.originalAssignedDestination,
    );
    expect(after?.visibleBatchNumber).toBe(beforeNumber);
    expect(after?.germinationDaysSnapshot).toBe(snapshots.germinationDaysSnapshot);
    expect(after?.nurseryDaysSnapshot).toBe(snapshots.nurseryDaysSnapshot);
    expect(after?.growingDaysSnapshot).toBe(snapshots.growingDaysSnapshot);
    expect(after?.dtmDaysSnapshot).toBe(snapshots.dtmDaysSnapshot);

    if (after?.nurseryDaysSnapshot != null) {
      expect(moved.data.expectedNurseryCompletionAt).toEqual(
        deriveExpectedNurseryCompletionAt(
          event!.occurredAt,
          after.nurseryDaysSnapshot,
        ),
      );
    }
  });

  it("allows move when nurseryDaysSnapshot is null", async () => {
    const { batchId } = await germinatedBatch("2099-W40", 1);
    await prisma.batch.update({
      where: { id: batchId },
      data: { nurseryDaysSnapshot: null },
    });
    const moved = await moveToNursery({
      batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(moved.ok).toBe(true);
    if (moved.ok) {
      expect(moved.data.expectedNurseryCompletionAt).toBeNull();
    }
  });

  it("rejects invalid moves and duplicate nursery transition", async () => {
    const plannedDate = isoWeekWeekdaySections("2099-W50")[0]!.date;
    const plannedOnly = await draftPlanWithItem(plannedDate, "402", 35);
    const fromPlanned = await moveToNursery({
      batchId: plannedOnly.batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(fromPlanned.ok).toBe(false);

    const { batchId } = await germinatedBatch("2099-W51", 0);
    const first = await moveToNursery({
      batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(first.ok).toBe(true);
    const second = await moveToNursery({
      batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(second.ok).toBe(false);
    if (second.ok) {
      return;
    }
    expect(second.kind).toBe("conflict");
    const count = await prisma.productionEvent.count({
      where: { batchId, eventType: ProductionEventType.MOVED_TO_NURSERY },
    });
    expect(count).toBe(1);
  });

  it("rejects non-402 workers", async () => {
    const { batchId } = await germinatedBatch("2099-W41", 2);
    const outsider = await prisma.user.create({
      data: { name: "Outside Worker", active: true },
    });
    extraUserIds.push(outsider.id);
    const result = await moveToNursery({
      batchId,
      initiatedByUserId: outsider.id,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("validation_error");
    }
  });

  it("extends germination and still allows move to nursery", async () => {
    const { batchId, batch } = await germinatedBatch("2099-W42", 0);
    const beforeDtm = batch!.dtmDaysSnapshot;
    const beforeExpected = batch!.expectedGerminationAt;

    const ext1 = await extendGermination({
      batchId,
      initiatedByUserId: WORKER_ALEX,
      extension: { kind: "PLUS_1" },
    });
    expect(ext1.ok).toBe(true);

    const ext2 = await extendGermination({
      batchId,
      initiatedByUserId: WORKER_ELENA,
      extension: { kind: "CUSTOM", customDays: 2 },
    });
    expect(ext2.ok).toBe(true);

    const afterExtend = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(afterExtend?.currentStage).toBe(BatchStage.GERMINATION);
    expect(afterExtend?.dtmDaysSnapshot).toBe(beforeDtm);
    expect(afterExtend?.expectedGerminationAt?.getTime()).toBeGreaterThan(
      beforeExpected!.getTime(),
    );

    const extensionEvents = await prisma.productionEvent.findMany({
      where: { batchId, eventType: ProductionEventType.GERMINATION_EXTENDED },
    });
    expect(extensionEvents.length).toBe(2);
    expect(extensionEvents[0]?.stageBefore).toBe(BatchStage.GERMINATION);
    expect(extensionEvents[0]?.stageAfter).toBe(BatchStage.GERMINATION);

    const moved = await moveToNursery({
      batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(moved.ok).toBe(true);
  });

  it("derives actual germination days from seeding completion, not extended expected date", async () => {
    const { batchId, seedingEvent } = await germinatedBatch("2099-W42", 1);
    await extendGermination({
      batchId,
      initiatedByUserId: WORKER_ALEX,
      extension: { kind: "PLUS_3" },
    });
    const moved = await moveToNursery({
      batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok || !seedingEvent) {
      return;
    }
    const moveEvent = await prisma.productionEvent.findFirst({
      where: { batchId, eventType: ProductionEventType.MOVED_TO_NURSERY },
    });
    expect(moved.data.actualGerminationDays).toBe(
      deriveActualGerminationDays(
        seedingEvent.occurredAt,
        moveEvent!.occurredAt,
      ),
    );
    expect(moved.data.actualGerminationDays).toBeLessThan(3);
  });

  it("allows destination change in germination and nursery", async () => {
    const { batchId } = await germinatedBatch("2099-W43", 0);
    const inGerm = await changeBatchDestination({
      batchId,
      toDestination: "406",
      initiatedByUserId: WORKER_ALEX,
      reasonCode: "test",
    });
    expect(inGerm.ok).toBe(true);

    const moved = await moveToNursery({
      batchId,
      initiatedByUserId: WORKER_ALEX,
    });
    expect(moved.ok).toBe(true);

    const inNursery = await changeBatchDestination({
      batchId,
      toDestination: "408",
      initiatedByUserId: WORKER_ALEX,
      reasonCode: "capacity",
    });
    expect(inNursery.ok).toBe(true);
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    expect(batch?.currentDestination).toBe("408");
  });
});
