"use server";

import { revalidatePath } from "next/cache";
import {
  createPlanItem,
  createWeeklyPlan,
  deletePlanItem,
  updatePlanItem,
} from "@/lib/domain/planning/planMutations";
import { archiveWeeklyPlan } from "@/lib/domain/planning/archiveWeeklyPlan";
import { deleteEmptyDraftWeeklyPlan } from "@/lib/domain/planning/deleteEmptyDraftWeeklyPlan";
import { publishWeeklyPlan } from "@/lib/domain/planning/publishWeeklyPlan";
import { parseDateInput } from "@/lib/date";
import type { ActionResult } from "@/lib/domain/results";
import {
  createPlanItemSchema,
  createWeeklyPlanSchema,
  publishWeeklyPlanSchema,
  updatePlanItemSchema,
} from "@/lib/validation/planning";

export async function createWeeklyPlanAction(
  week: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createWeeklyPlanSchema.safeParse({ week });
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await createWeeklyPlan(parsed.data.week);
  if (result.ok) {
    revalidatePath("/planning");
  }
  return result;
}

export async function createPlanItemAction(
  input: {
    planId: string;
    skuId: string;
    plannedDate: string;
    plannedQuantity: number;
    assignedTeamId: string;
    destinationIdentity: string;
  },
): Promise<ActionResult<{ id: string }>> {
  const parsed = createPlanItemSchema.safeParse({
    ...input,
    plannedDate: parseDateInput(input.plannedDate),
  });
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await createPlanItem(parsed.data);
  if (result.ok) {
    revalidatePath(`/planning/${input.planId}`);
    revalidatePath("/planning");
  }
  return result;
}

export async function updatePlanItemAction(
  input: {
    planItemId: string;
    planId: string;
    skuId: string;
    plannedDate: string;
    plannedQuantity: number;
    assignedTeamId: string;
    destinationIdentity: string;
  },
): Promise<ActionResult<{ id: string }>> {
  const parsed = updatePlanItemSchema.safeParse({
    ...input,
    plannedDate: parseDateInput(input.plannedDate),
  });
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await updatePlanItem(parsed.data);
  if (result.ok) {
    revalidatePath(`/planning/${input.planId}`);
    revalidatePath("/402");
  }
  return result;
}

export async function deletePlanItemAction(
  planItemId: string,
  planId: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await deletePlanItem(planItemId);
  if (result.ok) {
    revalidatePath(`/planning/${planId}`);
    revalidatePath("/planning");
    revalidatePath("/402");
  }
  return result;
}

export async function publishWeeklyPlanAction(
  planId: string,
): Promise<ActionResult<{ planId: string; published: boolean; batchesCreated: number }>> {
  const parsed = publishWeeklyPlanSchema.safeParse({ planId });
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await publishWeeklyPlan(parsed.data.planId);
  if (result.ok) {
    revalidatePath(`/planning/${planId}`);
    revalidatePath("/planning");
    revalidatePath("/402");
  }
  return result;
}

export async function archiveWeeklyPlanAction(
  planId: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await archiveWeeklyPlan(planId);
  if (result.ok) {
    revalidatePath(`/planning/${planId}`);
    revalidatePath("/planning");
  }
  return result;
}

export async function deleteEmptyDraftWeeklyPlanAction(
  planId: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await deleteEmptyDraftWeeklyPlan(planId);
  if (result.ok) {
    revalidatePath("/planning");
  }
  return result;
}
