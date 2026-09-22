import { Prisma } from "@prisma/client";

const SEEDING_TASK_UNIQUE = "production_events_seeding_completed_task_key";
const SEEDING_BATCH_UNIQUE = "production_events_seeding_completed_batch_key";
const MOVED_TO_NURSERY_BATCH_UNIQUE =
  "production_events_moved_to_nursery_batch_key";

export function isPrismaUniqueViolation(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function uniqueViolationTargets(
  error: Prisma.PrismaClientKnownRequestError,
): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === "string") {
    return [target];
  }
  return [];
}

export function isSeedingTaskUniqueViolation(
  error: Prisma.PrismaClientKnownRequestError,
): boolean {
  const targets = uniqueViolationTargets(error);
  return targets.some(
    (t) => t.includes(SEEDING_TASK_UNIQUE) || t.includes("production_task_id"),
  );
}

export function isSeedingBatchUniqueViolation(
  error: Prisma.PrismaClientKnownRequestError,
): boolean {
  const targets = uniqueViolationTargets(error);
  return targets.some(
    (t) => t.includes(SEEDING_BATCH_UNIQUE) || t === "batch_id",
  );
}

export function isBatchSkuNumberCollision(
  error: Prisma.PrismaClientKnownRequestError,
): boolean {
  const targets = uniqueViolationTargets(error);
  return targets.some((t) => t.includes("sku_id") && t.includes("visible"));
}

export function isMovedToNurseryBatchUniqueViolation(
  error: Prisma.PrismaClientKnownRequestError,
): boolean {
  const targets = uniqueViolationTargets(error);
  return targets.some((t) => t.includes(MOVED_TO_NURSERY_BATCH_UNIQUE));
}
