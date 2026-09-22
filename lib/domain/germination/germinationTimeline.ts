import {
  addCalendarDays,
  expectedCompletionFromStageTransition,
  formatDateInput,
  operationalCalendarDaysBetween,
  parseDateInput,
} from "@/lib/date";

export function deriveActualGerminationDays(
  seedingCompletedAt: Date,
  movedToNurseryAt: Date,
): number {
  return operationalCalendarDaysBetween(seedingCompletedAt, movedToNurseryAt);
}

export function deriveExpectedNurseryCompletionAt(
  movedToNurseryAt: Date,
  nurseryDaysSnapshot: number | null,
): Date | null {
  if (nurseryDaysSnapshot == null) {
    return null;
  }
  return expectedCompletionFromStageTransition(
    movedToNurseryAt,
    nurseryDaysSnapshot,
  );
}

export function extendExpectedGerminationAt(
  currentExpectedGerminationAt: Date,
  extensionCalendarDays: number,
): Date {
  const base = parseDateInput(formatDateInput(currentExpectedGerminationAt));
  return addCalendarDays(base, extensionCalendarDays);
}
