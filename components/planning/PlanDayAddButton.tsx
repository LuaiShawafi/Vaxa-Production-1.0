"use client";

import { usePlanItemEdit } from "@/components/planning/PlanItemEditController";
import { Button } from "@/components/ui/Button";

export function PlanDayAddButton({
  dateInput,
  weekdayName,
  dayLabel,
}: {
  dateInput: string;
  weekdayName: string;
  dayLabel: string;
}) {
  const { openAdd } = usePlanItemEdit();

  return (
    <Button
      type="button"
      variant="secondary"
      className="min-h-10 border-line/90 bg-surface-2/50 px-3.5 text-body-small font-semibold text-muted shadow-none"
      data-plan-item-add={dateInput}
      aria-label={`Add plan item to ${weekdayName}`}
      onClick={(event) =>
        openAdd(
          {
            kind: "add",
            dateInput,
            weekdayName,
            dayLabel,
          },
          event.currentTarget,
        )
      }
    >
      Add plan item
    </Button>
  );
}
