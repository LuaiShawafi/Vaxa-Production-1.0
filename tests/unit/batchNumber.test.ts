import { describe, expect, it } from "vitest";
import { deriveVisibleBatchNumber } from "@/lib/domain/batchNumber";

describe("deriveVisibleBatchNumber", () => {
  it("formats DDMM + destination", () => {
    const date = new Date(Date.UTC(2026, 8, 9));
    expect(deriveVisibleBatchNumber(date, "402")).toBe("0909402");
  });
});
