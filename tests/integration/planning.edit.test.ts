import { describe, expect, it, afterEach, beforeAll } from "vitest";
import { requireSkuIdByCode } from "@/tests/helpers/devDb";
import { prisma } from "@/lib/db/prisma";
import {
  createPlanItem,
  createWeeklyPlan,
  deletePlanItem,
  updatePlanItem,
} from "@/lib/domain/planning/planMutations";
import { publishWeeklyPlan } from "@/lib/domain/planning/publishWeeklyPlan";
import { deletePlanItemDevelopment } from "@/lib/domain/development/deletePlanItemDevelopment";
import { deriveVisibleBatchNumber } from "@/lib/domain/batchNumber";
import { isoWeekWeekdaySections } from "@/lib/date";

const hasDb = Boolean(process.env.DATABASE_URL);
const TEAM_402 = "00000000-0000-4000-8000-000000000402";
let SKU_RED: string;

beforeAll(async () => {
  SKU_RED = await requireSkuIdByCode("PU_RED_RADISH");
});

const planIds: string[] = [];

afterEach(async () => {
  if (!hasDb) {
    return;
  }
  process.env.ENABLE_DEV_DATA_DELETION = "true";
  for (const planId of planIds.splice(0)) {
    const items = await prisma.planItem.findMany({ where: { planId } });
    for (const item of items) {
      await deletePlanItemDevelopment(item.id);
    }
    await prisma.weeklyPlan.deleteMany({ where: { id: planId } }).catch(() => {});
  }
});

describe.skipIf(!hasDb)("published plan item edits", () => {
  it("keeps visibleBatchNumber when destination and date change on OPEN task", async () => {
    process.env.ENABLE_DEV_DATA_DELETION = "true";
    const plan = await createWeeklyPlan("2099-W11");
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    planIds.push(plan.data.id);

    const w11Days = isoWeekWeekdaySections("2099-W11");
    const date = w11Days[0]!.date;
    const item = await createPlanItem({
      planId: plan.data.id,
      skuId: SKU_RED,
      assignedTeamId: TEAM_402,
      plannedDate: date,
      plannedQuantity: 35,
      destinationIdentity: "402",
    });
    expect(item.ok).toBe(true);
    if (!item.ok) {
      return;
    }

    const published = await publishWeeklyPlan(plan.data.id);
    expect(published.ok).toBe(true);

    const batchBefore = await prisma.batch.findFirst({
      where: { originPlanItemId: item.data.id },
    });
    expect(batchBefore?.visibleBatchNumber).toBe(
      deriveVisibleBatchNumber(date, "402"),
    );

    const updated = await updatePlanItem({
      planItemId: item.data.id,
      skuId: SKU_RED,
      assignedTeamId: TEAM_402,
      plannedDate: w11Days[2]!.date,
      plannedQuantity: 40,
      destinationIdentity: "418",
    });
    expect(updated.ok).toBe(true);

    const batchAfter = await prisma.batch.findUnique({
      where: { id: batchBefore!.id },
    });
    expect(batchAfter?.visibleBatchNumber).toBe(
      deriveVisibleBatchNumber(date, "402"),
    );

    const planItem = await prisma.planItem.findUnique({
      where: { id: item.data.id },
    });
    expect(planItem?.destinationIdentity).toBe("418");
    expect(planItem?.plannedQuantity.toString()).toBe("40");
  });

  it("reverts published plan to DRAFT when last item dev-deleted", async () => {
    process.env.ENABLE_DEV_DATA_DELETION = "true";
    const plan = await createWeeklyPlan("2099-W12");
    if (!plan.ok) {
      return;
    }
    planIds.push(plan.data.id);

    const w12Monday = isoWeekWeekdaySections("2099-W12")[0]!.date;
    const item = await createPlanItem({
      planId: plan.data.id,
      skuId: SKU_RED,
      assignedTeamId: TEAM_402,
      plannedDate: w12Monday,
      plannedQuantity: 10,
      destinationIdentity: "410",
    });
    if (!item.ok) {
      return;
    }
    await publishWeeklyPlan(plan.data.id);

    const del = await deletePlanItemDevelopment(item.data.id);
    expect(del.ok).toBe(true);
    if (del.ok) {
      expect(del.data.planRevertedToDraft).toBe(true);
    }

    const wp = await prisma.weeklyPlan.findUnique({
      where: { id: plan.data.id },
    });
    expect(wp?.status).toBe("DRAFT");
  });

  it("deletes plan item on DRAFT plan when a published batch still exists", async () => {
    const plan = await createWeeklyPlan("2099-W13");
    if (!plan.ok) {
      return;
    }
    planIds.push(plan.data.id);

    const date = isoWeekWeekdaySections("2099-W13")[0]!.date;
    const item = await createPlanItem({
      planId: plan.data.id,
      skuId: SKU_RED,
      assignedTeamId: TEAM_402,
      plannedDate: date,
      plannedQuantity: 12,
      destinationIdentity: "402",
    });
    if (!item.ok) {
      return;
    }
    await publishWeeklyPlan(plan.data.id);

    await prisma.weeklyPlan.update({
      where: { id: plan.data.id },
      data: { status: "DRAFT" },
    });

    const del = await deletePlanItem(item.data.id);
    expect(del.ok).toBe(true);

    const batch = await prisma.batch.findFirst({
      where: { originPlanItemId: item.data.id },
    });
    expect(batch).toBeNull();
  });
});
