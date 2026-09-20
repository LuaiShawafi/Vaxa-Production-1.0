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
import type { CompleteSeedingInput } from "@/lib/validation/seeding";
import { isoWeekStringFromCalendarDate, isoWeekWeekdaySections } from "@/lib/date";
import { deriveVisibleBatchNumber } from "@/lib/domain/batchNumber";
import { LotInventoryTransactionType, ProductionFormat } from "@prisma/client";
import { Prisma } from "@prisma/client";

const hasDb = Boolean(process.env.DATABASE_URL);
const TEAM_402 = "00000000-0000-4000-8000-000000000402";
const WORKER_ALEX = "00000000-0000-4000-8000-000000000410";
const WORKER_ELENA = "00000000-0000-4000-8000-000000000411";
let SKU_RED: string;
let MAT_SUB: string;
let MAT_PUN: string;

beforeAll(async () => {
  SKU_RED = await requireSkuIdByCode("PU_RED_RADISH");
  const sub = await prisma.material.findFirst({ where: { code: "RM-G-001" } });
  const pun = await prisma.material.findFirst({ where: { code: "RM-G-003" } });
  if (!sub || !pun) {
    throw new Error("Run npm run db:import-master before seeding integration tests");
  }
  MAT_SUB = sub.id;
  MAT_PUN = pun.id;
});
const SEED_LOT_A = "00000000-0000-4000-8000-000000000701";
const SEED_LOT_B = "00000000-0000-4000-8000-000000000702";
const MAT_LOT_SUB = "00000000-0000-4000-8000-000000000901";
const MAT_LOT_PUN = "00000000-0000-4000-8000-000000000902";

const planIds: string[] = [];

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
  destination: "402" | "406" | "408" | "410" | "412" | "414" | "416" | "418" | "420" | "422",
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
  return { planId: plan.data.id, taskId: task.id, batchId: task.batchId };
}

function materialAllocations(
  qty: number,
): CompleteSeedingInput["materialLotAllocations"] {
  return [
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
  ];
}

describe.skipIf(!hasDb)("planning publish", () => {
  it("materializes batch and task", async () => {
    const date = isoWeekWeekdaySections("2099-W24")[2]!.date;
    const { taskId } = await draftPlanWithItem(date, "406", 35);
    const task = await prisma.productionTask.findUnique({
      where: { id: taskId },
      include: { batch: true },
    });
    expect(task?.batch.visibleBatchNumber).toBe(
      deriveVisibleBatchNumber(date, "406"),
    );
    expect(task?.status).toBe("OPEN");
  });

  it("rejects duplicate visible batch for same SKU", async () => {
    const week = "2099-W27";
    const date = isoWeekWeekdaySections(week)[0]!.date;
    const plan = await createWeeklyPlan(week);
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    planIds.push(plan.data.id);
    const itemA = await createPlanItem({
      planId: plan.data.id,
      skuId: SKU_RED,
      assignedTeamId: TEAM_402,
      plannedDate: date,
      plannedQuantity: 10,
      destinationIdentity: "402",
    });
    const itemB = await createPlanItem({
      planId: plan.data.id,
      skuId: SKU_RED,
      assignedTeamId: TEAM_402,
      plannedDate: date,
      plannedQuantity: 10,
      destinationIdentity: "402",
    });
    expect(itemA.ok).toBe(true);
    expect(itemB.ok).toBe(true);
    const published = await publishWeeklyPlan(plan.data.id);
    expect(published.ok).toBe(false);
    if (published.ok) {
      return;
    }
    expect(published.kind).toBe("conflict");
  });
});

describe.skipIf(!hasDb)("start seeding", () => {
  it("starts and retries idempotently for same worker", async () => {
    const { taskId } = await draftPlanWithItem(
      isoWeekWeekdaySections("2099-W31")[0]!.date,
      "402",
      35,
    );
    const first = await startSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      workerUserId: WORKER_ALEX,
    });
    expect(first.ok).toBe(true);
    const second = await startSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      workerUserId: WORKER_ALEX,
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.data.status).toBe("already_started_by_you");
    }
    const task = await prisma.productionTask.findUnique({
      where: { id: taskId },
    });
    expect(task?.starterUserId).toBe(WORKER_ALEX);
  });

  it("conflicts when a different worker starts", async () => {
    const { taskId } = await draftPlanWithItem(
      isoWeekWeekdaySections("2099-W32")[1]!.date,
      "402",
      35,
    );
    await startSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      workerUserId: WORKER_ALEX,
    });
    const other = await startSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      workerUserId: WORKER_ELENA,
    });
    expect(other.ok).toBe(false);
    if (!other.ok) {
      expect(other.kind).toBe("conflict");
    }
  });
});

describe.skipIf(!hasDb)("complete seeding", () => {
  async function startedTask(week: string, weekdayIndex: number, qty: number) {
    const plannedDate = isoWeekWeekdaySections(week)[weekdayIndex]!.date;
    const { taskId } = await draftPlanWithItem(plannedDate, "402", qty);
    await startSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      workerUserId: WORKER_ALEX,
    });
    return taskId;
  }

  it("completes 35/35 with split seed lots", async () => {
    const taskId = await startedTask("2099-W36", 0, 35);
    const result = await completeSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      actualQuantity: 35,
      participantUserIds: [WORKER_ALEX, WORKER_ELENA],
      seedLotAllocations: [
        {
          seedLotId: SEED_LOT_A,
          quantity: 25,
          quantityUom: "trays",
          changeFromPreselected: false,
        },
        {
          seedLotId: SEED_LOT_B,
          quantity: 10,
          quantityUom: "trays",
          changeFromPreselected: true,
          changeReason: "test",
        },
      ],
      materialLotAllocations: materialAllocations(35),
    });
    expect(result.ok).toBe(true);
    const task = await prisma.productionTask.findUnique({
      where: { id: taskId },
    });
    const batch = await prisma.batch.findUnique({
      where: { id: task!.batchId },
    });
    expect(batch?.currentStage).toBe("GERMINATION");
    expect(batch?.expectedGerminationAt).toBeTruthy();

    const sku = await prisma.sku.findUnique({ where: { id: SKU_RED } });
    expect(sku?.productionFormat).toBe(ProductionFormat.PU);

    const allocations = await prisma.eventLotAllocation.findMany({
      where: { event: { productionTaskId: taskId } },
    });
    const seedAlloc = allocations.filter((a) => a.seedLotId);
    expect(seedAlloc.length).toBe(2);
    const seedConsumed = seedAlloc.reduce(
      (sum, a) => sum.add(a.consumedQuantity ?? 0),
      new Prisma.Decimal(0),
    );
    expect(seedConsumed.toString()).toBe("3572.1");

    if (!result.ok) {
      throw new Error("expected complete to succeed");
    }
    const consumptionRows = await prisma.lotInventoryTransaction.count({
      where: {
        productionEventId: result.data.productionEventId,
        transactionType: LotInventoryTransactionType.PRODUCTION_CONSUMPTION,
      },
    });
    expect(consumptionRows).toBeGreaterThan(0);
  });

  it("rejects allocation mismatch", async () => {
    const taskId = await startedTask("2099-W37", 0, 35);
    const result = await completeSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      actualQuantity: 35,
      participantUserIds: [WORKER_ALEX],
      seedLotAllocations: [
        {
          seedLotId: SEED_LOT_A,
          quantity: 20,
          quantityUom: "trays",
          changeFromPreselected: false,
        },
        {
          seedLotId: SEED_LOT_B,
          quantity: 10,
          quantityUom: "trays",
          changeFromPreselected: false,
        },
      ],
      materialLotAllocations: materialAllocations(35),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("30 / 35 trays allocated");
    }
  });

  it("requires deviation for 35/30", async () => {
    const taskId = await startedTask("2099-W36", 1, 35);
    const missing = await completeSeeding({
      productionTaskId: taskId,
      teamId: TEAM_402,
      actualQuantity: 30,
      participantUserIds: [WORKER_ALEX],
      seedLotAllocations: [
        {
          seedLotId: SEED_LOT_A,
          quantity: 30,
          quantityUom: "trays",
          changeFromPreselected: false,
        },
      ],
      materialLotAllocations: materialAllocations(30),
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.kind).toBe("validation_error");
    }
  });

  it("is idempotent on duplicate complete", async () => {
    const taskId = await startedTask("2099-W36", 2, 35);
    const payload: CompleteSeedingInput = {
      productionTaskId: taskId,
      teamId: TEAM_402,
      actualQuantity: 35,
      participantUserIds: [WORKER_ALEX],
      seedLotAllocations: [
        {
          seedLotId: SEED_LOT_A,
          quantity: 35,
          quantityUom: "trays",
          changeFromPreselected: false,
        },
      ],
      materialLotAllocations: materialAllocations(35),
    };
    const first = await completeSeeding(payload);
    const second = await completeSeeding(payload);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.data.idempotent).toBe(true);
      expect(first.data.productionEventId).toBe(second.data.productionEventId);
    }
    const count = await prisma.productionEvent.count({
      where: { productionTaskId: taskId, eventType: "SEEDING_COMPLETED" },
    });
    expect(count).toBe(1);
  });
});
