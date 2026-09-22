import { describe, expect, it } from "vitest";
import {
  deriveActualGerminationDays,
  deriveExpectedNurseryCompletionAt,
} from "@/lib/domain/germination/germinationTimeline";
import { parseDateInput } from "@/lib/date";

describe("germination timeline", () => {
  it("counts operational calendar days between seeding and move", () => {
    const seeded = parseDateInput("2099-06-09");
    seeded.setUTCHours(14, 0, 0, 0);
    const moved = parseDateInput("2099-06-11");
    moved.setUTCHours(9, 0, 0, 0);
    expect(deriveActualGerminationDays(seeded, moved)).toBe(2);
  });

  it("derives expected nursery completion from move instant and snapshot", () => {
    const moved = parseDateInput("2099-06-11");
    moved.setUTCHours(10, 0, 0, 0);
    const expected = deriveExpectedNurseryCompletionAt(moved, 3);
    expect(expected).toEqual(parseDateInput("2099-06-14"));
  });

  it("returns null expected nursery when snapshot is missing", () => {
    const moved = parseDateInput("2099-06-11");
    expect(deriveExpectedNurseryCompletionAt(moved, null)).toBeNull();
  });
});
