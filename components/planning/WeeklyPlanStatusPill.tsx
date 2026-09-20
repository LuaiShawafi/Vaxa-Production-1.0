import { WeeklyPlanStatus } from "@prisma/client";
import { Pill } from "@/components/ui/Pill";
import {
  weeklyPlanStatusLabel,
  weeklyPlanStatusPillTone,
} from "@/components/planning/weeklyPlanStatusPresentation";

export function WeeklyPlanStatusPill({ status }: { status: WeeklyPlanStatus }) {
  return (
    <Pill tone={weeklyPlanStatusPillTone(status)}>
      {weeklyPlanStatusLabel(status)}
    </Pill>
  );
}
