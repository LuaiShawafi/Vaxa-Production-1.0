import * as fs from "node:fs";
import * as XLSX from "xlsx";

export const DEFAULT_MASTER_WORKBOOK = "data/master/Vaxa_SKU_Master_and_BOM_Import_v1.xlsx";

export const MASTER_SHEETS = {
  skuMaster: "SKU_MASTER_UPDATED",
  bomLines: "BOM_LINES",
  materialMap: "MATERIAL_MAP",
  seedIdentityReview: "SEED_IDENTITY_REVIEW",
} as const;

export type RawRow = Record<string, unknown>;

export function cellString(value: unknown): string | null {
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

export function isNaToken(value: unknown): boolean {
  const s = cellString(value);
  return s !== null && s.trim().toUpperCase() === "N/A";
}

export function loadWorkbook(filePath: string): XLSX.WorkBook {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Workbook not found: ${filePath}`);
  }
  return XLSX.readFile(filePath, { cellDates: false });
}

export function loadSheetRows(
  filePath: string,
  sheetName: string,
): RawRow[] {
  const wb = loadWorkbook(filePath);
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet missing: ${sheetName} in ${filePath}`);
  }
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null });
}
