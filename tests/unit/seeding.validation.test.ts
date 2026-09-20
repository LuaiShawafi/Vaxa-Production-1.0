import { describe, expect, it } from "vitest";
import {
  completeSeedingInputSchema,
  quantitiesEqual,
  sumAllocationQuantities,
} from "@/lib/validation/seeding";
import { PRODUCTION_UOM } from "@/lib/constants";

const taskId = "00000000-0000-4000-8000-000000000001";
const teamId = "00000000-0000-4000-8000-000000000402";
const userId = "00000000-0000-4000-8000-000000000410";
const seedLot = "00000000-0000-4000-8000-000000000701";

describe("seeding validation", () => {
  it("requires deviation explanation for other", () => {
    const r = completeSeedingInputSchema.safeParse({
      productionTaskId: taskId,
      teamId,
      actualQuantity: 30,
      participantUserIds: [userId],
      seedLotAllocations: [
        {
          seedLotId: seedLot,
          quantity: 30,
          quantityUom: PRODUCTION_UOM,
          changeFromPreselected: false,
        },
      ],
      materialLotAllocations: [],
      deviationReason: "other",
    });
    expect(r.success).toBe(false);
  });

  it("allows test lot change without notes", () => {
    const r = completeSeedingInputSchema.safeParse({
      productionTaskId: taskId,
      teamId,
      actualQuantity: 35,
      participantUserIds: [userId],
      seedLotAllocations: [
        {
          seedLotId: seedLot,
          quantity: 35,
          quantityUom: PRODUCTION_UOM,
          changeFromPreselected: true,
          changeReason: "test",
        },
      ],
      materialLotAllocations: [],
    });
    expect(r.success).toBe(true);
  });

  it("sums allocations", () => {
    expect(sumAllocationQuantities([{ quantity: 25 }, { quantity: 10 }])).toBe(
      35,
    );
    expect(quantitiesEqual(35, 35)).toBe(true);
    expect(quantitiesEqual(35, 30)).toBe(false);
  });
});
