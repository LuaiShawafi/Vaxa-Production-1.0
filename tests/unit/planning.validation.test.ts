import { describe, expect, it } from "vitest";
import {
  createWeeklyPlanSchema,
  planItemBaseSchema,
} from "@/lib/validation/planning";

describe("planning validation", () => {
  it("accepts ISO week", () => {
    const r = createWeeklyPlanSchema.safeParse({ week: "2026-W38" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid destination", () => {
    const r = planItemBaseSchema.safeParse({
      skuId: "00000000-0000-4000-8000-000000000601",
      plannedDate: new Date(),
      plannedQuantity: 10,
      assignedTeamId: "00000000-0000-4000-8000-000000000402",
      destinationIdentity: "402t999",
    });
    expect(r.success).toBe(false);
  });

  it("rejects non-positive quantity", () => {
    const r = planItemBaseSchema.safeParse({
      skuId: "00000000-0000-4000-8000-000000000601",
      plannedDate: new Date(),
      plannedQuantity: 0,
      assignedTeamId: "00000000-0000-4000-8000-000000000402",
      destinationIdentity: "402",
    });
    expect(r.success).toBe(false);
  });
});
