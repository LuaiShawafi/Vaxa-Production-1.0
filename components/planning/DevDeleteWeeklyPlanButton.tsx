"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWeeklyPlanDevelopmentAction } from "@/lib/actions/development";
import { Button } from "@/components/ui/Button";

export function DevDeleteWeeklyPlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            "Dev delete: remove entire weekly plan and all batches/events?",
          )
        ) {
          return;
        }
        startTransition(async () => {
          const result = await deleteWeeklyPlanDevelopmentAction(planId);
          if (result.ok) {
            router.push("/planning");
          } else {
            window.alert(result.message);
          }
        });
      }}
    >
      Dev delete plan
    </Button>
  );
}
