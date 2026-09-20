import { Prisma, PrismaClient, ProductionFormat } from "@prisma/client";
import { productionFormatFromGrowingMethod } from "@/lib/domain/inventory/mapProductionFormat";
import {
  cellString,
  isNaToken,
  loadSheetRows,
  MASTER_SHEETS,
  type RawRow,
} from "@/lib/import/workbook";

/** Rename legacy DB codes to canonical workbook codes (preserve row id). */
export const SKU_CODE_ALIASES: Record<string, string> = {
  PL_TARRAGON: "PL_TARRAGON_MEXICAN",
  PU_TOON_SHOOT: "PU_TOON_SHOOTS",
  PU_ANISEHYSSOP: "PU_ANISEHYSOP",
};

/** Apply BOM-confirmed master seed identities (PL_CHIVES excluded — master wins). */
export const SEED_IDENTITY_BY_SKU: Record<string, string> = {
  PL_SAGE: "Kryddsalvia Fanni EZ SW",
  PU_CHARD_YELLOW: "Bright Yellow Swiss Chard CN",
  PU_PAK_CHOI_RED: "Pak Choi Purple Rain F1 CN",
  PU_RED_BEET: "Leaf Beet Bulls Blood Vancouver CN",
  PL_ROSEMARY: "Rosmarin Sem",
  PU_ANISEHYSOP: "Anise Hyssop CN",
};

function parseOptionalInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (isNaToken(value)) {
    return null;
  }
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.trunc(n);
}

function parseRequiredInt(value: unknown, field: string, sku: string): number {
  const n = parseOptionalInt(value);
  if (n === null) {
    throw new Error(`SKU ${sku}: missing required integer for ${field}`);
  }
  return n;
}

function parseOptionalDecimal(value: unknown): Prisma.Decimal | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (isNaToken(value)) {
    return null;
  }
  const s = typeof value === "number" ? String(value) : String(value).trim();
  if (s.length === 0) {
    return null;
  }
  return new Prisma.Decimal(s);
}

function productionFormatFromRow(row: RawRow, code: string): ProductionFormat {
  const explicit = cellString(row["Production format"])?.trim().toUpperCase();
  if (explicit === "PU" || explicit === "PL" || explicit === "TR") {
    return explicit as ProductionFormat;
  }
  const growingMethod = cellString(row.Growing_method);
  const fromMethod = productionFormatFromGrowingMethod(growingMethod);
  if (!fromMethod) {
    throw new Error(
      `SKU ${code}: unmapped Production format / Growing_method "${growingMethod ?? ""}"`,
    );
  }
  return fromMethod;
}

function isActiveSkuRow(row: RawRow): boolean {
  const status = cellString(row["Lifecycle Status"])?.trim().toUpperCase();
  return status !== "DISCONTINUED";
}

export function loadSkuMasterRows(filePath: string): RawRow[] {
  const rows = loadSheetRows(filePath, MASTER_SHEETS.skuMaster);
  return rows.filter((r) => cellString(r.SKU));
}

async function ensureSeedVariety(prisma: PrismaClient, exactName: string) {
  const existing = await prisma.seedVariety.findFirst({
    where: { name: exactName },
  });
  if (existing) {
    if (!existing.active) {
      return prisma.seedVariety.update({
        where: { id: existing.id },
        data: { active: true },
      });
    }
    return existing;
  }
  return prisma.seedVariety.create({
    data: { name: exactName, active: true },
  });
}

async function applySkuCodeAliases(prisma: PrismaClient) {
  for (const [legacyCode, canonicalCode] of Object.entries(SKU_CODE_ALIASES)) {
    const legacy = await prisma.sku.findUnique({ where: { code: legacyCode } });
    if (!legacy) {
      continue;
    }
    const canonical = await prisma.sku.findUnique({
      where: { code: canonicalCode },
    });
    if (canonical && canonical.id !== legacy.id) {
      throw new Error(
        `Cannot alias ${legacyCode} → ${canonicalCode}: both SKU records exist`,
      );
    }
    await prisma.sku.update({
      where: { id: legacy.id },
      data: { code: canonicalCode },
    });
  }
}

function resolveSeedTypeForSku(code: string, row: RawRow): string {
  const override = SEED_IDENTITY_BY_SKU[code];
  if (override) {
    return override;
  }
  const seedType = cellString(row.Seed_type);
  if (!seedType) {
    throw new Error(`SKU ${code}: missing Seed_type`);
  }
  return seedType;
}

function stageInt(
  value: unknown,
  field: string,
  code: string,
  active: boolean,
): number {
  if (!active) {
    const optional = parseOptionalInt(value);
    if (optional === null) {
      console.warn(
        `  warn ${code}: discontinued SKU missing ${field}; storing 0 (not for planning)`,
      );
      return 0;
    }
    return optional;
  }
  return parseRequiredInt(value, field, code);
}

function skuPayload(
  row: RawRow,
  primarySeedVarietyId: string,
  active: boolean,
) {
  const code = cellString(row.SKU)!;
  const growingMethod = cellString(row.Growing_method);
  const productionFormat = productionFormatFromRow(row, code);
  const germinationDays = stageInt(
    row["DAYS IN GERMINATION"],
    "DAYS IN GERMINATION",
    code,
    active,
  );
  const growingDays = stageInt(
    row["DAYS GROWING"],
    "DAYS GROWING",
    code,
    active,
  );
  const nurseryDays = parseOptionalInt(row["DAYS IN NURSERY"]);
  const dtmTotalDays = parseOptionalInt(row["DTM TOTAL"]);
  const computedDtm =
    germinationDays + (nurseryDays ?? 0) + growingDays;
  if (dtmTotalDays !== null && dtmTotalDays !== computedDtm) {
    console.warn(
      `  warn ${code}: DTM TOTAL ${dtmTotalDays} ≠ germ+nursery+growing (${computedDtm}); storing spreadsheet value`,
    );
  }

  return {
    code,
    description: cellString(row.DESCRIPTION),
    category: cellString(row.CATEGORY),
    growingMethod,
    productionFormat,
    nurseryDensityPerM2: parseOptionalDecimal(row["Nursery Density (per m2)"]),
    finalDensityPerM2: parseOptionalDecimal(row["Final Density (per m2)"]),
    averageUnitWeightGrams: parseOptionalDecimal(
      row["Average unit weight (grams)"],
    ),
    seedsPerUnit: parseOptionalDecimal(row["Seeds per unit"]),
    seedMeasure: cellString(row["Seed measure"]),
    seedSupplierName: cellString(row["Seed supplier"]),
    harvestsPerYear: parseOptionalInt(row["Total Harvests/year"]),
    dtmTotalDays,
    primarySeedVarietyId,
    germinationDays,
    nurseryDays,
    growingDays,
    active,
  };
}

export type SkuImportResult = {
  rowsRead: number;
  activeSkus: number;
  discontinuedSkus: number;
  skuUpserts: number;
  seedVarietiesTouched: number;
  varietiesCreated: number;
  varietiesUpdated: number;
  seedLotCount: number;
  materialLotCount: number;
};

export async function importSkuMasterData(
  prisma: PrismaClient,
  filePath: string,
  options?: { logEachRow?: boolean },
): Promise<SkuImportResult> {
  await applySkuCodeAliases(prisma);

  const rows = loadSkuMasterRows(filePath);
  if (rows.length !== 46) {
    throw new Error(`Expected 46 SKU rows, found ${rows.length}`);
  }

  let skuUpserts = 0;
  let activeSkus = 0;
  let discontinuedSkus = 0;
  let varietiesCreated = 0;
  let varietiesUpdated = 0;
  const varietyNames = new Set<string>();

  for (const row of rows) {
    const code = cellString(row.SKU)!;
    const active = isActiveSkuRow(row);
    if (active) {
      activeSkus += 1;
    } else {
      discontinuedSkus += 1;
    }

    const seedType = resolveSeedTypeForSku(code, row);
    const before = await prisma.seedVariety.findFirst({
      where: { name: seedType },
    });
    const variety = await ensureSeedVariety(prisma, seedType);
    if (!before) {
      varietiesCreated += 1;
    } else if (!before.active) {
      varietiesUpdated += 1;
    }
    varietyNames.add(seedType);

    const data = skuPayload(row, variety.id, active);
    await prisma.sku.upsert({
      where: { code: data.code },
      create: data,
      update: data,
    });
    skuUpserts += 1;
    if (options?.logEachRow) {
      console.log(`  upsert ${data.code} (${active ? "ACTIVE" : "DISCONTINUED"})`);
    }
  }

  if (activeSkus !== 42 || discontinuedSkus !== 4) {
    throw new Error(
      `SKU lifecycle counts mismatch: active=${activeSkus}, discontinued=${discontinuedSkus}`,
    );
  }

  const seedLotCount = await prisma.seedLot.count();
  const materialLotCount = await prisma.materialLot.count();

  return {
    rowsRead: rows.length,
    activeSkus,
    discontinuedSkus,
    skuUpserts,
    seedVarietiesTouched: varietyNames.size,
    varietiesCreated,
    varietiesUpdated,
    seedLotCount,
    materialLotCount,
  };
}
