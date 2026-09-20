import "server-only";
import {
  BatchStage,
  ProductionEventType,
  ProductionTaskStatus,
  WeeklyPlanStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { TEAM_402_NAME } from "@/lib/constants";
import {
  formatOperationalDateTime,
  formatOperationalDayLabel,
  operationalTodayPlannedDateRange,
} from "@/lib/date";
import { preselectedLotEntrySchema } from "@/lib/validation/seeding";
import { z } from "zod";
import type {
  SeedTodayTaskInfo,
  SeedTodayTaskInfoHistoryItem,
  SeedTodayTaskInfoLot,
} from "@/lib/types/seedTodayTaskInfo";

export type {
  SeedTodayTaskInfo,
  SeedTodayTaskInfoHistoryItem,
  SeedTodayTaskInfoLot,
} from "@/lib/types/seedTodayTaskInfo";

const statusOrder: Record<ProductionTaskStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

export async function getTeam402() {
  return prisma.team.findFirst({
    where: { name: TEAM_402_NAME, active: true },
  });
}

export async function listSeedTodayForTeam(teamId: string) {
  const { start: todayStart, end: todayEnd } = operationalTodayPlannedDateRange();

  const tasks = await prisma.productionTask.findMany({
    where: {
      assignedTeamId: teamId,
      planItem: {
        plannedDate: { gte: todayStart, lt: todayEnd },
        plan: {
          status: {
            in: [WeeklyPlanStatus.DRAFT, WeeklyPlanStatus.PUBLISHED],
          },
        },
      },
    },
    include: {
      starterUser: { select: { name: true } },
      planItem: {
        include: {
          sku: { select: { code: true } },
        },
      },
      batch: {
        select: {
          visibleBatchNumber: true,
          currentStage: true,
          originalAssignedDestination: true,
          currentDestination: true,
          officialIdentityLockedAt: true,
        },
      },
    },
  });

  tasks.sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status],
  );

  return tasks.map((task) => {
    const locked = task.batch.officialIdentityLockedAt != null;
    const destination = locked
      ? task.batch.currentDestination
      : task.planItem.destinationIdentity;

    return {
      taskId: task.id,
      batchNumber: task.batch.visibleBatchNumber,
      skuCode: task.planItem.sku.code,
      plannedQuantity: task.planItem.plannedQuantity.toString(),
      quantityUom: task.planItem.quantityUom,
      destination,
      status: task.status,
      starterName: task.starterUser?.name ?? null,
      startedAt: task.startedAt,
      currentStage: task.batch.currentStage,
    };
  });
}

export async function getSeedingTaskDetail(taskId: string, teamId: string) {
  const task = await prisma.productionTask.findFirst({
    where: { id: taskId, assignedTeamId: teamId },
    include: {
      starterUser: { select: { id: true, name: true } },
      planItem: {
        include: {
          sku: true,
        },
      },
      batch: true,
    },
  });

  if (!task) {
    return null;
  }

  const bom = await prisma.bom.findFirst({
    where: { skuId: task.planItem.skuId, type: "PROD", active: true },
  });

  const teamMembers = await prisma.user.findMany({
    where: {
      active: true,
      teamMemberships: {
        some: { teamId, active: true },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return {
    task,
    preselectedLots: task.preselectedLots,
    hasBom: bom != null,
    bomReady: bom?.ready ?? false,
    teamMembers,
  };
}

function taskStatusLabel(status: ProductionTaskStatus): string {
  switch (status) {
    case ProductionTaskStatus.IN_PROGRESS:
      return "In progress";
    case ProductionTaskStatus.COMPLETED:
      return "Completed";
    case ProductionTaskStatus.CANCELLED:
      return "Cancelled";
    default:
      return "Open";
  }
}

function batchStageLabel(stage: BatchStage): string {
  switch (stage) {
    case BatchStage.GERMINATION:
      return "Germination";
    case BatchStage.NURSERY:
      return "Nursery";
    case BatchStage.IN_TRANSIT:
      return "In transit";
    case BatchStage.IN_POOL:
      return "In pool";
    case BatchStage.HARVESTED:
      return "Harvested";
    default:
      return "Planned";
  }
}

function planStatusLabel(status: WeeklyPlanStatus): string {
  switch (status) {
    case WeeklyPlanStatus.PUBLISHED:
      return "Published";
    case WeeklyPlanStatus.ARCHIVED:
      return "Archived";
    default:
      return "Draft";
  }
}

function parsePreselectedLots(raw: unknown): SeedTodayTaskInfoLot[] {
  const parsed = z.array(preselectedLotEntrySchema).safeParse(raw);
  if (!parsed.success) {
    return [];
  }
  return parsed.data.map((lot) => ({
    lotType: lot.lotType,
    lotNumber: lot.lotNumber,
  }));
}

/**
 * Read-only Seed Today info for the Info drawer.
 * Does not mutate state and must not be used to start seeding.
 */
export async function getSeedTodayTaskInfo(
  taskId: string,
  teamId: string,
): Promise<SeedTodayTaskInfo | null> {
  const task = await prisma.productionTask.findFirst({
    where: { id: taskId, assignedTeamId: teamId },
    include: {
      starterUser: { select: { name: true } },
      planItem: {
        include: {
          sku: { select: { code: true } },
          plan: { select: { week: true, status: true } },
        },
      },
      batch: {
        select: {
          id: true,
          visibleBatchNumber: true,
          currentStage: true,
          originalAssignedDestination: true,
          currentDestination: true,
          officialIdentityLockedAt: true,
          productionEvents: {
            where: {
              eventType: {
                in: [
                  ProductionEventType.SEEDING_COMPLETED,
                  ProductionEventType.DESTINATION_CHANGED,
                ],
              },
            },
            orderBy: { occurredAt: "asc" },
            include: {
              initiatedByUser: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!task) {
    return null;
  }

  const bom = await prisma.bom.findFirst({
    where: { skuId: task.planItem.skuId, type: "PROD", active: true },
    select: { ready: true },
  });

  const locked = task.batch.officialIdentityLockedAt != null;
  const destination = locked
    ? task.batch.currentDestination
    : task.planItem.destinationIdentity;

  const hasBom = bom != null;
  const bomReady = bom?.ready ?? false;
  const bomStatusLabel = !hasBom
    ? "Missing"
    : bomReady
      ? "Ready"
      : "Not ready";

  const plannedDateLabel = formatOperationalDayLabel(task.planItem.plannedDate);
  const qtyLabel = `${task.planItem.plannedQuantity.toString()} ${task.planItem.quantityUom}`;

  const history: SeedTodayTaskInfoHistoryItem[] = [
    {
      id: "scheduled",
      title: "Scheduled for seeding",
      detail: `${plannedDateLabel} · ${qtyLabel} · destination ${task.planItem.destinationIdentity}`,
    },
  ];

  if (task.startedAt && task.starterUser) {
    history.push({
      id: "started",
      title: "Seeding started",
      detail: `${formatOperationalDateTime(task.startedAt)} · ${task.starterUser.name}`,
    });
  }

  for (const event of task.batch.productionEvents) {
    if (event.eventType === ProductionEventType.SEEDING_COMPLETED) {
      history.push({
        id: event.id,
        title: "Seeding completed",
        detail: `${formatOperationalDateTime(event.occurredAt)} · ${event.actualQuantity.toString()} ${event.quantityUom} · ${event.initiatedByUser.name}`,
      });
    } else if (event.eventType === ProductionEventType.DESTINATION_CHANGED) {
      history.push({
        id: event.id,
        title: "Destination changed",
        detail: `${formatOperationalDateTime(event.occurredAt)} · ${event.destinationBefore ?? "—"} → ${event.destinationAfter ?? "—"} · ${event.initiatedByUser.name}`,
      });
    }
  }

  return {
    taskId: task.id,
    batchId: task.batch.id,
    batchNumber: task.batch.visibleBatchNumber,
    skuCode: task.planItem.sku.code,
    plannedQuantity: task.planItem.plannedQuantity.toString(),
    quantityUom: task.planItem.quantityUom,
    destination,
    originalAssignedDestination: task.batch.originalAssignedDestination,
    currentStageLabel: batchStageLabel(task.batch.currentStage),
    taskStatus: task.status,
    taskStatusLabel: taskStatusLabel(task.status),
    starterName: task.starterUser?.name ?? null,
    startedAtLabel: task.startedAt
      ? formatOperationalDateTime(task.startedAt)
      : null,
    completedAtLabel: task.completedAt
      ? formatOperationalDateTime(task.completedAt)
      : null,
    plannedDateLabel,
    planWeek: task.planItem.plan.week,
    planStatusLabel: planStatusLabel(task.planItem.plan.status),
    hasBom,
    bomReady,
    bomStatusLabel,
    preselectedLots: parsePreselectedLots(task.preselectedLots),
    history,
    showGerminationBatchLink:
      task.batch.currentStage === BatchStage.GERMINATION,
  };
}
