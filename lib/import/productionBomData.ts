import { Prisma, PrismaClient } from "@prisma/client";
import {
  cellString,
  loadSheetRows,
  MASTER_SHEETS,
  type RawRow,
} from "@/lib/import/workbook";

const IMPORT_ACTIVE = "IMPORT_ACTIVE_BOM";

export type BomLineSourceRow = RawRow;

export function loadBomLineRows(filePath: string): BomLineSourceRow[] {
  return loadSheetRows(filePath, MASTER_SHEETS.bomLines);
}

export function loadMaterialMapRows(filePath: string): RawRow[] {
  return loadSheetRows(filePath, MASTER_SHEETS.materialMap);
}

function parseQty(value: unknown, sku: string, line: string): Prisma.Decimal {
  if (value === undefined || value === null || value === "") {
    throw new Error(`BOM ${sku}: missing quantity on ${line}`);
  }
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) {
    throw new Error(`BOM ${sku}: invalid quantity on ${line}`);
  }
  return new Prisma.Decimal(String(n));
}

function canonicalMaterialUom(
  materialCode: string,
  mapByCode: Map<string, string>,
): string {
  const uom = mapByCode.get(materialCode);
  if (!uom) {
    throw new Error(`Unknown material code ${materialCode} (not in MATERIAL_MAP)`);
  }
  return uom;
}

export async function ensureMaterialsFromMap(
  prisma: PrismaClient,
  filePath: string,
): Promise<Map<string, string>> {
  const rows = loadMaterialMapRows(filePath);
  const codeToId = new Map<string, string>();

  for (const row of rows) {
    const code = cellString(row["Material Code"]);
    const name = cellString(row["BOM Description"]);
    const uom = cellString(row["Canonical App UOM"]);
    if (!code || !name || !uom) {
      throw new Error("MATERIAL_MAP row missing code, description, or UOM");
    }

    const existing = await prisma.material.findFirst({ where: { code } });
    const material = existing
      ? await prisma.material.update({
          where: { id: existing.id },
          data: { name, unitOfMeasure: uom, active: true, code },
        })
      : await prisma.material.create({
          data: { code, name, unitOfMeasure: uom, active: true },
        });
    codeToId.set(code, material.id);
  }

  return codeToId;
}

export type ProductionBomImportResult = {
  sourceBomSkus: number;
  activeBomSkus: number;
  referenceOnlyBomSkus: number;
  sourceItemLines: number;
  activeBomLinesWritten: number;
  bomsUpserted: number;
  bomsDeactivated: number;
};

export async function importProductionBoms(
  prisma: PrismaClient,
  filePath: string,
  options?: { logEachSku?: boolean },
): Promise<ProductionBomImportResult> {
  const materialMapRows = loadMaterialMapRows(filePath);
  const mapUom = new Map<string, string>();
  for (const row of materialMapRows) {
    const code = cellString(row["Material Code"]);
    const uom = cellString(row["Canonical App UOM"]);
    if (code && uom) {
      mapUom.set(code, uom);
    }
  }

  const materialIdByCode = await ensureMaterialsFromMap(prisma, filePath);
  const allLines = loadBomLineRows(filePath);

  if (allLines.length !== 108) {
    throw new Error(`Expected 108 BOM_LINES rows, found ${allLines.length}`);
  }

  const sourceBomSkus = new Set(
    allLines.map((r) => cellString(r.BOM_SKU)).filter(Boolean) as string[],
  );
  if (sourceBomSkus.size !== 44) {
    throw new Error(`Expected 44 source BOM SKUs, found ${sourceBomSkus.size}`);
  }

  const activeLines = allLines.filter(
    (r) => cellString(r["Import Action"]) === IMPORT_ACTIVE,
  );
  const referenceLines = allLines.filter(
    (r) => cellString(r["Import Action"]) !== IMPORT_ACTIVE,
  );

  const activeBomSkus = new Set(
    activeLines.map((r) => cellString(r.BOM_SKU)).filter(Boolean) as string[],
  );
  const referenceBomSkus = new Set(
    referenceLines.map((r) => cellString(r.BOM_SKU)).filter(Boolean) as string[],
  );

  if (activeBomSkus.size !== 42) {
    throw new Error(`Expected 42 active BOM SKUs, found ${activeBomSkus.size}`);
  }
  if (referenceBomSkus.size !== 2) {
    throw new Error(
      `Expected 2 reference-only BOM SKUs, found ${referenceBomSkus.size}`,
    );
  }

  let bomsUpserted = 0;
  let bomsDeactivated = 0;
  let activeBomLinesWritten = 0;

  for (const refSku of referenceBomSkus) {
    const sku = await prisma.sku.findUnique({ where: { code: refSku } });
    if (!sku) {
      continue;
    }
    const deactivated = await prisma.bom.updateMany({
      where: { skuId: sku.id, type: "PROD", active: true },
      data: { active: false, ready: false },
    });
    bomsDeactivated += deactivated.count;
  }

  const linesBySku = new Map<string, BomLineSourceRow[]>();
  for (const line of activeLines) {
    const sku = cellString(line.BOM_SKU);
    if (!sku) {
      continue;
    }
    const bucket = linesBySku.get(sku) ?? [];
    bucket.push(line);
    linesBySku.set(sku, bucket);
  }

  for (const skuCode of [...activeBomSkus].sort()) {
    const sku = await prisma.sku.findUnique({ where: { code: skuCode } });
    if (!sku) {
      throw new Error(`Active BOM SKU ${skuCode} not found in database`);
    }
    if (!sku.active) {
      throw new Error(`BOM import for inactive SKU ${skuCode}`);
    }

    const skuLines = linesBySku.get(skuCode) ?? [];
    if (skuLines.length === 0) {
      throw new Error(`No BOM lines for active SKU ${skuCode}`);
    }

    const seedMeasure = sku.seedMeasure;
    if (!seedMeasure) {
      throw new Error(`SKU ${skuCode}: missing seedMeasure for BOM seed UOM`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.bom.updateMany({
        where: { skuId: sku.id, type: "PROD", active: true },
        data: { active: false },
      });

      const bom = await tx.bom.create({
        data: {
          skuId: sku.id,
          type: "PROD",
          active: true,
          ready: true,
        },
      });

      let sortIndex = 0;
      for (const line of skuLines) {
        const lineType = cellString(line["Line Type"])?.toUpperCase();
        const qty = parseQty(
          line["Qty / Production Unit"],
          skuCode,
          lineType ?? "?",
        );

        if (lineType === "MATERIAL") {
          const materialCode = cellString(line["Source Item Code"]);
          if (!materialCode) {
            throw new Error(`BOM ${skuCode}: material line missing code`);
          }
          const materialId = materialIdByCode.get(materialCode);
          if (!materialId) {
            throw new Error(
              `BOM ${skuCode}: material ${materialCode} not in master`,
            );
          }
          const uom = canonicalMaterialUom(materialCode, mapUom);
          await tx.bomLine.create({
            data: {
              bomId: bom.id,
              materialId,
              qtyPerUnit: qty,
              unitOfMeasure: uom,
              sortIndex,
            },
          });
          sortIndex += 1;
          activeBomLinesWritten += 1;
          continue;
        }

        if (lineType === "SEED") {
          if (skuCode === "PL_CHIVES") {
            const masterName = cellString(line["SeedVariety Master Name"]);
            const variety = await tx.seedVariety.findUnique({
              where: { id: sku.primarySeedVarietyId },
            });
            if (!variety || (masterName && variety.name !== masterName)) {
              throw new Error(
                `PL_CHIVES: BOM seed line must use SKU master variety, not BOM label`,
              );
            }
          }

          await tx.bomLine.create({
            data: {
              bomId: bom.id,
              seedVarietyId: sku.primarySeedVarietyId,
              qtyPerUnit: qty,
              unitOfMeasure: seedMeasure,
              sortIndex,
            },
          });
          sortIndex += 1;
          activeBomLinesWritten += 1;
          continue;
        }

        throw new Error(
          `BOM ${skuCode}: unsupported line type ${lineType} (resource rows must be excluded)`,
        );
      }
    });

    bomsUpserted += 1;
    if (options?.logEachSku) {
      console.log(`  PROD BOM ${skuCode} (${skuLines.length} lines)`);
    }
  }

  const activeSkuCount = await prisma.sku.count({ where: { active: true } });
  const activeBomCount = await prisma.bom.count({
    where: { type: "PROD", active: true, ready: true },
  });
  if (activeBomCount !== activeSkuCount) {
    throw new Error(
      `After import: active PROD BOMs (${activeBomCount}) ≠ active SKUs (${activeSkuCount})`,
    );
  }

  return {
    sourceBomSkus: sourceBomSkus.size,
    activeBomSkus: activeBomSkus.size,
    referenceOnlyBomSkus: referenceBomSkus.size,
    sourceItemLines: allLines.length,
    activeBomLinesWritten,
    bomsUpserted,
    bomsDeactivated,
  };
}
