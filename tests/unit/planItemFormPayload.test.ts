import { describe, expect, it } from "vitest";
import { readPlanItemFormPayload } from "@/lib/planning/planItemFormPayload";
import { updatePlanItemSchema } from "@/lib/validation/planning";
import { parseDateInput } from "@/lib/date";

const PLAN_ID = "00000000-0000-4000-8000-000000000001";
const SKU_ID = "00000000-0000-4000-8000-000000000601";
const TEAM_ID = "00000000-0000-4000-8000-000000000402";
const PLAN_ITEM_ID = "00000000-0000-4000-8000-000000000701";

function lockedOpenEditFormData(): FormData {
  const form = new FormData();
  form.set("skuId", SKU_ID);
  form.set("plannedDate", "2099-03-15");
  form.set("plannedQuantity", "40");
  form.set("assignedTeamId", TEAM_ID);
  form.set("destinationIdentity", "418");
  return form;
}

describe("readPlanItemFormPayload", () => {
  it("includes skuId from hidden input when SKU select is locked (published OPEN)", () => {
    const payload = readPlanItemFormPayload(lockedOpenEditFormData(), PLAN_ID);
    expect(payload.skuId).toBe(SKU_ID);

    const parsed = updatePlanItemSchema.safeParse({
      ...payload,
      planItemId: PLAN_ITEM_ID,
      plannedDate: parseDateInput(payload.plannedDate),
    });
    expect(parsed.success).toBe(true);
  });

  it("fails update validation when locked SKU is omitted from FormData", () => {
    const form = lockedOpenEditFormData();
    form.delete("skuId");

    const payload = readPlanItemFormPayload(form, PLAN_ID);
    expect(payload.skuId).toBe("null");

    const parsed = updatePlanItemSchema.safeParse({
      ...payload,
      planItemId: PLAN_ITEM_ID,
      plannedDate: parseDateInput(payload.plannedDate),
    });
    expect(parsed.success).toBe(false);
  });
});
