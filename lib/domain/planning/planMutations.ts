import { WeeklyPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  failure,
  success,
  validationError,
  type ActionResult,
} from "@/lib/domain/results";
import { deleteBatchSubtree } from "@/lib/domain/development/deleteBatchSubtree";
import { planItemQuantityUom } from "@/lib/validation/planning";
import type {
  CreatePlanItemInput,
  UpdatePlanItemInput,
} from "@/lib/validation/planning";
import {
  assertPlanItemPlanningEditable,
  loadPlanItemForMutation,
  openProductionTask,
} from "@/lib/domain/planning/planItemAccess";
import { validatePlanItemPlannedDate } from "@/lib/domain/planning/validatePlanItemDate";
import {
  isPrismaUniqueViolation,
} from "@/lib/domain/prismaErrors";

export async function createWeeklyPlan(
  week: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const plan = await prisma.weeklyPlan.create({
      data: { week, status: WeeklyPlanStatus.DRAFT },
    });
    return success({ id: plan.id });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return validationError(
        "An active draft or published plan already exists for this week",
      );
    }
    throw error;
  }
}

async function assertDraftPlan(planId: string) {
  const plan = await prisma.weeklyPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return { error: failure("Weekly plan not found") };
  }
  if (plan.status !== WeeklyPlanStatus.DRAFT) {
    return {
      error: validationError("New plan items can only be added while the plan is in DRAFT"),
    };
  }
  return { plan };
}

export async function createPlanItem(
  input: CreatePlanItemInput,
): Promise<ActionResult<{ id: string }>> {
  const draft = await assertDraftPlan(input.planId);
  if (draft.error) {
    return draft.error;
  }

  const sku = await prisma.sku.findFirst({
    where: { id: input.skuId, active: true },
  });
  if (!sku) {
    return validationError("SKU not found or inactive");
  }

  const team = await prisma.team.findFirst({
    where: { id: input.assignedTeamId, active: true },
  });
  if (!team) {
    return validationError("Team not found or inactive");
  }

  const dateError = validatePlanItemPlannedDate(
    input.plannedDate,
    draft.plan!.week,
  );
  if (dateError) {
    return dateError;
  }

  const item = await prisma.planItem.create({
    data: {
      planId: input.planId,
      skuId: input.skuId,
      assignedTeamId: input.assignedTeamId,
      plannedDate: input.plannedDate,
      plannedQuantity: input.plannedQuantity,
      quantityUom: planItemQuantityUom(),
      destinationIdentity: input.destinationIdentity,
    },
  });

  return success({ id: item.id });
}

export async function updatePlanItem(
  input: UpdatePlanItemInput,
): Promise<ActionResult<{ id: string }>> {
  const loaded = await loadPlanItemForMutation(input.planItemId);
  if (!loaded.ok) {
    return loaded;
  }
  const existing = loaded.data;

  const editableError = assertPlanItemPlanningEditable(existing);
  if (editableError) {
    return editableError;
  }

  const team = await prisma.team.findFirst({
    where: { id: input.assignedTeamId, active: true },
  });
  if (!team) {
    return validationError("Team not found or inactive");
  }

  const dateError = validatePlanItemPlannedDate(
    input.plannedDate,
    existing.plan.week,
  );
  if (dateError) {
    return dateError;
  }

  const isDraft = existing.plan.status === WeeklyPlanStatus.DRAFT;

  if (isDraft) {
    const sku = await prisma.sku.findFirst({
      where: { id: input.skuId, active: true },
    });
    if (!sku) {
      return validationError("SKU not found or inactive");
    }
    const item = await prisma.planItem.update({
      where: { id: input.planItemId },
      data: {
        skuId: input.skuId,
        assignedTeamId: input.assignedTeamId,
        plannedDate: input.plannedDate,
        plannedQuantity: input.plannedQuantity,
        destinationIdentity: input.destinationIdentity,
      },
    });
    return success({ id: item.id });
  }

  const openTask = openProductionTask(existing);
  if (!openTask) {
    return validationError("Plan item is locked");
  }

  await prisma.$transaction(async (tx) => {
    await tx.planItem.update({
      where: { id: input.planItemId },
      data: {
        assignedTeamId: input.assignedTeamId,
        plannedDate: input.plannedDate,
        plannedQuantity: input.plannedQuantity,
        destinationIdentity: input.destinationIdentity,
      },
    });
    await tx.productionTask.update({
      where: { id: openTask.id },
      data: { assignedTeamId: input.assignedTeamId },
    });
  });

  return success({ id: input.planItemId });
}

export async function deletePlanItem(
  planItemId: string,
): Promise<ActionResult<{ id: string; planRevertedToDraft: boolean }>> {
  const loaded = await loadPlanItemForMutation(planItemId);
  if (!loaded.ok) {
    return loaded;
  }
  const existing = loaded.data;

  const editableError =
    existing.plan.status === WeeklyPlanStatus.DRAFT
      ? null
      : assertPlanItemPlanningEditable(existing);
  if (editableError) {
    return editableError;
  }

  const result = await prisma.$transaction(async (tx) => {
    if (existing.batch) {
      await deleteBatchSubtree(tx, existing.batch.id);
    }
    const planId = existing.planId;
    await tx.planItem.delete({ where: { id: planItemId } });

    let planRevertedToDraft = false;
    if (existing.plan.status === WeeklyPlanStatus.PUBLISHED) {
      const remaining = await tx.planItem.count({ where: { planId } });
      if (remaining === 0) {
        await tx.weeklyPlan.update({
          where: { id: planId },
          data: { status: WeeklyPlanStatus.DRAFT },
        });
        planRevertedToDraft = true;
      }
    }
    return { id: planItemId, planRevertedToDraft };
  });

  return success(result);
}
