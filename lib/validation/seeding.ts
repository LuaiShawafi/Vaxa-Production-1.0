import { z } from "zod";
import { PRODUCTION_UOM } from "@/lib/constants";
import {
  lotChangeReasonSchema,
  requiresExplanation,
  seedingDeviationReasonSchema,
} from "@/lib/validation/reasons";

export const preselectedLotEntrySchema = z
  .object({
    lotType: z.enum(["SEED", "MATERIAL"]),
    seedLotId: z.string().uuid().optional(),
    materialLotId: z.string().uuid().optional(),
    lotNumber: z.string().min(1),
    materialId: z.string().uuid().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.lotType === "SEED" && !val.seedLotId) {
      ctx.addIssue({
        code: "custom",
        message: "seedLotId required for SEED",
        path: ["seedLotId"],
      });
    }
    if (val.lotType === "MATERIAL" && !val.materialLotId) {
      ctx.addIssue({
        code: "custom",
        message: "materialLotId required for MATERIAL",
        path: ["materialLotId"],
      });
    }
  });

export const bomSnapshotLineSchema = z
  .object({
    lineKey: z.string().min(1),
    kind: z.enum(["SEED", "MATERIAL"]),
    materialId: z.string().uuid().optional(),
    seedVarietyId: z.string().uuid().optional(),
    name: z.string().min(1),
    qtyPerUnit: z.number().positive(),
    uom: z.string().min(1),
  })
  .superRefine((line, ctx) => {
    if (line.kind === "SEED" && !line.seedVarietyId) {
      ctx.addIssue({
        code: "custom",
        message: "seedVarietyId required for SEED line",
        path: ["seedVarietyId"],
      });
    }
    if (line.kind === "MATERIAL" && !line.materialId) {
      ctx.addIssue({
        code: "custom",
        message: "materialId required for MATERIAL line",
        path: ["materialId"],
      });
    }
    if (line.kind === "SEED" && line.materialId) {
      ctx.addIssue({ code: "custom", message: "SEED line cannot have materialId" });
    }
    if (line.kind === "MATERIAL" && line.seedVarietyId) {
      ctx.addIssue({
        code: "custom",
        message: "MATERIAL line cannot have seedVarietyId",
      });
    }
  });

export const bomSnapshotSchema = z.object({
  sourceBomId: z.string().uuid(),
  type: z.literal("PROD"),
  ready: z.boolean(),
  lines: z.array(bomSnapshotLineSchema).min(1),
});

export type BomSnapshotLine = z.infer<typeof bomSnapshotLineSchema>;

const decimalQuantity = z.coerce.number().positive("Quantity must be greater than zero");

export const seedLotAllocationInputSchema = z.object({
  seedLotId: z.string().uuid(),
  quantity: decimalQuantity,
  quantityUom: z.literal(PRODUCTION_UOM),
  changeFromPreselected: z.boolean().default(false),
  changeReason: lotChangeReasonSchema.optional(),
  notes: z.string().optional(),
});

export const materialLotAllocationInputSchema = z.object({
  materialLotId: z.string().uuid(),
  materialId: z.string().uuid(),
  quantity: decimalQuantity,
  quantityUom: z.literal(PRODUCTION_UOM),
  changeFromPreselected: z.boolean().default(false),
  changeReason: lotChangeReasonSchema.optional(),
  notes: z.string().optional(),
});

export const startSeedingInputSchema = z.object({
  productionTaskId: z.string().uuid(),
  teamId: z.string().uuid(),
  workerUserId: z.string().uuid(),
});

export const completeSeedingInputSchema = z
  .object({
    productionTaskId: z.string().uuid(),
    teamId: z.string().uuid(),
    actualQuantity: decimalQuantity,
    participantUserIds: z.array(z.string().uuid()).min(1),
    seedLotAllocations: z.array(seedLotAllocationInputSchema).min(1),
    materialLotAllocations: z.array(materialLotAllocationInputSchema),
    deviationReason: seedingDeviationReasonSchema.optional(),
    deviationExplanation: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    for (const [i, alloc] of val.seedLotAllocations.entries()) {
      if (alloc.changeFromPreselected && !alloc.changeReason) {
        ctx.addIssue({
          code: "custom",
          message: "Change reason required when lot differs from preselected",
          path: ["seedLotAllocations", i, "changeReason"],
        });
      }
      if (
        alloc.changeReason &&
        requiresExplanation(alloc.changeReason) &&
        !alloc.notes?.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Explanation required for Other",
          path: ["seedLotAllocations", i, "notes"],
        });
      }
      if (alloc.changeReason === "test" && alloc.notes?.trim()) {
        /* test allows empty notes */
      }
    }
    for (const [i, alloc] of val.materialLotAllocations.entries()) {
      if (alloc.changeFromPreselected && !alloc.changeReason) {
        ctx.addIssue({
          code: "custom",
          message: "Change reason required when lot differs from preselected",
          path: ["materialLotAllocations", i, "changeReason"],
        });
      }
      if (
        alloc.changeReason &&
        requiresExplanation(alloc.changeReason) &&
        !alloc.notes?.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Explanation required for Other",
          path: ["materialLotAllocations", i, "notes"],
        });
      }
    }
    if (val.deviationReason && requiresExplanation(val.deviationReason)) {
      if (!val.deviationExplanation?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Explanation required for Other deviation reason",
          path: ["deviationExplanation"],
        });
      }
    }
  });

export type StartSeedingInput = z.infer<typeof startSeedingInputSchema>;
export type CompleteSeedingInput = z.infer<typeof completeSeedingInputSchema>;
export type BomSnapshot = z.infer<typeof bomSnapshotSchema>;
export type PreselectedLotEntry = z.infer<typeof preselectedLotEntrySchema>;

/** Sum allocation quantities; all must use production UOM (trays). */
export function sumAllocationQuantities(
  allocations: { quantity: number }[],
): number {
  return allocations.reduce((sum, a) => sum + a.quantity, 0);
}

export function quantitiesEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) <= epsilon;
}
