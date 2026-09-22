"use server";

import { revalidatePath } from "next/cache";
import { changeBatchDestination } from "@/lib/domain/batches/changeBatchDestination";
import type { ActionResult } from "@/lib/domain/results";
import { changeBatchDestinationSchema } from "@/lib/validation/destination";

export async function changeBatchDestinationAction(
  input: {
    batchId: string;
    toDestination: string;
    initiatedByUserId: string;
    reasonCode: string;
    explanation?: string;
  },
): Promise<ActionResult<{ productionEventId: string }>> {
  const parsed = changeBatchDestinationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await changeBatchDestination(parsed.data);
  if (result.ok) {
    revalidatePath("/batches/active");
    revalidatePath(`/batches/active/${input.batchId}`);
    revalidatePath("/402");
  }
  return result;
}
