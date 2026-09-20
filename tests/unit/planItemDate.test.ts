import { describe, expect, it, afterEach } from "vitest";
import { isoWeekMondayDate, isoWeekPlanningDaySections } from "@/lib/date";
import { validatePlanItemPlannedDate } from "@/lib/domain/planning/validatePlanItemDate";

describe("plan item planned date", () => {
  const prev = process.env.ENABLE_WEEKEND_PLANNING;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.ENABLE_WEEKEND_PLANNING;
    } else {
      process.env.ENABLE_WEEKEND_PLANNING = prev;
    }
  });

  it("rejects Saturday when weekend planning is off", () => {
    delete process.env.ENABLE_WEEKEND_PLANNING;
    const monday = isoWeekMondayDate("2099-W20");
    const saturday = new Date(monday);
    saturday.setUTCDate(saturday.getUTCDate() + 5);
    const err = validatePlanItemPlannedDate(saturday, "2099-W20");
    expect(err?.message).toContain("Monday–Friday");
  });

  it("allows Saturday when weekend planning is on", () => {
    process.env.ENABLE_WEEKEND_PLANNING = "true";
    const monday = isoWeekMondayDate("2099-W20");
    const saturday = new Date(monday);
    saturday.setUTCDate(saturday.getUTCDate() + 5);
    expect(validatePlanItemPlannedDate(saturday, "2099-W20")).toBeNull();
    const sections = isoWeekPlanningDaySections("2099-W20");
    expect(sections.length).toBe(7);
    expect(sections[5]?.weekdayName).toBe("SATURDAY");
  });
});
