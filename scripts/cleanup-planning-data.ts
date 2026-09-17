/**
 * Dev utility: remove all WeeklyPlan / PlanItem / Batch / task / event data.
 * Requires ENABLE_DEV_DATA_DELETION=true. Does not touch master data.
 */
import { PrismaClient } from "@prisma/client";
import { deleteBatchSubtree } from "../lib/domain/development/deleteBatchSubtree";

const prisma = new PrismaClient();

/** Same transaction shape as deleteWeeklyPlanDevelopment (script-safe Prisma client). */
async function deleteWeeklyPlanInTransaction(planId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM weekly_plans WHERE id = ${planId}::uuid FOR UPDATE`;

    const plan = await tx.weeklyPlan.findUnique({
      where: { id: planId },
      include: { planItems: { include: { batch: true } } },
    });
    if (!plan) {
      return;
    }

    for (const item of plan.planItems) {
      if (item.batch) {
        await deleteBatchSubtree(tx, item.batch.id);
      }
    }

    await tx.planItem.deleteMany({ where: { planId } });
    await tx.weeklyPlan.delete({ where: { id: planId } });
  });
}

async function main() {
  if (process.env.ENABLE_DEV_DATA_DELETION !== "true") {
    console.error(
      "Set ENABLE_DEV_DATA_DELETION=true in .env.local to run cleanup.",
    );
    process.exit(1);
  }

  const plans = await prisma.weeklyPlan.findMany({ select: { id: true } });
  for (const plan of plans) {
    await deleteWeeklyPlanInTransaction(plan.id);
  }
  console.log(`Removed ${plans.length} weekly plan(s) and associated data.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
