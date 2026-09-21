/** Values read from PlanItemForm fields (must match input names in the form). */
export type PlanItemFormPayload = {
  planId: string;
  skuId: string;
  plannedDate: string;
  plannedQuantity: number;
  assignedTeamId: string;
  destinationIdentity: string;
};

export function readPlanItemFormPayload(
  form: FormData,
  planId: string,
): PlanItemFormPayload {
  return {
    planId,
    skuId: String(form.get("skuId")),
    plannedDate: String(form.get("plannedDate")),
    plannedQuantity: Number(form.get("plannedQuantity")),
    assignedTeamId: String(form.get("assignedTeamId")),
    destinationIdentity: String(form.get("destinationIdentity")),
  };
}
