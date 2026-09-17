import { Prisma, PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as XLSX from "xlsx";

type RawRow = Record<string, unknown>;

function cellString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string") {
    return value.length === 0 ? null : value;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return String(value);
  }
  return String(value);
}

function isNaToken(value: unknown): boolean {
  const s = cellString(value);
  return s !== null && s.trim().toUpperCase() === "N/A";
}

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

export function loadSkuMasterRows(filePath: string): RawRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Workbook not found: ${filePath}`);
  }
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("Workbook has no sheets");
  }
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet missing: ${sheetName}`);
  }
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null });
  return rows.filter((r) => cellString(r.SKU));
}

async function ensureSeedVariety(
  prisma: PrismaClient,
  exactName: string,
) {
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

function skuPayload(row: RawRow, primarySeedVarietyId: string) {
  const code = cellString(row.SKU)!;
  const germinationDays = parseRequiredInt(
    row["DAYS IN GERMINATION"],
    "DAYS IN GERMINATION",
    code,
  );
  const growingDays = parseRequiredInt(
    row["DAYS GROWING"],
    "DAYS GROWING",
    code,
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
    growingMethod: cellString(row.Growing_method),
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
    active: true,
  };
}

export async function importSkuMasterData(
  prisma: PrismaClient,
  filePath: string,
  options?: { logEachRow?: boolean },
) {
  const rows = loadSkuMasterRows(filePath);
  if (rows.length !== 41) {
    console.warn(
      `Expected 41 SKU rows, found ${rows.length} (proceeding anyway)`,
    );
  }

  let skuUpserts = 0;
  let varietiesCreated = 0;
  let varietiesUpdated = 0;
  const varietyNames = new Set<string>();

  for (const row of rows) {
    const seedType = cellString(row.Seed_type);
    if (!seedType) {
      throw new Error(`SKU ${row.SKU}: missing Seed_type`);
    }

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

    const data = skuPayload(row, variety.id);
    await prisma.sku.upsert({
      where: { code: data.code },
      create: data,
      update: data,
    });
    skuUpserts += 1;
    if (options?.logEachRow) {
      console.log(`  upsert ${data.code}`);
    }
  }

  const seedLotCount = await prisma.seedLot.count();
  const materialLotCount = await prisma.materialLot.count();

  return {
    rowsRead: rows.length,
    skuUpserts,
    seedVarietiesTouched: varietyNames.size,
    varietiesCreated,
    varietiesUpdated,
    seedLotCount,
    materialLotCount,
  };
}
