import "server-only";
import { BatchStage } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  formatOperationalDayLabel,
  parseDateInput,
} from "@/lib/date";
import {
  germination402AsOfCalendarDate,
  partitionGermination402WorkerLists,
  type Germination402WorkerLists,
} from "@/lib/domain/germination/germination402ReadModel";
import { getTeam402 } from "@/lib/db/queries/seeding";
import {
  ACTIVE_BATCH_EVENT_TYPES,
  toActiveBatchListItem,
  type ActiveBatchListItem,
} from "@/lib/domain/batches/activeBatchesReadModel";

export type Team402Worker = { id: string; name: string };

export type Germination402PageData = {
  teamId: string;
  asOfCalendarDate: Date;
  workers: Team402Worker[];
  lists: Germination402WorkerLists;
};

async function listGerminationBatchRows(): Promise<ActiveBatchListItem[]> {
  const rows = await prisma.batch.findMany({
    where: { currentStage: BatchStage.GERMINATION },
    orderBy: { visibleBatchNumber: "asc" },
    select: {
      id: true,
      visibleBatchNumber: true,
      currentStage: true,
      currentDestination: true,
      originalAssignedDestination: true,
      expectedGerminationAt: true,
      germinationDaysSnapshot: true,
      nurseryDaysSnapshot: true,
      sku: {
        select: {
          code: true,
          description: true,
          productionFormat: true,
        },
      },
      productionEvents: {
        where: {
          eventType: { in: [...ACTIVE_BATCH_EVENT_TYPES] },
        },
        select: {
          eventType: true,
          actualQuantity: true,
          quantityUom: true,
          occurredAt: true,
        },
      },
    },
  });

  const items: ActiveBatchListItem[] = [];
  for (const row of rows) {
    const item = toActiveBatchListItem(row);
    if (item) {
      items.push(item);
    }
  }
  return items;
}

export async function listTeam402Workers(
  teamId: string,
): Promise<Team402Worker[]> {
  return prisma.user.findMany({
    where: {
      active: true,
      teamMemberships: {
        some: { teamId, active: true },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Server read model for the 402 germination worker surface on `/402`.
 */
export async function getGermination402PageData(): Promise<Germination402PageData | null> {
  const team = await getTeam402();
  if (!team) {
    return null;
  }

  const asOfCalendarDate = germination402AsOfCalendarDate();
  const batches = await listGerminationBatchRows();
  const workers = await listTeam402Workers(team.id);

  const lists = partitionGermination402WorkerLists(
    batches,
    asOfCalendarDate,
    (seededAt) =>
      seededAt ? formatOperationalDayLabel(seededAt) : null,
  );

  return {
    teamId: team.id,
    asOfCalendarDate,
    workers,
    lists,
  };
}

/** Test helper: build as-of from a fixed operational date string. */
export function germination402AsOfFromOperationalDate(ymd: string): Date {
  return parseDateInput(ymd);
}
