import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  isBatchSkuNumberCollision,
  isPrismaUniqueViolation,
  isSeedingBatchUniqueViolation,
  isSeedingTaskUniqueViolation,
  uniqueViolationTargets,
} from "@/lib/domain/prismaErrors";

function p2002(target: string | string[]) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });
}

describe("prismaErrors", () => {
  it("detects unique violations", () => {
    expect(isPrismaUniqueViolation(p2002("id"))).toBe(true);
    expect(isPrismaUniqueViolation(new Error("nope"))).toBe(false);
  });

  it("parses unique targets", () => {
    expect(uniqueViolationTargets(p2002(["a", "b"]))).toEqual(["a", "b"]);
    expect(
      uniqueViolationTargets(
        p2002("production_events_seeding_completed_task_key"),
      ),
    ).toEqual(["production_events_seeding_completed_task_key"]);
  });

  it("classifies seeding task vs batch keys", () => {
    expect(
      isSeedingTaskUniqueViolation(
        p2002("production_events_seeding_completed_task_key"),
      ),
    ).toBe(true);
    expect(
      isSeedingBatchUniqueViolation(
        p2002("production_events_seeding_completed_batch_key"),
      ),
    ).toBe(true);
    expect(
      isBatchSkuNumberCollision(
        p2002("batches_sku_id_visible_batch_number_key"),
      ),
    ).toBe(true);
  });
});
