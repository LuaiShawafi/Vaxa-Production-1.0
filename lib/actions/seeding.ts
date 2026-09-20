"use server";

import { revalidatePath } from "next/cache";
import { completeSeeding } from "@/lib/domain/seeding/completeSeeding";
import { startSeeding } from "@/lib/domain/seeding/startSeeding";
import type { ActionResult } from "@/lib/domain/results";
import { failure, success, validationError } from "@/lib/domain/results";
import type { CompleteSeedingOutcome } from "@/lib/domain/seeding/completeSeeding";
import type { StartSeedingOutcome } from "@/lib/domain/seeding/startSeeding";
import {
  completeSeedingInputSchema,
  startSeedingInputSchema,
} from "@/lib/validation/seeding";
import {
  getSeedTodayTaskInfo,
  getTeam402,
} from "@/lib/db/queries/seeding";
import type { SeedTodayTaskInfo } from "@/lib/types/seedTodayTaskInfo";

export async function startSeedingAction(
  input: {
    productionTaskId: string;
    teamId: string;
    workerUserId: string;
  },
): Promise<ActionResult<StartSeedingOutcome>> {
  const parsed = startSeedingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const result = await startSeeding(parsed.data);
  if (result.ok) {
    revalidatePath("/402");
    revalidatePath(`/402/seeding/${input.productionTaskId}`);
  }
  return result;
}

export async function completeSeedingAction(
  input: unknown,
): Promise<ActionResult<CompleteSeedingOutcome>> {
  const parsed = completeSeedingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation_error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), i.message]),
      ),
    };
  }
  const result = await completeSeeding(parsed.data);
  if (result.ok) {
    // Only revalidate Today — invalidating the complete route refetches the page
    // while status is COMPLETED and would unmount the wizard before success UI runs.
    revalidatePath("/402");
  }
  return result;
}

/**
 * Read-only loader for the Seed Today Info drawer.
 * Does not mutate production state and does not revalidate paths.
 */
export async function loadSeedTodayTaskInfoAction(
  taskId: string,
): Promise<ActionResult<SeedTodayTaskInfo>> {
  if (!taskId || typeof taskId !== "string") {
    return validationError("Missing task id");
  }

  const team = await getTeam402();
  if (!team) {
    return failure("Team 402 is not available");
  }

  try {
    const info = await getSeedTodayTaskInfo(taskId, team.id);
    if (!info) {
      return failure("Task not found for 402");
    }
    return success(info);
  } catch {
    return failure("Could not load batch information");
  }
}
