import { z } from "zod";

export const SEEDING_DEVIATION_REASONS = [
  "seed_shortage",
  "material_shortage",
  "equipment_problem",
  "change_in_plans",
  "other",
] as const;

export const LOT_CHANGE_REASONS = [
  "lot_empty",
  "lot_unavailable",
  "material_quality_issue",
  "test",
  "change_in_production_plan",
  "other",
] as const;

export type SeedingDeviationReason = (typeof SEEDING_DEVIATION_REASONS)[number];
export type LotChangeReason = (typeof LOT_CHANGE_REASONS)[number];

export const seedingDeviationReasonSchema = z.enum(SEEDING_DEVIATION_REASONS);
export const lotChangeReasonSchema = z.enum(LOT_CHANGE_REASONS);

export function requiresExplanation(
  reason: SeedingDeviationReason | LotChangeReason,
): boolean {
  return reason === "other";
}

export function lotChangeRequiresExplanation(reason: LotChangeReason): boolean {
  return reason === "other";
}
