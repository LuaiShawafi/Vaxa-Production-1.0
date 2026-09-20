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
      className="mt-3"
      data-plan-item-add={dateInput}
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
