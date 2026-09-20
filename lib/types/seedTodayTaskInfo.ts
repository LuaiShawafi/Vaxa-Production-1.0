import type { ProductionTaskStatus } from "@prisma/client";

export type SeedTodayTaskInfoHistoryItem = {
  id: string;
  title: string;
  detail: string;
};

export type SeedTodayTaskInfoLot = {
  lotType: string;
  lotNumber: string;
};

/** Serializable read-only DTO for the Seed Today Info drawer. */
export type SeedTodayTaskInfo = {
  taskId: string;
  batchId: string;
  batchNumber: string;
  skuCode: string;
  plannedQuantity: string;
  quantityUom: string;
  destination: string;
  originalAssignedDestination: string;
  currentStageLabel: string;
  taskStatus: ProductionTaskStatus;
  taskStatusLabel: string;
  starterName: string | null;
  startedAtLabel: string | null;
  completedAtLabel: string | null;
  plannedDateLabel: string;
  planWeek: string;
  planStatusLabel: string;
  hasBom: boolean;
  bomReady: boolean;
  bomStatusLabel: string;
  preselectedLots: SeedTodayTaskInfoLot[];
  history: SeedTodayTaskInfoHistoryItem[];
  /** True when `/batches/active/[batchId]` would resolve (germination stage). */
  showGerminationBatchLink: boolean;
};
