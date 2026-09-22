import { z } from "zod";
import { ALLOWED_DESTINATIONS } from "@/lib/constants";

export const DESTINATION_CHANGE_REASONS = [
  "change_in_production_plan",
  "capacity",
  "material_quality",
  "test",
  "other",
] as const;

export type DestinationChangeReason =
  (typeof DESTINATION_CHANGE_REASONS)[number];

export const destinationChangeReasonSchema = z.enum(DESTINATION_CHANGE_REASONS);

export const changeBatchDestinationSchema = z.object({
  batchId: z.string().uuid(),
  toDestination: z.enum(ALLOWED_DESTINATIONS),
  initiatedByUserId: z.string().uuid(),
  reasonCode: destinationChangeReasonSchema,
  explanation: z.string().optional(),
});

export type ChangeBatchDestinationInput = z.infer<
  typeof changeBatchDestinationSchema
>;

export function destinationChangeRequiresExplanation(
  reason: DestinationChangeReason,
): boolean {
  return reason === "other";
}
