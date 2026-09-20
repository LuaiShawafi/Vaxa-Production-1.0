import { z } from "zod";
import { ALLOWED_DESTINATIONS, PRODUCTION_UOM } from "@/lib/constants";

const isoWeekPattern = /^\d{4}-W\d{2}$/;

export const createWeeklyPlanSchema = z.object({
  week: z
    .string()
    .min(1, "Week is required")
    .regex(isoWeekPattern, "Week must be ISO format, e.g. 2026-W38"),
});

export const planItemBaseSchema = z.object({
  skuId: z.string().uuid("Invalid SKU"),
  plannedDate: z.coerce.date({ message: "Planned date is required" }),
  plannedQuantity: z.coerce
    .number()
    .positive("Planned quantity must be greater than zero"),
  assignedTeamId: z.string().uuid("Invalid team"),
  destinationIdentity: z.enum(ALLOWED_DESTINATIONS, {
    message: "Destination must be a valid room/pool code",
  }),
});

export const createPlanItemSchema = planItemBaseSchema.extend({
  planId: z.string().uuid("Invalid plan"),
});

export const updatePlanItemSchema = planItemBaseSchema.extend({
  planItemId: z.string().uuid("Invalid plan item"),
});

export const publishWeeklyPlanSchema = z.object({
  planId: z.string().uuid("Invalid plan"),
});

export function planItemQuantityUom(): string {
  return PRODUCTION_UOM;
}

export type CreateWeeklyPlanInput = z.infer<typeof createWeeklyPlanSchema>;
export type CreatePlanItemInput = z.infer<typeof createPlanItemSchema>;
export type UpdatePlanItemInput = z.infer<typeof updatePlanItemSchema>;
export type PublishWeeklyPlanInput = z.infer<typeof publishWeeklyPlanSchema>;
