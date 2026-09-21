import { describe, expect, it } from "vitest";
import { ProductionFormat } from "@prisma/client";
import { formatPlanItemProductionUnits } from "@/lib/planning/planItemWeekDetailPresentation";

describe("formatPlanItemProductionUnits", () => {
  it("converts planned trays using SKU production format", () => {
    expect(formatPlanItemProductionUnits(35, ProductionFormat.PU)).toBe(
      "1,470",
    );
    expect(formatPlanItemProductionUnits(35, ProductionFormat.PL)).toBe(
      "6,720",
    );
    expect(formatPlanItemProductionUnits(35, ProductionFormat.TR)).toBe("35");
  });
});
