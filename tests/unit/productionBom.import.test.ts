import { describe, expect, it } from "vitest";
import * as path from "node:path";
import {
  loadBomLineRows,
  loadMaterialMapRows,
} from "@/lib/import/productionBomData";
import { loadSkuMasterRows } from "@/lib/import/skuMasterData";
import { SKU_CODE_ALIASES } from "@/lib/import/skuMasterData";

const workbook = path.join(
  process.cwd(),
  "data",
  "master",
  "Vaxa_SKU_Master_and_BOM_Import_v1.xlsx",
);

describe("master workbook structure", () => {
  it("has expected SKU and BOM counts", () => {
    const skus = loadSkuMasterRows(workbook);
    expect(skus.length).toBe(46);
    const active = skus.filter(
      (r) => String(r["Lifecycle Status"]).toUpperCase() !== "DISCONTINUED",
    );
    expect(active.length).toBe(42);

    const lines = loadBomLineRows(workbook);
    expect(lines.length).toBe(108);
    const bomSkus = new Set(lines.map((r) => r.BOM_SKU));
    expect(bomSkus.size).toBe(44);
    const activeBom = lines.filter(
      (r) => r["Import Action"] === "IMPORT_ACTIVE_BOM",
    );
    expect(new Set(activeBom.map((r) => r.BOM_SKU)).size).toBe(42);

    const map = loadMaterialMapRows(workbook);
    expect(map.length).toBe(5);
  });

  it("defines canonical SKU aliases", () => {
    expect(SKU_CODE_ALIASES.PL_TARRAGON).toBe("PL_TARRAGON_MEXICAN");
    expect(SKU_CODE_ALIASES.PU_TOON_SHOOT).toBe("PU_TOON_SHOOTS");
  });

  it("PU_RED_RADISH BOM uses authoritative seed qty not SKU master", () => {
    const lines = loadBomLineRows(workbook).filter(
      (r) => r.BOM_SKU === "PU_RED_RADISH",
    );
    const seed = lines.find((r) => r["Line Type"] === "SEED");
    expect(seed?.["Qty / Production Unit"]).toBe(2.43);
    const skus = loadSkuMasterRows(workbook);
    const master = skus.find((r) => r.SKU === "PU_RED_RADISH");
    expect(master?.["Seeds per unit"]).toBe(1.8);
  });

  it("TR_RED_RADISH has no flat-tray material line", () => {
    const lines = loadBomLineRows(workbook).filter(
      (r) => r.BOM_SKU === "TR_RED_RADISH" && r["Line Type"] === "MATERIAL",
    );
    expect(lines.length).toBe(1);
    expect(lines[0]?.["Source Item Code"]).toBe("RM-G-015");
  });
});
