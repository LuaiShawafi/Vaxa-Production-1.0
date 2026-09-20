"use server";

import { revalidatePath } from "next/cache";
import {
  deleteBatchDevelopment,
  previewDeleteBatchDevelopment,
} from "@/lib/domain/development/deleteBatchDevelopment";
import { deletePlanItemDevelopment } from "@/lib/domain/development/deletePlanItemDevelopment";
import { deleteWeeklyPlanDevelopment } from "@/lib/domain/development/deleteWeeklyPlanDevelopment";
import type { ActionResult } from "@/lib/domain/results";

export async function previewDeleteBatchDevelopmentAction(
  batchId: string,
) {
  return previewDeleteBatchDevelopment(batchId);
}

export async function deleteBatchDevelopmentAction(
  batchId: string,
): Promise<ActionResult<{ batchId: string }>> {
  const result = await deleteBatchDevelopment(batchId);
  if (result.ok) {
    revalidatePath("/planning");
    revalidatePath("/402");
  }
  return result;
}

export async function deletePlanItemDevelopmentAction(
  planItemId: string,
  planId: string,
): Promise<
  ActionResult<{ planItemId: string; planRevertedToDraft: boolean }>
> {
  const result = await deletePlanItemDevelopment(planItemId);
  if (result.ok) {
    revalidatePath(`/planning/${planId}`);
    revalidatePath("/planning");
    revalidatePath("/402");
  }
  return result;
}

export async function deleteWeeklyPlanDevelopmentAction(
  planId: string,
): Promise<ActionResult<{ planId: string }>> {
  const result = await deleteWeeklyPlanDevelopment(planId);
  if (result.ok) {
    revalidatePath("/planning");
    revalidatePath("/402");
  }
  return result;
}
