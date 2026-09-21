import type { PlanItemEditSubject } from "@/components/planning/PlanItemEditDrawer";
import { formatDateInput } from "@/lib/date";
import { traysToProductionUnits } from "@/lib/domain/inventory/productionFormatMath";
import { planItemUiState, type PlanItemUiState } from "@/lib/planning/planItemUiState";
import {
  Prisma,
  ProductionFormat,
  ProductionTaskStatus,
  type WeeklyPlanStatus,
} from "@prisma/client";

export type PlanItemWeekDetailRow = {
  id: string;
  plannedDate: Date;
  plannedQuantity: { toString(): string };
  quantityUom: string;
  destinationIdentity: string;
  sku: { id: string; code: string; productionFormat: ProductionFormat };
  assignedTeam: { id: string; name: string };
  batch: { id: string; visibleBatchNumber: string } | null;
  productionTasks: { status: ProductionTaskStatus }[];
};

export function planItemStateLabel(uiState: PlanItemUiState): string {
  if (uiState === "draft") {
    return "Draft";
  }
  if (uiState === "open") {
    return "Open";
  }
  return "Started / locked";
}

const planItemProductionUnitsFormatter = new Intl.NumberFormat("en-GB");

/** Planned trays × SKU production format → display production units (not persisted). */
export function formatPlanItemProductionUnits(
  plannedTrays: number | Prisma.Decimal | { toString(): string },
  productionFormat: ProductionFormat,
): string {
  const trays =
    plannedTrays instanceof Prisma.Decimal
      ? plannedTrays
      : typeof plannedTrays === "number"
        ? plannedTrays
        : new Prisma.Decimal(plannedTrays.toString());
  const units = traysToProductionUnits(trays, productionFormat);
  return planItemProductionUnitsFormatter.format(units.toNumber());
}

export function planItemRowShowsVisibleActions(
  uiState: PlanItemUiState,
  devDeletionEnabled: boolean,
): boolean {
  if (uiState === "draft" || uiState === "open") {
    return true;
  }
  return devDeletionEnabled;
}

export function buildPlanItemWeekDetailPresentation(args: {
  item: PlanItemWeekDetailRow;
  planStatus: WeeklyPlanStatus;
  weekdayName: string;
  dayLabel: string;
}): {
  uiState: PlanItemUiState;
  stateLabel: string;
  subject: PlanItemEditSubject | null;
} {
  const taskStatus = args.item.productionTasks[0]?.status;
  const uiState = planItemUiState(args.planStatus, taskStatus);
  const stateLabel = planItemStateLabel(uiState);

  const subject: PlanItemEditSubject | null =
    uiState === "draft" || uiState === "open"
      ? {
          kind: "edit" as const,
          planItemId: args.item.id,
          skuId: args.item.sku.id,
          skuCode: args.item.sku.code,
          plannedDateInput: formatDateInput(args.item.plannedDate),
          weekdayName: args.weekdayName,
          weekdayLabel: `${args.weekdayName} ${args.dayLabel}`,
          plannedQuantity: args.item.plannedQuantity.toString(),
          assignedTeamId: args.item.assignedTeam.id,
          assignedTeamName: args.item.assignedTeam.name,
          destinationIdentity: args.item.destinationIdentity,
          lockSku: uiState === "open",
          uiState,
          stateLabel,
          visibleBatchNumber: args.item.batch?.visibleBatchNumber ?? null,
        }
      : null;

  return { uiState, stateLabel, subject };
}
