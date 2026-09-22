"use server";

import { revalidatePath } from "next/cache";
import { extendGermination } from "@/lib/domain/germination/extendGermination";
import { moveToNursery } from "@/lib/domain/germination/moveToNursery";
import type { ActionResult } from "@/lib/domain/results";
import type { ExtendGerminationOutcome } from "@/lib/domain/germination/extendGermination";
import type { MoveToNurseryOutcome } from "@/lib/domain/germination/moveToNursery";
import {
  extendGerminationInputSchema,
  moveToNurseryInputSchema,
} from "@/lib/validation/germination";

export async function moveToNurseryAction(
  input: unknown,
): Promise<ActionResult<MoveToNurseryOutcome>> {
  const parsed = moveToNurseryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await moveToNursery(parsed.data);
  if (result.ok) {
    revalidatePath("/402");
    revalidatePath("/batches/active");
    revalidatePath(`/batches/active/${parsed.data.batchId}`);
  }
  return result;
}

export async function extendGerminationAction(
  input: unknown,
): Promise<ActionResult<ExtendGerminationOutcome>> {
  const parsed = extendGerminationInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await extendGermination(parsed.data);
  if (result.ok) {
    revalidatePath("/402");
    revalidatePath("/batches/active");
    revalidatePath(`/batches/active/${parsed.data.batchId}`);
  }
  return result;
}
