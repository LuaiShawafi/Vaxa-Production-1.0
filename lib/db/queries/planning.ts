import "server-only";
import { WeeklyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function listWeeklyPlans() {
  const plans = await prisma.weeklyPlan.findMany({
    where: {
      status: {
        in: [WeeklyPlanStatus.DRAFT, WeeklyPlanStatus.PUBLISHED],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { planItems: true } },
    },
  });
  return plans.map((p) => ({
    id: p.id,
    week: p.week,
    status: p.status,
    itemCount: p._count.planItems,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

export async function getWeeklyPlanDetail(planId: string) {
  return prisma.weeklyPlan.findUnique({
    where: { id: planId },
    include: {
      planItems: {
        orderBy: { plannedDate: "asc" },
        include: {
          sku: {
            select: {
              id: true,
              code: true,
              description: true,
              productionFormat: true,
            },
          },
          assignedTeam: { select: { id: true, name: true } },
          batch: { select: { id: true, visibleBatchNumber: true } },
          productionTasks: { select: { id: true, status: true } },
        },
      },
    },
  });
}

export async function listActiveSkus() {
  return prisma.sku.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, description: true },
  });
}

export async function listActiveTeams() {
  return prisma.team.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
