import { WeeklyPlanStatus } from "@prisma/client";

export function weeklyPlanStatusLabel(status: WeeklyPlanStatus): string {
  switch (status) {
    case WeeklyPlanStatus.DRAFT:
      return "Draft";
    case WeeklyPlanStatus.PUBLISHED:
      return "Published";
    case WeeklyPlanStatus.ARCHIVED:
      return "Archived";
    default:
      return status;
  }
}

export function weeklyPlanStatusPillTone(
  status: WeeklyPlanStatus,
): "green" | "amber" | "blue" {
  switch (status) {
    case WeeklyPlanStatus.DRAFT:
      return "blue";
    case WeeklyPlanStatus.PUBLISHED:
      return "green";
    case WeeklyPlanStatus.ARCHIVED:
      return "amber";
    default:
      return "blue";
  }
}
