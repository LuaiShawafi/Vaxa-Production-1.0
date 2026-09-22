/** V1 operational timezone for cultivation planning and floor work. */
export const OPERATIONAL_TIMEZONE = "Europe/Stockholm";

const stockholmYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: OPERATIONAL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const stockholmDisplayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: OPERATIONAL_TIMEZONE,
  day: "numeric",
  month: "short",
});

const stockholmDateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: OPERATIONAL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Calendar YYYY-MM-DD in Europe/Stockholm for an instant. */
export function operationalDateStringFromInstant(instant: Date): string {
  return stockholmYmdFormatter.format(instant);
}

/** Today's calendar date in Stockholm as YYYY-MM-DD. */
export function operationalTodayString(): string {
  return operationalDateStringFromInstant(new Date());
}

/**
 * Parse YYYY-MM-DD as a calendar date (stored on @db.Date as UTC midnight of that day).
 * The string is the operational (Swedish) calendar date the planner chose.
 */
export function parseDateInput(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Invalid date");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateInput(date: Date): string {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** e.g. "24 Aug" in Stockholm for a stored calendar date. */
export function formatOperationalDayLabel(date: Date): string {
  return stockholmDisplayFormatter.format(date);
}

export function formatOperationalDateTime(instant: Date): string {
  return stockholmDateTimeFormatter.format(instant);
}

/** Inclusive start / exclusive end for matching PlanItem.plannedDate to "today" in Stockholm. */
export function operationalTodayPlannedDateRange(): { start: Date; end: Date } {
  const today = parseDateInput(operationalTodayString());
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: today, end };
}

/** ISO weekday 1=Mon … 7=Sun for a stored calendar date. */
export function isoWeekdayFromCalendarDate(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function isMondayToFriday(date: Date): boolean {
  const wd = isoWeekdayFromCalendarDate(date);
  return wd >= 1 && wd <= 5;
}

/** Monday 00:00 UTC calendar of ISO week `YYYY-Www`. */
export function isoWeekMondayDate(week: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) {
    throw new Error("Invalid ISO week");
  }
  const year = Number(match[1]);
  const weekNum = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Weekday = isoWeekdayFromCalendarDate(jan4);
  const mondayWeek1 = new Date(Date.UTC(year, 0, 4 - (jan4Weekday - 1)));
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(monday.getUTCDate() + (weekNum - 1) * 7);
  return monday;
}

export type WeekdaySection = {
  weekdayName: string;
  date: Date;
  dateInput: string;
  dayLabel: string;
};

const WEEKDAY_NAMES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

const WEEKEND_NAMES = ["SATURDAY", "SUNDAY"] as const;

/** Dev/testing: allow Sat–Sun plan items (see ENABLE_WEEKEND_PLANNING). */
export function isWeekendPlanningEnabled(): boolean {
  return process.env.ENABLE_WEEKEND_PLANNING === "true";
}

/** Whether a calendar date may be used as a plan item planned date. */
export function isAllowedPlanningDay(date: Date): boolean {
  if (isWeekendPlanningEnabled()) {
    const wd = isoWeekdayFromCalendarDate(date);
    return wd >= 1 && wd <= 7;
  }
  return isMondayToFriday(date);
}

function dayNamesForPlanning(): readonly string[] {
  if (isWeekendPlanningEnabled()) {
    return [...WEEKDAY_NAMES, ...WEEKEND_NAMES];
  }
  return WEEKDAY_NAMES;
}

/** Monday–Friday dates for an ISO week (V1 planning working days). */
export function isoWeekWeekdaySections(week: string): WeekdaySection[] {
  return isoWeekPlanningDaySections(week).filter((section) =>
    (WEEKDAY_NAMES as readonly string[]).includes(section.weekdayName),
  );
}

/** Planning UI sections: Mon–Fri, or Mon–Sun when weekend planning is enabled. */
export function isoWeekPlanningDaySections(week: string): WeekdaySection[] {
  const monday = isoWeekMondayDate(week);
  const names = dayNamesForPlanning();
  return names.map((weekdayName, index) => {
    const date = new Date(monday);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      weekdayName,
      date,
      dateInput: formatDateInput(date),
      dayLabel: formatOperationalDayLabel(date),
    };
  });
}

/** ISO week string (e.g. 2026-W38) for a stored calendar date. */
export function isoWeekStringFromCalendarDate(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getUTCDay() + 6) % 7)) /
        7,
    );
  const year = d.getUTCFullYear();
  return `${year}-W${weekNum.toString().padStart(2, "0")}`;
}

export function currentOperationalIsoWeek(): string {
  return isoWeekStringFromCalendarDate(
    parseDateInput(operationalTodayString()),
  );
}

export function plannedDateInIsoWeek(plannedDate: Date, week: string): boolean {
  const monday = isoWeekMondayDate(week);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 7);
  return plannedDate >= monday && plannedDate < sunday;
}

/** Add calendar days to a stored date (UTC calendar arithmetic). */
export function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Expected assessment instant: start of the target calendar day (Stockholm date string)
 * stored as UTC midnight, consistent with plannedDate.
 */
export function expectedDateFromOperationalBase(
  baseInstant: Date,
  calendarDaysToAdd: number,
): Date {
  const baseYmd = operationalDateStringFromInstant(baseInstant);
  const base = parseDateInput(baseYmd);
  return addCalendarDays(base, calendarDaysToAdd);
}

/**
 * Operational calendar days elapsed between two instants (Stockholm calendar dates).
 * Same convention as expectedGerminationAt: difference in YYYY-MM-DD calendar days.
 */
export function operationalCalendarDaysBetween(
  fromInstant: Date,
  toInstant: Date,
): number {
  const from = parseDateInput(operationalDateStringFromInstant(fromInstant));
  const to = parseDateInput(operationalDateStringFromInstant(toInstant));
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** Expected completion date from a stage transition instant + configured stage days. */
export function expectedCompletionFromStageTransition(
  transitionInstant: Date,
  stageDays: number,
): Date {
  return expectedDateFromOperationalBase(transitionInstant, stageDays);
}
