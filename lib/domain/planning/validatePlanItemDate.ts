import { isAllowedPlanningDay, plannedDateInIsoWeek } from "@/lib/date";
import { validationError, type ActionValidationError } from "@/lib/domain/results";

export function validatePlanItemPlannedDate(
  plannedDate: Date,
  planWeek: string,
): ActionValidationError | null {
  if (!plannedDateInIsoWeek(plannedDate, planWeek)) {
    return validationError(
      "Planned date must fall within this weekly plan's ISO week",
    );
  }
  if (!isAllowedPlanningDay(plannedDate)) {
    return validationError(
      "Planned date must be a Monday–Friday working day (enable ENABLE_WEEKEND_PLANNING for Sat–Sun in dev)",
    );
  }
  return null;
}
