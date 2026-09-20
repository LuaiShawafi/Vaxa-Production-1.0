import { describe, expect, it } from "vitest";
import { ProductionFormat, Prisma } from "@prisma/client";
import { unitsPerPhysicalTray } from "@/lib/domain/productionFormat";
import { traysToProductionUnits } from "@/lib/domain/inventory/productionFormatMath";
import { calculateConsumptionForTrayAllocation } from "@/lib/domain/inventory/consumptionCalculator";
import type { BomSnapshotLine } from "@/lib/validation/seeding";

describe("production format", () => {
  it("maps PU/PL/TR units per tray", () => {
    expect(unitsPerPhysicalTray(ProductionFormat.PU)).toBe(42);
    expect(unitsPerPhysicalTray(ProductionFormat.PL)).toBe(192);
    expect(unitsPerPhysicalTray(ProductionFormat.TR)).toBe(1);
  });

  it("converts trays to production units", () => {
    const units = traysToProductionUnits(35, ProductionFormat.PU);
    expect(units.toString()).toBe("1470");
  });
});

describe("consumption calculator", () => {
  const seedLine: BomSnapshotLine = {
    kind: "SEED",
    lineKey: "SEED:00000000-0000-4000-8000-000000000001",
    seedVarietyId: "00000000-0000-4000-8000-000000000001",
    name: "Red Radish",
    qtyPerUnit: 2.43,
    uom: "g",
  };

  it("calculates PU_RED_RADISH seed consumption for 35 trays", () => {
    const result = calculateConsumptionForTrayAllocation(
      ProductionFormat.PU,
      seedLine,
      35,
    );
    expect(result.consumedQuantity.toString()).toBe("3572.1");
    expect(result.consumedUom).toBe("g");
  });

  it("splits multi-lot tray allocations", () => {
    const a = calculateConsumptionForTrayAllocation(
      ProductionFormat.PU,
      seedLine,
      20,
    );
    const b = calculateConsumptionForTrayAllocation(
      ProductionFormat.PU,
      seedLine,
      15,
    );
    expect(a.consumedQuantity.add(b.consumedQuantity).toString()).toBe("3572.1");
    expect(a.consumedQuantity.toString()).toBe("2041.2");
    expect(b.consumedQuantity.toString()).toBe("1530.9");
  });

  it("calculates TR_RED_RADISH seed consumption for 35 trays", () => {
    const trSeed: BomSnapshotLine = {
      ...seedLine,
      qtyPerUnit: 210,
    };
    const result = calculateConsumptionForTrayAllocation(
      ProductionFormat.TR,
      trSeed,
      35,
    );
    expect(result.consumedQuantity.toString()).toBe("7350");
  });
});

describe("ledger balance math", () => {
  it("derives remaining from signed deltas", () => {
    const received = new Prisma.Decimal(1000);
    const consumed = new Prisma.Decimal(-200);
    const adjusted = new Prisma.Decimal(-50);
    const remaining = received.add(consumed).add(adjusted);
    expect(remaining.toString()).toBe("750");
  });
});
