import type { Prisma } from "@prisma/client";
import { TEAM_402_NAME } from "@/lib/constants";
import { validationError, type ActionValidationError } from "@/lib/domain/results";

export async function requireActiveTeam402Worker(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<ActionValidationError | null> {
  const membership = await tx.userTeam.findFirst({
    where: {
      userId,
      active: true,
      user: { active: true },
      team: { name: TEAM_402_NAME, active: true },
    },
  });
  if (!membership) {
    return validationError("Worker is not an active member of team 402");
  }
  return null;
}
