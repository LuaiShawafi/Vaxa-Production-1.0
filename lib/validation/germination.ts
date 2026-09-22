import { z } from "zod";

export const GERMINATION_EXTENSION_PRESETS = ["PLUS_1", "PLUS_2", "PLUS_3"] as const;

export type GerminationExtensionPreset =
  (typeof GERMINATION_EXTENSION_PRESETS)[number];

export const germinationExtensionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("PLUS_1") }),
  z.object({ kind: z.literal("PLUS_2") }),
  z.object({ kind: z.literal("PLUS_3") }),
  z.object({
    kind: z.literal("CUSTOM"),
    customDays: z.coerce.number().int().min(1).max(365),
  }),
]);

export const moveToNurseryInputSchema = z.object({
  batchId: z.string().uuid(),
  initiatedByUserId: z.string().uuid(),
});

export const extendGerminationInputSchema = z.object({
  batchId: z.string().uuid(),
  initiatedByUserId: z.string().uuid(),
  extension: germinationExtensionSchema,
});

export type MoveToNurseryInput = z.infer<typeof moveToNurseryInputSchema>;
export type ExtendGerminationInput = z.infer<typeof extendGerminationInputSchema>;

export function extensionDaysFromInput(
  extension: ExtendGerminationInput["extension"],
): number {
  switch (extension.kind) {
    case "PLUS_1":
      return 1;
    case "PLUS_2":
      return 2;
    case "PLUS_3":
      return 3;
    case "CUSTOM":
      return extension.customDays;
    default:
      return 1;
  }
}

export function germinationExtensionReasonCode(
  extension: ExtendGerminationInput["extension"],
): string {
  return extension.kind;
}

export function germinationExtensionExplanation(
  extension: ExtendGerminationInput["extension"],
): string | null {
  if (extension.kind === "CUSTOM") {
    return String(extension.customDays);
  }
  return null;
}
