import { ProductionFormat } from "@prisma/client";

export type ProductionFormatConfig = {
  format: ProductionFormat;
  productionUnitLabel: string;
  unitsPerPhysicalTray: number;
};

const CONFIG: Record<ProductionFormat, ProductionFormatConfig> = {
  PU: {
    format: ProductionFormat.PU,
    productionUnitLabel: "punnet",
    unitsPerPhysicalTray: 42,
  },
  PL: {
    format: ProductionFormat.PL,
    productionUnitLabel: "plug",
    unitsPerPhysicalTray: 192,
  },
  TR: {
    format: ProductionFormat.TR,
    productionUnitLabel: "flat tray",
    unitsPerPhysicalTray: 1,
  },
};

export function getProductionFormatConfig(
  format: ProductionFormat,
): ProductionFormatConfig {
  return CONFIG[format];
}

export function unitsPerPhysicalTray(format: ProductionFormat): number {
  return CONFIG[format].unitsPerPhysicalTray;
}
